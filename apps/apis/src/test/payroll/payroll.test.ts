vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.PORT = "0";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";
import { ROLES } from "../../db/schema/roles.enums";
import { PERMISSIONS } from "../../db/schema/permissions.enums";
import * as leaveUtils from "../../modules/payroll/utils/leave-deduction.utils";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
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
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    $dynamic: vi.fn(() => chain),
    set: vi.fn(() => chain),
    values: vi.fn(() => chain),
    $returningId: vi.fn(() => chain),
    then: vi.fn((onFulfilled) =>
      Promise.resolve(resolvedValue).then(onFulfilled),
    ),
    catch: vi.fn((onRejected) =>
      Promise.resolve(resolvedValue).catch(onRejected),
    ),
  };
  return chain;
};

const mockUserId = "11111111-1111-1111-1111-111111111111";
const mockEmployeeId = "22222222-2222-2222-2222-222222222222";
const mockOtherEmployeeId = "44444444-4444-4444-4444-444444444444";
const mockPayrollId = "33333333-3333-3333-3333-333333333333";

describe("Payroll Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = {
      id: mockUserId,
      role: ROLES.ADMIN,
      permissions: Object.values(PERMISSIONS),
    };
    (db.select as any).mockReturnValue(createMockQuery([]));

    vi.spyOn(leaveUtils, "calculateLeaveDeductionForPayroll").mockResolvedValue(
      {
        leaveDeduction: 0,
        totalLeaveTaken: 0,
        excessLeave: 0,
      },
    );
  });

  describe("GET /payrolls", () => {
    it("should fetch payrolls successfully (Admin) with all filters", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { payroll: { id: mockPayrollId }, employee: { id: mockEmployeeId } },
        ]),
      );

      const res = await (app.inject({
        method: "GET",
        url: "/payrolls",
        query: {
          month: "JANUARY",
          year: "2024",
          employeeId: mockEmployeeId,
          sortBy: "netSalary",
          sortOrder: "asc",
          limit: "10",
          page: "1",
        },
      }) as any);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data).toHaveLength(1);
    });

    it("should fetch payrolls with default sorting and null count", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery(undefined));
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "GET",
        url: "/payrolls",
        query: { sortOrder: "desc" },
      }) as any);
      expect(res.statusCode).toBe(200);
    });

    it("should fetch payrolls with month/year filters (Non-Admin)", async () => {
      mockUser.role = "STAFF";
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "STAFF" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmployeeId }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 0 }]));
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "GET",
        url: "/payrolls",
        query: { month: "FEBRUARY", year: "2024" },
      }) as any);
      expect(res.statusCode).toBe(200);
    });

    it("should return empty if employee accesses others", async () => {
      mockUser.role = "SALES";
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "SALES" }]),
      );

      const res = await (app.inject({
        method: "GET",
        url: "/payrolls",
        query: { employeeId: mockOtherEmployeeId },
      }) as any);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data).toHaveLength(0);
    });

    it("should return empty if employee record not found", async () => {
      mockUser.role = ROLES.EMPLOYEE;
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "EMPLOYEE" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await (app.inject({
        method: "GET",
        url: "/payrolls",
      }) as any);
      expect(res.statusCode).toBe(200);
    });

    it("should handle error gracefully", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("DB Error");
      });
      const res = await (app.inject({
        method: "GET",
        url: "/payrolls",
      }) as any);
      expect(res.statusCode).toBe(200);
    });
  });

  describe("DELETE /payrolls/:id", () => {
    it("should delete payroll successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockPayrollId }]),
      );
      (db.delete as any).mockReturnValueOnce(createMockQuery([]));
      const res = await (app.inject({
        method: "DELETE",
        url: `/payrolls/${mockPayrollId}`,
      }) as any);
      expect(res.statusCode).toBe(200);
    });

    it("should return 404 if not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await (app.inject({
        method: "DELETE",
        url: `/payrolls/${mockPayrollId}`,
      }) as any);
      expect(res.statusCode).toBe(404);
    });

    it("should handle error", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockPayrollId }]),
      );
      (db.delete as any).mockImplementationOnce(() => {
        throw new Error("Err");
      });
      const res = await (app.inject({
        method: "DELETE",
        url: `/payrolls/${mockPayrollId}`,
      }) as any);
      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /payrolls/summary", () => {
    it("should fetch summary successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ employeesProcessed: 10, totalNetPayroll: 50000 }]),
      );
      const res = await (app.inject({
        method: "GET",
        url: "/payrolls/summary",
        query: { month: "JANUARY", year: "2024" },
      }) as any);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).employeesProcessed).toBe(10);
    });

    it("should handle 0 employees", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ employeesProcessed: 0, totalNetPayroll: 0 }]),
      );
      const res = await (app.inject({
        method: "GET",
        url: "/payrolls/summary",
        query: { month: "JANUARY", year: "2024" },
      }) as any);
      expect(JSON.parse(res.body).avgSalary).toBe(0);
    });

    it("should handle summary error", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("Err");
      });
      const res = await (app.inject({
        method: "GET",
        url: "/payrolls/summary",
        query: { month: "JANUARY", year: "2024" },
      }) as any);
      expect(res.statusCode).toBe(200);
    });
  });

  describe("GET /payrolls/bulk/employee", () => {
    it("should preview bulk payroll successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            employeeId: mockEmployeeId,
            firstName: "A",
            lastName: "B",
            salaryNet: "3000",
            pf: "100",
            tax: "50",
          },
        ]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ employeeId: mockEmployeeId }]),
      );
      const res = await (app.inject({
        method: "GET",
        url: "/payrolls/bulk/employee",
        query: { month: "JANUARY", year: "2024" },
      }) as any);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data[0].isSalaryProcessed).toBe(true);
    });

    it("should use default date in preview", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await (app.inject({
        method: "GET",
        url: "/payrolls/bulk/employee",
      }) as any);
      expect(res.statusCode).toBe(200);
    });

    it("should handle preview error", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("Err");
      });
      const res = await (app.inject({
        method: "GET",
        url: "/payrolls/bulk/employee",
      }) as any);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data).toHaveLength(0);
    });
  });

  describe("POST /payrolls/bulk/process", () => {
    it("should process bulk payroll successfully", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            employeeId: mockEmployeeId,
            netSalary: "3000",
            firstName: "A",
            lastName: "B",
          },
        ]),
      );
      (db.transaction as any).mockImplementationOnce(async (cb: any) =>
        cb({ insert: vi.fn(() => createMockQuery([])) }),
      );

      const res = await (app.inject({
        method: "POST",
        url: "/payrolls/bulk/process",
        payload: {
          month: "JANUARY",
          year: 2024,
          adjustments: [{ employeeId: mockEmployeeId, bonus: 100 }],
        },
      }) as any);
      expect(res.statusCode).toBe(201);
    });

    it("should fail if already processed", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { employeeId: mockEmployeeId, firstName: "A", lastName: "B" },
        ]),
      );
      const res = await (app.inject({
        method: "POST",
        url: "/payrolls/bulk/process",
        payload: {
          month: "JANUARY",
          year: 2024,
          adjustments: [{ employeeId: mockEmployeeId }],
        },
      }) as any);
      expect(res.statusCode).toBe(409);
    });

    it("should fail if no adjustments", async () => {
      const res = await (app.inject({
        method: "POST",
        url: "/payrolls/bulk/process",
        payload: { adjustments: [] },
      }) as any);
      expect(res.statusCode).toBe(400);
    });

    it("should fail for future date", async () => {
      const res = await (app.inject({
        method: "POST",
        url: "/payrolls/bulk/process",
        payload: {
          month: "DECEMBER",
          year: 2099,
          adjustments: [{ employeeId: mockEmployeeId }],
        },
      }) as any);
      expect(res.statusCode).toBe(400);
    });

    it("should use default month/year if not provided", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            employeeId: mockEmployeeId,
            netSalary: "3000",
            firstName: "A",
            lastName: "B",
          },
        ]),
      );
      (db.transaction as any).mockImplementationOnce(async (cb: any) =>
        cb({ insert: vi.fn(() => createMockQuery([])) }),
      );
      const res = await (app.inject({
        method: "POST",
        url: "/payrolls/bulk/process",
        payload: { adjustments: [{ employeeId: mockEmployeeId }] },
      }) as any);
      expect(res.statusCode).toBe(201);
    });

    it("should fail if net < 0", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            employeeId: mockEmployeeId,
            netSalary: "10",
            firstName: "A",
            lastName: "B",
          },
        ]),
      );
      const res = await (app.inject({
        method: "POST",
        url: "/payrolls/bulk/process",
        payload: {
          month: "JANUARY",
          year: 2024,
          adjustments: [{ employeeId: mockEmployeeId, deductions: 50 }],
        },
      }) as any);
      expect(res.statusCode).toBe(422);
    });

    it("should skip adjustment if employee record missing in salary", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.transaction as any).mockImplementationOnce(async (cb: any) =>
        cb({ insert: vi.fn(() => createMockQuery([])) }),
      );
      const res = await (app.inject({
        method: "POST",
        url: "/payrolls/bulk/process",
        payload: {
          month: "JANUARY",
          year: 2024,
          adjustments: [{ employeeId: mockEmployeeId }],
        },
      }) as any);
      expect(res.statusCode).toBe(201);
    });

    it("should handle error in overall process", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("Err");
      });
      const res = await (app.inject({
        method: "POST",
        url: "/payrolls/bulk/process",
        payload: {
          month: "JANUARY",
          year: 2024,
          adjustments: [{ employeeId: mockEmployeeId }],
        },
      }) as any);
      expect(res.statusCode).toBe(500);
    });
  });
});
