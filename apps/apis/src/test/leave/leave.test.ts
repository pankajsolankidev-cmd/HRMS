vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.PORT = "0";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";
import { PERMISSIONS } from "../../db/schema/permissions.enums";
import { ROLES } from "../../db/schema/roles.enums";
import { LeaveStatus } from "../../db/schema/leave.enums";

vi.mock("./utils/leave-calculation", () => ({
  calculateLeaveTotalsSimple: vi.fn(() => ({ totalHours: 8, totalDays: 1 })),
}));

vi.mock("./utils/past-date-validation", () => ({
  validatePastDatesOnly: vi.fn(() => ({ valid: true, message: "" })),
}));

vi.mock("../../middlewares/authorize.middleware", () => ({
  authorize: vi.fn(() => async (req: any, reply: any) => {}),
}));

vi.mock("../../lib/redis", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("../../db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn((cb) => cb(db)),
  },
}));

let mockUser: any;

vi.mock("../../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any) => {
    if (!mockUser) throw new Error("Unauthorized");
    req.user = mockUser;
  },
}));

vi.mock("../../utils/socket", () => ({
  getIO: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  })),
  registerSocket: vi.fn(),
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
    groupBy: vi.fn(() => chain),
    $dynamic: vi.fn(() => chain),
    then: (resolve: any) => resolve(resolvedValue),
  };
  return chain;
};

const mockEmployeeId = "11111111-1111-1111-1111-111111111111";
const mockUserId = "22222222-2222-2222-2222-222222222222";
const mockLeaveRequestId = "33333333-3333-3333-3333-333333333333";
const mockOtherUserId = "44444444-4444-4444-4444-444444444444";

