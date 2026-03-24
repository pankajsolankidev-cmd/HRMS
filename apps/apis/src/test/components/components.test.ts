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
    selectDistinct: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../lib/redis", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("../../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any) => {
    req.user = { id: "123e4567-e89b-12d3-a456-426614174000", roles: ["ADMIN"] };
  },
}));

const mockUuid = "123e4567-e89b-12d3-a456-426614174000";
const missingUuid = "00000000-0000-0000-0000-000000000000";

describe("COMPONENT ROUTES", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /components", () => {
    it("should create component successfully", async () => {
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const res = await app.inject({
        method: "POST",
        url: "/components",
        payload: { name: "Test Component", code: "TCOMP", description: "Desc" },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.payload);
      expect(json.message).toBe("Component created successfully");
    });

    it("should return 409 if duplicate code", async () => {
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockRejectedValue({ code: "23505" }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/components",
        payload: { name: "Test", code: "DUP" },
      });

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.payload).message).toBe(
        "Component code already exists",
      );
    });

    it("should return 400 if another error occurs during creation", async () => {
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error("Database error")),
      });

      const res = await app.inject({
        method: "POST",
        url: "/components",
        payload: { name: "Test", code: "ERR" },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe("Database error");
    });
  });

  describe("GET /components", () => {
    it("should fetch components with pagination and count", async () => {
      const mockDataQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        $dynamic: vi.fn().mockResolvedValue([{ id: mockUuid, name: "Comp 1" }]),
      };

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      };

      (db.selectDistinct as any).mockReturnValue(mockDataQuery);
      (db.select as any).mockReturnValue(mockCountQuery);

      const res = await app.inject({
        method: "GET",
        url: "/components",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toBeDefined();
      expect(body.meta.total).toBe(1);
    });

    it("should fetch components with search filter and sortOrder", async () => {
      const mockDataQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        $dynamic: vi
          .fn()
          .mockResolvedValue([{ id: missingUuid, name: "Comp 2" }]),
      };

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      };

      (db.selectDistinct as any).mockReturnValue(mockDataQuery);
      (db.select as any).mockReturnValue(mockCountQuery);

      const res = await app.inject({
        method: "GET",
        url: "/components?search=Comp&sortBy=name&sortOrder=asc&excludeAssigned=true",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data[0].id).toBe(missingUuid);
    });

    it("should return 400 if fetch components fails", async () => {
      (db.selectDistinct as any).mockImplementation(() => {
        throw new Error("Query Failed");
      });

      const res = await app.inject({
        method: "GET",
        url: "/components",
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe("Query Failed");
    });
  });

  describe("GET /components/:id", () => {
    it("should return component successfully", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: mockUuid, name: "Test" }]),
      });

      const res = await app.inject({
        method: "GET",
        url: `/components/${mockUuid}`,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).id).toBe(mockUuid);
    });

    it("should return 404 if not found", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      });

      const res = await app.inject({
        method: "GET",
        url: `/components/${missingUuid}`,
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Component not found");
    });

    it("should return 400 if get component by id fails", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("Unable to fetch");
      });

      const res = await app.inject({
        method: "GET",
        url: `/components/${mockUuid}`,
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("PUT /components/:id", () => {
    it("should update component successfully", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockUuid }]),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/components/${mockUuid}`,
        payload: {
          name: "Updated Name",
          code: "UP",
          description: "Updated Desc",
        },
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).message).toBe(
        "Component updated successfully",
      );
    });

    it("should return 404 if component not found for update", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/components/${mockUuid}`,
        payload: { name: "Updated Name" },
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Component not found");
    });

    it("should return 409 if duplicate code on update", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue({ code: "23505" }),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/components/${mockUuid}`,
        payload: { code: "DUP" },
      });

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.payload).message).toBe(
        "Component code already exists",
      );
    });

    it("should return 400 if another error occurs on update", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockRejectedValue(new Error("Update failed")),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/components/${mockUuid}`,
        payload: { name: "Name" },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("DELETE /components/:id", () => {
    it("should delete component if not assigned", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockUuid }]),
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/components/${mockUuid}`,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).message).toBe(
        "Component deleted successfully",
      );
    });

    it("should return 409 if component is assigned", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: mockUuid }]),
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/components/${mockUuid}`,
      });

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.payload).message).toBe(
        "Component is assigned to a system and cannot be deleted",
      );
    });

    it("should return 404 if component not found for delete", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      });

      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/components/${mockUuid}`,
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Component not found");
    });

    it("should return 400 if delete fails with generic error", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("DB Error");
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/components/${mockUuid}`,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe("DB Error");
    });
  });
});
