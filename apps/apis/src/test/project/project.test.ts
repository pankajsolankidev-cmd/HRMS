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
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
    returning: vi.fn(() => chain),
    $dynamic: vi.fn(() => chain),
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    then: vi.fn((onFulfilled) =>
      Promise.resolve(resolvedValue).then(onFulfilled),
    ),
    catch: vi.fn((onRejected) =>
      Promise.resolve(resolvedValue).catch(onRejected),
    ),
  };
  return chain;
};

const mockProjectId = "11111111-1111-1111-1111-111111111111";

describe("Project Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = { id: "user1" };
    (db.select as any).mockReturnValue(createMockQuery([]));
    (db.insert as any).mockReturnValue(createMockQuery([]));
    (db.update as any).mockReturnValue(createMockQuery([]));
  });

  describe("POST /projects", () => {
    it("should create project successfully", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.insert as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );

      const res = await (app.inject({
        method: "POST",
        url: "/projects",
        payload: {
          name: "New Project",
          startDate: "2024-01-01",
          expectedEndDate: "2024-12-31",
          status: "ACTIVE",
        },
      }) as any);

      expect(res.statusCode).toBe(201);
    });

    it("should create project successfully without expectedEndDate", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.insert as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );

      const res = await (app.inject({
        method: "POST",
        url: "/projects",
        payload: {
          name: "Project with no end",
          startDate: "2024-01-01",
          status: "ACTIVE",
        },
      }) as any);

      expect(res.statusCode).toBe(201);
    });

    it("should fail with invalid startDate", async () => {
      const res = await (app.inject({
        method: "POST",
        url: "/projects",
        payload: {
          name: "Invalid",
          startDate: "invalid-date",
        },
      }) as any);

      expect(res.statusCode).toBe(400);
    });

    it("should fail with expectedEndDate before startDate", async () => {
      const res = await (app.inject({
        method: "POST",
        url: "/projects",
        payload: {
          name: "Invalid Dates",
          startDate: "2024-01-01",
          expectedEndDate: "2023-01-01",
        },
      }) as any);

      expect(res.statusCode).toBe(400);
    });

    it("should fail with invalid expectedEndDate format", async () => {
      const res = await (app.inject({
        method: "POST",
        url: "/projects",
        payload: {
          name: "Invalid End Date",
          startDate: "2024-01-01",
          expectedEndDate: "invalid",
        },
      }) as any);

      expect(res.statusCode).toBe(400);
    });

    it("should fail if project name already exists", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );

      const res = await (app.inject({
        method: "POST",
        url: "/projects",
        payload: {
          name: "Existing Project",
          startDate: "2024-01-01",
        },
      }) as any);

      expect(res.statusCode).toBe(409);
    });
  });

  describe("GET /projects", () => {
    it("should fetch projects with filters and default sorting", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId, name: "P1" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await (app.inject({
        method: "GET",
        url: "/projects",
        query: { search: "P1", status: "ACTIVE" },
      }) as any);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data).toHaveLength(1);
    });

    it("should fetch projects with custom sorting", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await (app.inject({
        method: "GET",
        url: "/projects",
        query: {
          sortBy: "startDate",
          sortOrder: "asc",
          limit: "10",
          page: "1",
        },
      }) as any);

      expect(res.statusCode).toBe(200);
    });

    it("should fetch projects with desc custom sorting", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await (app.inject({
        method: "GET",
        url: "/projects",
        query: { sortBy: "name", sortOrder: "desc" },
      }) as any);

      expect(res.statusCode).toBe(200);
    });
  });

  describe("GET /projects/:id", () => {
    it("should fetch project by id successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId, name: "Project 1" }]),
      );

      const res = await (app.inject({
        method: "GET",
        url: `/projects/${mockProjectId}`,
      }) as any);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).id).toBe(mockProjectId);
    });

    it("should return 404 if project not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "GET",
        url: `/projects/${mockProjectId}`,
      }) as any);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("PUT /projects/:id", () => {
    it("should update project successfully (dates update)", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.update as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );

      const res = await (app.inject({
        method: "PUT",
        url: `/projects/${mockProjectId}`,
        payload: {
          name: "Updated Project",
          startDate: "2024-02-01",
          expectedEndDate: "2024-03-01",
        },
      }) as any);

      expect(res.statusCode).toBe(200);
    });

    it("should fail update with invalid startDate", async () => {
      const res = await (app.inject({
        method: "PUT",
        url: `/projects/${mockProjectId}`,
        payload: { startDate: "invalid" },
      }) as any);

      expect(res.statusCode).toBe(400);
    });

    it("should fail update with invalid expectedEndDate format", async () => {
      const res = await (app.inject({
        method: "PUT",
        url: `/projects/${mockProjectId}`,
        payload: { expectedEndDate: "invalid" },
      }) as any);

      expect(res.statusCode).toBe(400);
    });

    it("should fail update with expectedEndDate before updated startDate", async () => {
      const res = await (app.inject({
        method: "PUT",
        url: `/projects/${mockProjectId}`,
        payload: { startDate: "2024-01-01", expectedEndDate: "2023-01-01" },
      }) as any);

      expect(res.statusCode).toBe(400);
    });

    it("should fail if updated name conflicts with another project", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: "other-id" }]),
      );

      const res = await (app.inject({
        method: "PUT",
        url: `/projects/${mockProjectId}`,
        payload: { name: "Other Project Name" },
      }) as any);

      expect(res.statusCode).toBe(409);
    });

    it("should allow name update if name remains same", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );
      (db.update as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );

      const res = await (app.inject({
        method: "PUT",
        url: `/projects/${mockProjectId}`,
        payload: { name: "Same Name" },
      }) as any);

      expect(res.statusCode).toBe(200);
    });

    it("should return 404 if project to update not found", async () => {
      (db.update as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "PUT",
        url: `/projects/${mockProjectId}`,
        payload: { status: "COMPLETED" },
      }) as any);

      expect(res.statusCode).toBe(404);
    });
  });
});