describe("Leave Request Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = {
      id: mockUserId,
      role: ROLES.ADMIN,
      permissions: [
        PERMISSIONS.LEAVE_CREATE,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.LEAVE_UPDATE_ALL,
      ],
    };
  });

  describe("POST /leave-requests", () => {
    it("should create a leave request successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { id: mockEmployeeId, firstName: "John", lastName: "Doe" },
        ]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ userId: "admin-1" }]),
      );

      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const res = await app.inject({
        method: "POST",
        url: "/leave-requests",
        payload: {
          fromDate: "2099-01-01",
          toDate: "2099-01-02",
          type: "sick",
          dayType: "full_day",
          fromHour: 9,
          toHour: 18,
          reason: "Sick leave",
        },
      });

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.body).message).toBe(
        "Leave request created successfully",
      );
    });

    it("should handle employee not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "POST",
        url: "/leave-requests",
        payload: {
          fromDate: "2099-01-01",
          toDate: "2099-01-02",
          type: "sick",
          dayType: "full_day",
          fromHour: 9,
          toHour: 18,
        },
      });

      expect(res.statusCode).toBe(404);
    });

    it("should handle overlapping leave", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: "existing-id" }]),
      );

      const res = await app.inject({
        method: "POST",
        url: "/leave-requests",
        payload: {
          fromDate: "2099-01-01",
          toDate: "2099-01-02",
          type: "sick",
          dayType: "full_day",
          fromHour: 9,
          toHour: 18,
        },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toContain("overlaps");
    });

    it("should handle invalid date range (past dates)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/leave-requests",
        payload: {
          fromDate: "2020-01-01",
          toDate: "2020-01-02",
          type: "sick",
          dayType: "full_day",
          fromHour: 9,
          toHour: 18,
        },
      });
      expect(res.statusCode).toBe(500);
    });

    it("should handle invalid date range (toDate < fromDate)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/leave-requests",
        payload: {
          fromDate: "2099-01-02",
          toDate: "2099-01-01",
          type: "sick",
          dayType: "full_day",
          fromHour: 9,
          toHour: 18,
        },
      });
      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /leave-requests", () => {
    it("should fetch all leave requests (HR/Admin)", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId, userId: mockUserId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: { id: mockLeaveRequestId, totalDays: "1" },
            employee: {
              id: mockEmployeeId,
              firstName: "John",
              lastName: "Doe",
            },
          },
        ]),
      );

      const res = await app.inject({
        method: "GET",
        url: "/leave-requests",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(1);
    });

    it("should fetch self leave requests (Employee)", async () => {
      mockUser.role = ROLES.EMPLOYEE;
      mockUser.permissions = [];
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: { id: mockLeaveRequestId, totalDays: "1" },
            employee: {
              id: mockEmployeeId,
              firstName: "John",
              lastName: "Doe",
            },
          },
        ]),
      );

      const res = await app.inject({
        method: "GET",
        url: "/leave-requests",
      });

      expect(res.statusCode).toBe(200);
    });

    it("should handle filter and search", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: {
              id: mockLeaveRequestId,
              totalDays: "1",
              status: LeaveStatus.Pending,
              type: "sick",
              fromDate: "2099-01-01",
              toDate: "2099-01-01",
            },
            employee: { id: mockEmployeeId, firstName: "A", lastName: "B" },
          },
        ]),
      );

      const res = await app.inject({
        method: "GET",
        url: `/leave-requests`,
        query: {
          search: "test",
          status: LeaveStatus.Pending,
          type: "sick",
          fromDate: "2099-01-01",
          toDate: "2099-12-31",
          sortBy: "fromDate",
          sortOrder: "asc",
        },
      });
      expect(res.statusCode).toBe(200);

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: { id: mockLeaveRequestId, totalDays: "1" },
            employee: { id: mockEmployeeId, firstName: "A", lastName: "B" },
          },
        ]),
      );
      const resDesc = await app.inject({
        method: "GET",
        url: "/leave-requests",
        query: { sortBy: "fromDate", sortOrder: "desc" },
      });
      expect(resDesc.statusCode).toBe(200);
    });

    it("should handle HR/Admin specific filters (createdByType)", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "HR" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: { id: mockLeaveRequestId, totalDays: "1" },
            employee: { id: mockEmployeeId, firstName: "A", lastName: "B" },
          },
        ]),
      );

      const res = await app.inject({
        method: "GET",
        url: "/leave-requests",
        query: { createdByType: "manual" },
      });
      expect(res.statusCode).toBe(200);

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "HR" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: { id: mockLeaveRequestId, totalDays: "1" },
            employee: { id: mockEmployeeId, firstName: "A", lastName: "B" },
          },
        ]),
      );

      const res2 = await app.inject({
        method: "GET",
        url: "/leave-requests",
        query: { createdByType: "self" },
      });
      expect(res2.statusCode).toBe(200);
    });

    it("should return empty if non-HR/Admin filters by employeeId", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "GET",
        url: "/leave-requests",
        query: { employeeId: mockEmployeeId },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(0);
    });

    it("should handle non-HR/Admin with no employee record", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "GET",
        url: "/leave-requests",
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(0);
    });
  });

  describe("GET /leave-requests/:id", () => {
    it("should fetch leave request by id (Admin)", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: {
              id: mockLeaveRequestId,
              employeeId: mockEmployeeId,
              totalDays: "1",
              status: LeaveStatus.Pending,
              fromDate: "2099-01-01",
              toDate: "2099-01-01",
              type: "sick",
              dayType: "full_day",
              fromHour: 9,
              toHour: 18,
            },
            employee: {
              id: mockEmployeeId,
              userId: mockUserId,
              firstName: "A",
              lastName: "B",
            },
            approvedByUser: null,
            rejectedByUser: null,
            createdByEmployee: {
              id: mockEmployeeId,
              userId: mockUserId,
              firstName: "A",
              lastName: "B",
            },
          },
        ]),
      );

      const res = await app.inject({
        method: "GET",
        url: `/leave-requests/${mockLeaveRequestId}`,
      });

      if (res.statusCode !== 200)
        console.log("FETCH BY ID ADMIN FAIL:", res.payload);
      expect(res.statusCode).toBe(200);
    });
    it("should return 404 if employee fetches others leave", async () => {
      mockUser.role = ROLES.EMPLOYEE;
      mockUser.permissions = [];
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "GET",
        url: `/leave-requests/${mockLeaveRequestId}`,
      });

      expect(res.statusCode).toBe(404);
    });

    it("should return 404 if leave not found", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "GET",
        url: `/leave-requests/${mockLeaveRequestId}`,
      });
      if (res.statusCode !== 404)
        console.log("FETCH BY ID 404 FAIL:", res.payload);
      expect(res.statusCode).toBe(404);
    });
  });

  describe("PATCH /leave-requests/:id", () => {
    it("should update pending leave request", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ employeeId: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            id: mockLeaveRequestId,
            status: LeaveStatus.Pending,
            employeeId: mockEmployeeId,
          },
        ]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockLeaveRequestId }]),
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}`,
        payload: { reason: "Updated reason" },
      });

      expect(res.statusCode).toBe(200);
    });

    it("should fail if not pending", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ employeeId: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}`,
        payload: { reason: "X" },
      });
      expect(res.statusCode).toBe(404);
    });

    it("should fail if unauthorized employee", async () => {
      mockUser.role = ROLES.EMPLOYEE;
      mockUser.permissions = [];
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ employeeId: mockEmployeeId, positionName: "Dev" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}`,
        payload: { reason: "X" },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe("DELETE /leave-requests/:id", () => {
    it("should delete pending leave request", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockLeaveRequestId }]),
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/leave-requests/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it("should return 404 if delete not found", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/leave-requests/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it("should return 403 if non-HR/Admin has no employee record for delete", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "DELETE",
        url: `/leave-requests/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("Approve / Reject", () => {
    it("should approve leave request", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leaveId: mockLeaveRequestId,
            status: LeaveStatus.Pending,
            targetUserId: mockOtherUserId,
          },
        ]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "EMPLOYEE" }]),
      );
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockLeaveRequestId }]),
      });
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ firstName: "Admin", lastName: "User" }]),
      );
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}/approve`,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).message).toBe(
        "Leave request approved successfully",
      );
    });

    it("should reject self-approval", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { leaveId: mockLeaveRequestId, targetUserId: mockUserId },
        ]),
      );

      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}/approve`,
      });
      expect(res.statusCode).toBe(403);
    });

    it("should reject leave request with reason", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { leaveId: mockLeaveRequestId, targetUserId: mockOtherUserId },
        ]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "EMPLOYEE" }]),
      );
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockLeaveRequestId }]),
      });
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ firstName: "Admin", lastName: "User" }]),
      );
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}/reject`,
        payload: { rejectionReason: "No" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("should reject self-rejection", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { leaveId: mockLeaveRequestId, targetUserId: mockUserId },
        ]),
      );
      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}/reject`,
        payload: {},
      });
      expect(res.statusCode).toBe(403);
    });

    it("should fail if non-admin tries to approve HR leave", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "HR" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { leaveId: mockLeaveRequestId, targetUserId: mockOtherUserId },
        ]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "HR" }]),
      );
      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}/approve`,
      });
      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body).message).toContain(
        "only be approved by Admin",
      );
    });

    it("should fail if non-HR/Admin tries to approve", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { leaveId: mockLeaveRequestId, targetUserId: mockOtherUserId },
        ]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "EMPLOYEE" }]),
      );
      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/${mockLeaveRequestId}/approve`,
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("Manual Leave", () => {
    it("should create manual leave request (Admin)", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue({}),
      });

      const res = await app.inject({
        method: "POST",
        url: "/leave-requests/manual",
        payload: {
          employeeId: mockEmployeeId,
          fromDate: "2020-01-01",
          toDate: "2020-01-02",
          type: "sick",
          dayType: "full_day",
          fromHour: 9,
          toHour: 18,
        },
      });
      expect(res.statusCode).toBe(201);
    });

    it("should update manual leave request", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: {
              id: mockLeaveRequestId,
              employeeId: mockEmployeeId,
              fromDate: "2020-01-01",
              toDate: "2020-01-02",
            },
            employeeUserId: "some-user",
          },
        ]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
        payload: { reason: "Updated manual" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("should return 403 if unauthorized manual update", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
        payload: { reason: "X" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("should return 404 if manual update not found", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
        payload: { reason: "X" },
      });
      expect(res.statusCode).toBe(404);
    });

    it("should delete manual leave request", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockLeaveRequestId }]),
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it("should return 403 if unauthorized manual delete", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "DELETE",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it("should return 400 if manual creation overlaps", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: "existing-overlap" }]),
      );
      const res = await app.inject({
        method: "POST",
        url: "/leave-requests/manual",
        payload: {
          employeeId: mockEmployeeId,
          fromDate: "2020-01-01",
          toDate: "2020-01-02",
          type: "sick",
          dayType: "full_day",
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it("should return 404 if manual update target employee not found", async () => {
      const otherEmpId = "55555555-5555-5555-5555-555555555555";
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: {
              id: mockLeaveRequestId,
              employeeId: mockEmployeeId,
              fromDate: "2020-01-01",
              toDate: "2020-01-02",
            },
            employeeUserId: "some-user",
          },
        ]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
        payload: { employeeId: otherEmpId },
      });
      expect(res.statusCode).toBe(404);
    });

    it("should return 404 if trying to update non-manual leave via manual route", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: {
              id: mockLeaveRequestId,
              employeeId: mockEmployeeId,
              createdBy: "user-id",
            },
            employeeUserId: "user-id",
          },
        ]),
      );
      const res = await app.inject({
        method: "PATCH",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
        payload: { reason: "X" },
      });
      expect(res.statusCode).toBe(404);
    });

    it("should return 404 if manual delete not found", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it("should get manual leave request by id", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            leave: {
              id: mockLeaveRequestId,
              createdBy: mockOtherUserId,
              totalDays: "1",
              status: LeaveStatus.Approved,
              fromDate: "2020-01-01",
              toDate: "2020-01-01",
              type: "sick",
              dayType: "full_day",
              fromHour: 9,
              toHour: 18,
            },
            employee: {
              id: mockEmployeeId,
              userId: "some-user",
              firstName: "A",
              lastName: "B",
              isActive: true,
            },
            createdByEmployee: {
              id: "55555555-5555-5555-5555-555555555555",
              userId: mockOtherUserId,
              firstName: "Admin",
              lastName: "User",
            },
          },
        ]),
      );

      const res = await app.inject({
        method: "GET",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it("should return 403 if unauthorized manual get", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "GET",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it("should return 404 if manual leave not found", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "GET",
        url: `/leave-requests/manual/${mockLeaveRequestId}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
