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
    innerJoin: vi.fn(() => chain),
    values: vi.fn(() => chain),
    returning: vi.fn(() => chain),
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
const mockEmployeeId = "22222222-2222-2222-2222-222222222222";

describe("Project-Employee Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = { id: "user1", roles: ["ADMIN"] };
    (db.select as any).mockReturnValue(createMockQuery([]));
    (db.insert as any).mockReturnValue(createMockQuery([]));
    (db.delete as any).mockReturnValue(createMockQuery([]));
    (db.transaction as any).mockImplementation(async (cb: any) => cb(db));
  });

  describe("POST /projects/:id/employees", () => {
    it("should assign employees successfully", async () => {
      (db.select as any)
        .mockReturnValueOnce(
          createMockQuery([{ id: mockProjectId, status: "ACTIVE" }]),
        )
        .mockReturnValueOnce(createMockQuery([{ id: mockEmployeeId }]));

      const res = await (app.inject({
        method: "POST",
        url: `/projects/${mockProjectId}/employees`,
        payload: {
          employeeIds: [mockEmployeeId],
        },
      }) as any);

      expect(res.statusCode).toBe(201);
    });

    it("should return 403 if user is not HR or ADMIN", async () => {
      mockUser = { id: "user2", roles: ["EMPLOYEE"] };

      const res = await (app.inject({
        method: "POST",
        url: `/projects/${mockProjectId}/employees`,
        payload: { employeeIds: [mockEmployeeId] },
      }) as any);

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body).message).toContain("Only HR or ADMIN");
    });

    it("should return 400 for duplicate employeeIds", async () => {
      const res = await (app.inject({
        method: "POST",
        url: `/projects/${mockProjectId}/employees`,
        payload: {
          employeeIds: [mockEmployeeId, mockEmployeeId],
        },
      }) as any);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toBe(
        "Duplicate employeeIds are not allowed",
      );
    });

    it("should return 404 if project not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "POST",
        url: `/projects/${mockProjectId}/employees`,
        payload: { employeeIds: [mockEmployeeId] },
      }) as any);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body).message).toBe("Project not found");
    });

    it("should return 400 if project is COMPLETED", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId, status: "COMPLETED" }]),
      );

      const res = await (app.inject({
        method: "POST",
        url: `/projects/${mockProjectId}/employees`,
        payload: { employeeIds: [mockEmployeeId] },
      }) as any);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toBe(
        "Cannot assign employees to a completed project",
      );
    });

    it("should return 400 if one or more employees are invalid", async () => {
      (db.select as any)
        .mockReturnValueOnce(
          createMockQuery([{ id: mockProjectId, status: "ACTIVE" }]),
        )
        .mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "POST",
        url: `/projects/${mockProjectId}/employees`,
        payload: { employeeIds: [mockEmployeeId] },
      }) as any);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toBe(
        "One or more employees are invalid or inactive",
      );
    });
  });

  describe("GET /projects/:id/employees", () => {
    it("should fetch project employees successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId, firstName: "John" }]),
      );

      const res = await (app.inject({
        method: "GET",
        url: `/projects/${mockProjectId}/employees`,
      }) as any);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data).toHaveLength(1);
    });
  });

  describe("DELETE /projects/:id/employees/:employeeId", () => {
    it("should remove employee from project successfully", async () => {
      (db.delete as any).mockReturnValueOnce(
        createMockQuery([{ id: mockProjectId }]),
      );

      const res = await (app.inject({
        method: "DELETE",
        url: `/projects/${mockProjectId}/employees/${mockEmployeeId}`,
      }) as any);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).message).toContain("successfully");
    });

    it("should return 404 if employee not assigned", async () => {
      (db.delete as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "DELETE",
        url: `/projects/${mockProjectId}/employees/${mockEmployeeId}`,
      }) as any);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body).message).toBe(
        "Employee not assigned to this project",
      );
    });
  });
});
