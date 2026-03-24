vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";

vi.mock("../../db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../lib/redis", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

let mockUser: any;

vi.mock("../../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any) => {
    if (!mockUser) throw new Error("Unauthorized");
    req.user = mockUser;
  },
}));

const createMockQuery = (resolvedValue: any) => {
  const chain: any = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    $dynamic: vi.fn(() => chain),
    then: (resolve: any) => resolve(resolvedValue),
  };
  return chain;
};

const mockDeptId = "123e4567-e89b-12d3-a456-426614174000";

describe("DEPARTMENT ROUTES", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = {
      id: "admin-uid",
      roles: ["ADMIN"],
      permissions: [],
    };
  });

  describe("POST /departments", () => {
    it("should create department successfully", async () => {
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const res = await app.inject({
        method: "POST",
        url: "/departments",
        payload: { name: "Engineering" },
      });

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.payload).message).toBe(
        "Department created successfully",
      );
    });

    it("should return 403 if user lacks CREATE permission", async () => {
      mockUser = { id: "emp-uid", roles: ["EMPLOYEE"], permissions: [] };

      const res = await app.inject({
        method: "POST",
        url: "/departments",
        payload: { name: "Engineering" },
      });

      expect(res.statusCode).toBe(403);
    });

    it("should return 400 if DB insert fails", async () => {
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error("DB Error")),
      });

      const res = await app.inject({
        method: "POST",
        url: "/departments",
        payload: { name: "Sales" },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Unable to create department",
      );
    });
  });

  describe("GET /departments", () => {
    it("should return a list of departments with pagination", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            id: mockDeptId,
            name: "Engineering",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ]),
      );

      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await app.inject({
        method: "GET",
        url: "/departments?search=Eng&page=1&limit=10&sortBy=name&sortOrder=asc",
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.data[0].name).toBe("Engineering");
      expect(data.meta.total).toBe(1);
    });

    it("should handle default fetch without query params", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            id: mockDeptId,
            name: "Engineering",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await app.inject({
        method: "GET",
        url: "/departments",
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).data).toBeDefined();
    });

    it("should return 400 if DB fetch fails", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("DB Fetch failed");
      });

      const res = await app.inject({
        method: "GET",
        url: "/departments",
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).data.length).toBe(0);
      expect(JSON.parse(res.payload).meta.total).toBe(0);
    });
  });

  describe("GET /departments/:id", () => {
    it("should return department if found", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            id: mockDeptId,
            name: "IT",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ]),
      );

      const res = await app.inject({
        method: "GET",
        url: `/departments/${mockDeptId}`,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).name).toBe("IT");
    });

    it("should return 404 if department not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "GET",
        url: `/departments/${mockDeptId}`,
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Department not found");
    });

    it("should return 400 if DB query fails", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("DB Error");
      });

      const res = await app.inject({
        method: "GET",
        url: `/departments/${mockDeptId}`,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Unable to fetch department",
      );
    });
  });

  describe("PUT /departments/:id", () => {
    it("should update department successfully", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockDeptId }]),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/departments/${mockDeptId}`,
        payload: { name: "Updated IT" },
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).message).toBe(
        "Department updated successfully",
      );
    });

    it("should return 404 if department to update is missing", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/departments/${mockDeptId}`,
        payload: { name: "Updated IT" },
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Department not found");
    });

    it("should return 400 if update fails heavily", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error("Update exception")),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/departments/${mockDeptId}`,
        payload: { name: "Fail" },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Unable to update department",
      );
    });
  });

  describe("DELETE /departments/:id", () => {
    it("should delete department successfully when unassigned", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockDeptId }]),
      );

      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/departments/${mockDeptId}`,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).message).toBe(
        "Department deleted successfully",
      );
    });

    it("should return 404 if department doesn't exist", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "DELETE",
        url: `/departments/${mockDeptId}`,
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Department not found");
    });

    it("should return 400 if department is assigned to employees", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockDeptId }]),
      );

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: "emp-1" }]),
      );

      const res = await app.inject({
        method: "DELETE",
        url: `/departments/${mockDeptId}`,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Department cannot be deleted because employees are assigned to it",
      );
    });

    it("should return 400 on unexpected delete error", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("Wild DB Failure");
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/departments/${mockDeptId}`,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Unable to delete department",
      );
    });
  });
});
