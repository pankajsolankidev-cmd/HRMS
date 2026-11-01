vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.PORT = "0";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("../../utils/socket", () => ({
  getIO: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  })),
  registerSocket: vi.fn(),
}));

vi.mock("../../lib/redis", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    on: vi.fn(),
    defineCommand: vi.fn(),
  },
}));

let mockUser: any;

vi.mock("../../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any) => {
    req.user = mockUser;
  },
}));

vi.mock("../../middlewares/authorize.middleware", () => ({
  authorize: () => (req: any, res: any, next: any) => next(),
}));

const createMockQuery = (resolvedValue: any) => {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    returning: vi.fn(() => chain),
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    $dynamic: vi.fn(() => chain),
    then: vi.fn((onFulfilled) =>
      Promise.resolve(resolvedValue).then(onFulfilled),
    ),
    catch: vi.fn((onRejected) =>
      Promise.resolve(resolvedValue).catch(onRejected),
    ),
  };
  return chain;
};

const mockSystemId = "11111111-1111-1111-1111-111111111111";

describe("Systems Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = { id: "user1", roles: ["ADMIN"] };
    (db.select as any).mockReturnValue(createMockQuery([]));
    (db.selectDistinct as any).mockReturnValue(createMockQuery([]));
    (db.insert as any).mockReturnValue(createMockQuery([]));
    (db.update as any).mockReturnValue(createMockQuery([]));
    (db.delete as any).mockReturnValue(createMockQuery([]));
    (db.transaction as any).mockImplementation(async (cb: any) => cb(db));
  });

  describe("POST /systems", () => {
    it("should create system successfully without components", async () => {
      (db.insert as any).mockReturnValueOnce(
        createMockQuery([{ id: mockSystemId }]),
      );

      const res = await (app.inject({
        method: "POST",
        url: "/systems",
        payload: { name: "New System" },
      }) as any);

      expect(res.statusCode).toBe(201);
    });

    it("should create system successfully with components", async () => {
      (db.insert as any)
        .mockReturnValueOnce(createMockQuery([{ id: mockSystemId }]))
        .mockReturnValueOnce(createMockQuery([{ id: "sc1" }]));

      const res = await (app.inject({
        method: "POST",
        url: "/systems",
        payload: {
          name: "System with components",
          componentIds: [mockSystemId],
        },
      }) as any);

      expect(res.statusCode).toBe(201);
    });

    it("should return 409 if system name already exists", async () => {
      (db.insert as any).mockImplementationOnce(() => {
        const err: any = new Error("Duplicate");
        err.cause = { code: "23505" };
        throw err;
      });

      const res = await (app.inject({
        method: "POST",
        url: "/systems",
        payload: { name: "Duplicate" },
      }) as any);

      expect(res.statusCode).toBe(409);
    });

    it("should return 400 if components are invalid", async () => {
      (db.insert as any).mockImplementationOnce(() => {
        const err: any = new Error("Invalid FK");
        err.originalError = { code: "23503" };
        throw err;
      });

      const res = await (app.inject({
        method: "POST",
        url: "/systems",
        payload: { name: "Invalid Components", componentIds: [mockSystemId] },
      }) as any);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toContain("invalid");
    });

    it("should return 400 for unexpected errors", async () => {
      (db.insert as any).mockImplementationOnce(() => {
        throw new Error("Boom");
      });

      const res = await (app.inject({
        method: "POST",
        url: "/systems",
        payload: { name: "Boom" },
      }) as any);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toBe("Unable to create system");
    });
  });

  describe("GET /systems", () => {
    it("should fetch systems with search and paginated filters", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.selectDistinct as any).mockReturnValueOnce(
        createMockQuery([{ id: mockSystemId, name: "S1" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ systemId: mockSystemId, component: { id: "c1" } }]),
      );

      const res = await (app.inject({
        method: "GET",
        url: "/systems",
        query: {
          search: "S1",
          limit: "10",
          page: "1",
          excludeAssigned: "true",
        },
      }) as any);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].components).toHaveLength(1);
    });

    it("should return empty list if no systems found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 0 }]));
      (db.selectDistinct as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "GET",
        url: "/systems",
      }) as any);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data).toHaveLength(0);
    });

    it("should use custom sorting", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.selectDistinct as any).mockReturnValueOnce(
        createMockQuery([{ id: mockSystemId }]),
      );

      const res = await (app.inject({
        method: "GET",
        url: "/systems",
        query: { sortBy: "name", sortOrder: "asc" },
      }) as any);

      expect(res.statusCode).toBe(200);
    });
  });

  describe("GET /systems/:id", () => {
    it("should fetch system by id successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockSystemId, name: "S1" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ component: { id: "c1" } }]),
      );

      const res = await (app.inject({
        method: "GET",
        url: `/systems/${mockSystemId}`,
      }) as any);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).components).toHaveLength(1);
    });

    it("should return 404 if system not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "GET",
        url: `/systems/${mockSystemId}`,
      }) as any);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("PUT /systems/:id", () => {
    it("should update system successfully (including components)", async () => {
      (db.update as any).mockReturnValueOnce(
        createMockQuery([{ id: mockSystemId }]),
      );
      (db.delete as any).mockReturnValueOnce(createMockQuery([]));
      (db.insert as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "PUT",
        url: `/systems/${mockSystemId}`,
        payload: { name: "Updated Name", componentIds: [mockSystemId] },
      }) as any);

      expect(res.statusCode).toBe(200);
    });

    it("should return 404 if system not found for update", async () => {
      (db.update as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "PUT",
        url: `/systems/${mockSystemId}`,
        payload: { name: "Non-existent" },
      }) as any);

      expect(res.statusCode).toBe(404);
    });

    it("should return 409 on duplicate component assignment error", async () => {
      (db.update as any).mockReturnValueOnce(
        createMockQuery([{ id: mockSystemId }]),
      );
      (db.delete as any).mockReturnValueOnce(createMockQuery([]));
      (db.insert as any).mockImplementationOnce(() => {
        const err: any = new Error("Unique Constraint");
        err.code = "23505";
        throw err;
      });

      const res = await (app.inject({
        method: "PUT",
        url: `/systems/${mockSystemId}`,
        payload: { componentIds: [mockSystemId] },
      }) as any);

      expect(res.statusCode).toBe(409);
    });

    it("should return 400 for unexpected update error", async () => {
      (db.update as any).mockImplementationOnce(() => {
        throw new Error("Fail");
      });

      const res = await (app.inject({
        method: "PUT",
        url: `/systems/${mockSystemId}`,
        payload: { name: "Fail" },
      }) as any);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toBe("Unable to update system");
    });
  });

  describe("DELETE /systems/:id", () => {
    it("should delete system successfully", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.delete as any).mockReturnValueOnce(
        createMockQuery([{ id: mockSystemId }]),
      );

      const res = await (app.inject({
        method: "DELETE",
        url: `/systems/${mockSystemId}`,
      }) as any);

      expect(res.statusCode).toBe(200);
    });

    it("should return 400 if system is assigned to an employee", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([{ id: "e1" }]));

      const res = await (app.inject({
        method: "DELETE",
        url: `/systems/${mockSystemId}`,
      }) as any);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toContain("assigned");
    });

    it("should return 404 if system not found for deletion", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.delete as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "DELETE",
        url: `/systems/${mockSystemId}`,
      }) as any);

      expect(res.statusCode).toBe(404);
    });
  });
});
