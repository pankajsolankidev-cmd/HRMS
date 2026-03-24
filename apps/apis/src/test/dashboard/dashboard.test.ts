vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(),
    query: {
      employees: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("../../lib/redis", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

let mockUser: any;

vi.mock("../../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any) => {
    if (!mockUser) {
      throw new Error("Unauthorized");
    }
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
    then: (resolve: any) => resolve(resolvedValue),
  };
  return chain;
};

describe("DASHBOARD ROUTES", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      roles: ["ADMIN"],
      permissions: [],
    };
  });

  describe("GET /dashboard/summary (Admin/HR)", () => {
    it("should return summary data correctly for Admin", async () => {
      (db.select as any)
        .mockReturnValueOnce(createMockQuery([{ roleName: "ADMIN" }])) // Roles
        .mockReturnValueOnce(createMockQuery([{ count: 15 }])) // Total Employees
        .mockReturnValueOnce(
          createMockQuery([
            {
              id: "e1",
              firstName: "John",
              lastName: "Doe",
              type: "SICK",
              fromDate: "2026-03-01",
              toDate: "2026-03-05",
              totalDays: "5",
            },
          ]),
        )
        .mockReturnValueOnce(
          createMockQuery([
            {
              id: "l1",
              employeeName: "Alice S",
              type: "CASUAL",
              status: "PENDING",
              createdAt: "2026-03-01T10:00:00.000Z",
            },
          ]),
        )
        .mockReturnValueOnce(
          createMockQuery([
            {
              id: "ex1",
              employeeName: "Bob C",
              expenseType: "TRAVEL",
              amount: 200,
              status: "CREATED",
              createdAt: "2026-03-02T10:00:00.000Z",
            },
          ]),
        )
        .mockReturnValueOnce(createMockQuery([{ total: 1200 }])); // Monthly expense

      const res = await app.inject({
        method: "GET",
        url: "/dashboard/summary",
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.totalEmployees).toBe(15);
      expect(data.onLeaveToday.count).toBe(1);
      expect(data.availableToday).toBe(14);
      expect(data.onLeaveToday.employees[0].firstName).toBe("John");
      expect(data.recentLeaves.length).toBe(1);
      expect(data.recentExpenses.length).toBe(1);
    });

    it("should return 403 if user is not ADMIN or HR", async () => {
      mockUser = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        roles: ["EMPLOYEE"],
        permissions: [PERMISSIONS.DASHBOARD_VIEW_ADMIN],
      };

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "EMPLOYEE" }]),
      );

      const res = await app.inject({
        method: "GET",
        url: "/dashboard/summary",
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload).message).toBe("Forbidden");
    });

    it("should return 400 if DB query fails", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("DB Error");
      });

      const res = await app.inject({
        method: "GET",
        url: "/dashboard/summary",
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe(
        "Unable to fetch dashboard summary",
      );
    });
  });

  describe("GET /employee/dashboard/summary", () => {
    it("should return employee dashboard summary data", async () => {
      mockUser = {
        id: "employee-123",
        roles: ["EMPLOYEE"],
        permissions: [PERMISSIONS.DASHBOARD_VIEW_EMPLOYEE],
      };

      (db.query.employees.findFirst as any).mockResolvedValue({
        id: "emp-db-1",
        joiningDate: "2024-01-01",
      });

      (db.select as any)
        .mockReturnValueOnce(createMockQuery([{ months: 26 }])) // monthsWorkedResult
        .mockReturnValueOnce(createMockQuery([{ total: 5 }])) // usedLeavesResult
        .mockReturnValueOnce(
          createMockQuery([
            {
              id: "h1",
              title: "New Year",
              fromDate: "2027-01-01",
              toDate: "2027-01-01",
              description: null,
            },
          ]),
        )
        .mockReturnValueOnce(
          createMockQuery([
            {
              id: "p1",
              name: "Alpha",
              clientName: null,
              startDate: "2026-01-01",
              expectedEndDate: null,
              status: "ACTIVE",
            },
          ]),
        )
        .mockReturnValueOnce(createMockQuery([{ count: 3 }]));

      const res = await app.inject({
        method: "GET",
        url: "/employee/dashboard/summary",
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.leaveBalance.monthsWorked).toBe(26);
      expect(data.leaveBalance.totalUsed).toBe(5);
      expect(data.completedProjectCount).toBe(3);
      expect(data.upcomingHoliday.title).toBe("New Year");
      expect(data.currentProjects[0].name).toBe("Alpha");
      expect(data.leaveBalance.totalEarned).toBe(32.5);
      expect(data.leaveBalance.remaining).toBe(27.5);
    });

    it("should handle null holidays and empty projects", async () => {
      mockUser = {
        id: "employee-123",
        roles: ["EMPLOYEE"],
        permissions: [PERMISSIONS.DASHBOARD_VIEW_EMPLOYEE],
      };

      (db.query.employees.findFirst as any).mockResolvedValue({ id: "emp-1" });

      (db.select as any)
        .mockReturnValueOnce(createMockQuery([]))
        .mockReturnValueOnce(createMockQuery([]))
        .mockReturnValueOnce(createMockQuery([]))
        .mockReturnValueOnce(createMockQuery([]))
        .mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "GET",
        url: "/employee/dashboard/summary",
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.payload);
      expect(data.leaveBalance.monthsWorked).toBe(0);
      expect(data.leaveBalance.totalUsed).toBe(0);
      expect(data.upcomingHoliday).toBeNull();
      expect(data.currentProjects).toEqual([]);
    });

    it("should return 404 if employee profile not found", async () => {
      mockUser = {
        id: "new-user-no-emp",
        roles: ["EMPLOYEE"],
        permissions: [PERMISSIONS.DASHBOARD_VIEW_EMPLOYEE],
      };

      (db.query.employees.findFirst as any).mockResolvedValue(null);

      const res = await app.inject({
        method: "GET",
        url: "/employee/dashboard/summary",
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload).message).toBe("Employee not found");
    });

    it("should return 400 if DB fails", async () => {
      mockUser = {
        id: "employee-123",
        roles: ["EMPLOYEE"],
        permissions: [PERMISSIONS.DASHBOARD_VIEW_EMPLOYEE],
      };

      (db.query.employees.findFirst as any).mockRejectedValue(
        new Error("DB Failure"),
      );

      const res = await app.inject({
        method: "GET",
        url: "/employee/dashboard/summary",
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.payload).message).toBe("Unable to fetch dashboard");
    });
  });
});
