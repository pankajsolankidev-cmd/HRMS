vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";
import bcrypt from "bcryptjs";

vi.mock("../../db", () => ({
  db: {
    transaction: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
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
    returning: vi.fn(() => resolveAs(resolvedValue)),
    then: (resolve: any) => resolve(resolvedValue),
  };

  const resolveAs = (val: any) => {
    const p = Promise.resolve(val);
    (p as any).from = chain.from;
    (p as any).where = chain.where;
    return p;
  };
  return chain;
};

const mockEmpId = "111e4567-e89b-12d3-a456-426614174011";
const mockUserId = "222e4567-e89b-12d3-a456-426614174022";
const validPositionId = "333e4567-e89b-12d3-a456-426614174033";
const validDepartmentId = "444e4567-e89b-12d3-a456-426614174044";

describe("EMPLOYEE ROUTES", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = { id: "admin-uid", roles: ["ADMIN"], permissions: [] };

    (db.transaction as any).mockImplementation(async (cb: any) => {
      return cb(db);
    });

    (bcrypt.hash as any).mockResolvedValue("hashedPassword");
  });

  describe("POST /employees", () => {
    const validPayload = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      positionId: validPositionId,
      departmentId: validDepartmentId,
      joiningDate: "2026-03-01",
      welcome: {
        welcomewithWhatsapp: true,
        welcomewithGmail: true,
        welcomewithSlack: false,
      },
      documents: {
        generateOfferLetter: true,
        generateAppointmentLetter: false,
      },
    };

    it("should create employee successfully", async () => {
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockUserId }]),
      });

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockEmpId }]),
      });

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ name: "EMPLOYEE" }]),
      );

      (db.select as any).mockReturnValueOnce(createMockQuery([{ id: 1 }]));

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });

      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });

      expect(res.statusCode).toBe(201);
      const data = JSON.parse(res.payload);
      expect(data.message).toBe("Employee created successfully");
      expect(data.employeeId).toBe(mockEmpId);
      expect(data.userId).toBe(mockUserId);
    });

    it("should return 409 if employee email already exists", async () => {
      const err: any = new Error("DB Error");
      err.code = "23505";
      (db.transaction as any).mockRejectedValue(err);

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.payload).message).toBe(
        "Employee with this email already exists",
      );
    });

    it("should return 400 if position is invalid", async () => {
      const err: any = new Error("INVALID_POSITION");
      (db.transaction as any).mockRejectedValue(err);

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe("Invalid position selected");
    });

    it("should successfully create an HR position employee", async () => {
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockUserId }]),
      });
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockEmpId }]),
      });
      (db.select as any).mockReturnValueOnce(createMockQuery([{ name: "HR" }]));
      (db.select as any).mockReturnValueOnce(createMockQuery([{ id: 2 }]));
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(201);
    });

    it("should successfully create an Admin position employee", async () => {
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockUserId }]),
      });
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockEmpId }]),
      });
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ name: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ id: 3 }]));
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(201);
    });

    it("should return 400 if DB lacks role record mapping", async () => {
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockUserId }]),
      });
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockEmpId }]),
      });
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ name: "EMPLOYEE" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Employee role configuration missing",
      );
    });

    it("should return 400 if DB natively lacks position record (INVALID_POSITION)", async () => {
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockUserId }]),
      });
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockEmpId }]),
      });
      (db.select as any).mockReturnValueOnce(createMockQuery([])); // Missing position natively inside tx query!!

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe("Invalid position selected");
    });

    it("should return 400 if role is missing via direct rejection (ROLE_NOT_FOUND)", async () => {
      const err: any = new Error("ROLE_NOT_FOUND");
      (db.transaction as any).mockRejectedValue(err);

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Employee role configuration missing",
      );
    });

    it("should return 403 if user lacks PERMISSIONS", async () => {
      mockUser = { id: "emp-uid", roles: ["EMPLOYEE"], permissions: [] };

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });

      expect(res.statusCode).toBe(403);
    });

    it("should return 400 for generic unexpected errors", async () => {
      const err: any = new Error("Unknown wildcard explosion");
      (db.transaction as any).mockRejectedValue(err);

      const res = await app.inject({
        method: "POST",
        url: "/employees",
        payload: validPayload,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe("Unable to create employee");
    });
  });

  describe("GET /employees", () => {
    it("should return a paginated list of employees covering system arrays", async () => {
      const dbRow = {
        id: mockEmpId,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@company.com",
        joiningDate: "2026-01-10",
        userId: mockUserId,
        welcome: {
          welcomewithWhatsapp: true,
          welcomewithGmail: true,
          welcomewithSlack: false,
        },
        documents: null,
        position: { id: "p1", name: "EMPLOYEE" },
        department: null,
        manager: null,
        system: {
          id: "sys-1",
          name: "Corp Laptop",
          description: "Default machine",
          componentId: "comp-1",
          componentName: "Monitor",
          componentDescription: "24 inch",
          componentCode: "MON24",
        },
      };

      (db.select as any).mockReturnValueOnce(createMockQuery([dbRow]));
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await app.inject({
        method: "GET",
        url: "/employees?page=1&limit=10&search=Jane",
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.data.length).toBe(1);
      expect(data.data[0].system.components.length).toBe(1);
      expect(data.meta.total).toBe(1);
    });

    it("should return a paginated list of employees covering descending sort parameter", async () => {
      const dbRow = {
        id: mockEmpId,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@company.com",
        joiningDate: "2026-01-10",
        userId: mockUserId,
        welcome: {
          welcomewithWhatsapp: true,
          welcomewithGmail: true,
          welcomewithSlack: false,
        },
        documents: null,
        position: { id: "p1", name: "EMPLOYEE" },
        department: null,
        manager: null,
        system: null,
      };

      (db.select as any).mockReturnValueOnce(createMockQuery([dbRow]));
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await app.inject({
        method: "GET",
        url: "/employees?page=1&limit=10&sortBy=firstName&sortOrder=desc",
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).data.length).toBe(1);
    });

    it("should handle error fallback and return empty list", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("DB Query Error");
      });

      const res = await app.inject({
        method: "GET",
        url: "/employees",
      });

      expect(res.statusCode).toBe(200);
      const payload = JSON.parse(res.payload);
      expect(payload.data).toEqual([]);
      expect(payload.meta.total).toBe(0);
    });
  });

  describe("GET /employees/:id", () => {
    it("should return employee by ID", async () => {
      const dbRow = {
        id: mockEmpId,
        firstName: "Bob",
        lastName: "Marley",
        email: "bob@company.com",
        joiningDate: "2026-02-15",
        userId: mockUserId,
        welcome: {
          welcomewithWhatsapp: false,
          welcomewithGmail: true,
          welcomewithSlack: true,
        },
        documents: null,
        position: null,
        department: null,
        manager: null,
        system: {
          id: "sys-1",
          name: "Macbook",
          description: "Corp Laptop",

          componentId: "comp-1",
          componentName: "Memory",
          componentDescription: "16GB RAM",
          componentCode: "MEM16",
        },
      };

      (db.select as any).mockReturnValueOnce(createMockQuery([dbRow]));

      const res = await app.inject({
        method: "GET",
        url: `/employees/${mockEmpId}`,
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.firstName).toBe("Bob");

      expect(data.system.components.length).toBe(1);
      expect(data.system.components[0].name).toBe("Memory");
    });

    it("should return 404 if employee does not exist", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "GET",
        url: `/employees/${mockEmpId}`,
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Employee not found");
    });

    it("should return 400 if DB fails", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("Boom");
      });

      const res = await app.inject({
        method: "GET",
        url: `/employees/${mockEmpId}`,
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("PUT /employees/:id", () => {
    const updatePayload = {
      firstName: "UpdJane",
      lastName: "UpdSmith",
      documents: {
        generateOfferLetter: true,
        generateAppointmentLetter: true,
      },
    };

    it("should update employee successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmpId, userId: "other-user-id" }]),
      );

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockEmpId }]),
      });

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(true),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/employees/${mockEmpId}`,
        payload: updatePayload,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).message).toBe(
        "Employee updated successfully",
      );
    });

    it("should prevent updating self", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmpId, userId: mockUser.id }]),
      );

      const res = await app.inject({
        method: "PUT",
        url: `/employees/${mockEmpId}`,
        payload: updatePayload,
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).message).toBe(
        "You cannot update your own record",
      );
    });

    it("should return 404 if employee missing", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "PUT",
        url: `/employees/${mockEmpId}`,
        payload: updatePayload,
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Employee not found");
    });

    it("should return 400 if manager is same as employee", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmpId, userId: "other-user-id" }]),
      );

      const res = await app.inject({
        method: "PUT",
        url: `/employees/${mockEmpId}`,
        payload: { ...updatePayload, managerId: mockEmpId },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Employee cannot be their own manager",
      );
    });

    it("should return 400 on unexpected update errors", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("Wild DB update burst!");
      });

      const res = await app.inject({
        method: "PUT",
        url: `/employees/${mockEmpId}`,
        payload: updatePayload,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe("Unable to update employee");
    });
  });

  describe("DELETE /employees/:id", () => {
    it("should gracefully soft delete active employee", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { id: mockEmpId, userId: "target-user-id", isActive: true },
        ]),
      );

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(true),
      });

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(true),
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/employees/${mockEmpId}`,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).message).toBe(
        "Employee deleted successfully",
      );
    });

    it("should return 403 on deleting self record", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { id: mockEmpId, userId: mockUser.id, isActive: true },
        ]),
      );

      const res = await app.inject({
        method: "DELETE",
        url: `/employees/${mockEmpId}`,
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).message).toBe(
        "You cannot delete your own record",
      );
    });

    it("should return 409 if already deleted", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { id: mockEmpId, userId: "other-user-id", isActive: false },
        ]),
      );

      const res = await app.inject({
        method: "DELETE",
        url: `/employees/${mockEmpId}`,
      });

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.payload).message).toBe("Employee already deleted");
    });

    it("should return 404 if employee missing", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "DELETE",
        url: `/employees/${mockEmpId}`,
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Employee not found");
    });

    it("should return 400 on unexpected deletion failure", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("DB Deletion failure");
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/employees/${mockEmpId}`,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Unable to process delete request",
      );
    });
  });
});
