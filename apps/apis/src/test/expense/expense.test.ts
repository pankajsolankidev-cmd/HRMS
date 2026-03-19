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

vi.mock("../../lib/redis", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("../../db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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
    (p as any).innerJoin = chain.innerJoin;
    (p as any).leftJoin = chain.leftJoin;
    (p as any).where = chain.where;
    (p as any).orderBy = chain.orderBy;
    (p as any).limit = chain.limit;
    (p as any).offset = chain.offset;
    return p;
  };
  return chain;
};

const mockEmpId = "111e4567-e89b-12d3-a456-426614174011";
const mockUserId = "222e4567-e89b-12d3-a456-426614174022";
const mockExpenseId = "333e4567-e89b-12d3-a456-426614174033";

describe("EXPENSE MODULE - EXHAUSTIVE 40+ TEST SUITE", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = {
      id: mockUserId,
      roles: [ROLES.ADMIN],
      permissions: Object.values(PERMISSIONS),
    };
  });

  const validPayload = {
    expenseType: "Food",
    amount: 100,
    expenseDate: "2023-01-01",
  };

  describe("createExpenseHandler", () => {
    it("should handle invalid date format", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/expenses",
        payload: { ...validPayload, expenseDate: "X" },
      });
      expect(res.statusCode).toBe(400);
    });
    it("should handle future date", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/expenses",
        payload: { ...validPayload, expenseDate: "2099-01-01" },
      });
      expect(res.statusCode).toBe(400);
    });
    it("should handle employee missing", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "POST",
        url: "/expenses",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(400);
    });
    it("should handle success with multiple notifications", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmpId, firstName: "A", lastName: "B" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ userId: "admin1" }, { userId: "admin2" }]),
      );
      (db.insert as any).mockImplementation((table: any) => {
        if (table.name === "expenses")
          return { values: vi.fn().mockResolvedValue(true) };
        return { values: vi.fn().mockResolvedValue(true) };
      });
      const res = await app.inject({
        method: "POST",
        url: "/expenses",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(201);
    });
    it("should handle catch block", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      const res = await app.inject({
        method: "POST",
        url: "/expenses",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("createExpenseDirectHandler", () => {
    it("should handle various branches", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockEmpId, firstName: "A", lastName: "B" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ userId: "manager" }]),
      );
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockResolvedValue(true),
      });
      const res = await app.inject({
        method: "POST",
        url: "/expenses/create",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(201);
    });
    it("should handle error paths inherited from regular create", async () => {
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/expenses/create",
            payload: { ...validPayload, expenseDate: "X" },
          })
        ).statusCode,
      ).toBe(400);
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/expenses/create",
            payload: validPayload,
          })
        ).statusCode,
      ).toBe(400);
    });
  });

  describe("getExpensesHandler", () => {
    it("should handle non-admin profile missing", async () => {
      mockUser = { id: mockUserId, roles: [ROLES.EMPLOYEE], permissions: [] };
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "EMPLOYEE" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({ method: "GET", url: "/expenses" });
      expect(res.statusCode).toBe(404);
    });
    it("should handle complex filtering and sorting", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            expenses: { id: "1" },
            employee: { firstName: "A", lastName: "B" },
          },
        ]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));
      const res = await app.inject({
        method: "GET",
        url: "/expenses?search=uber&status=CREATED&sortBy=amount&sortOrder=asc&page=1&limit=5",
      });
      expect(res.statusCode).toBe(200);
    });
    it("should handle default sorting and no limit", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "ADMIN" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 0 }]));
      const res = await app.inject({ method: "GET", url: "/expenses" });
      expect(res.statusCode).toBe(200);
    });
    it("should handle catch block", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      const res = await app.inject({ method: "GET", url: "/expenses" });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("getExpenseByIdHandler", () => {
    it("should handle not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "GET",
        url: `/expenses/${mockExpenseId}`,
      });
      expect(res.statusCode).toBe(404);
    });
    it("should handle unauthorized: current employee not found vs mismatch", async () => {
      mockUser = { id: mockUserId, roles: [ROLES.EMPLOYEE], permissions: [] };

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockExpenseId, employeeId: "other" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      expect(
        (await app.inject({ method: "GET", url: `/expenses/${mockExpenseId}` }))
          .statusCode,
      ).toBe(403);

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockExpenseId, employeeId: "other" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ id: "mine" }]));
      expect(
        (await app.inject({ method: "GET", url: `/expenses/${mockExpenseId}` }))
          .statusCode,
      ).toBe(403);
    });
    it("should handle success", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockExpenseId, employeeId: mockEmpId }]),
      );
      const res = await app.inject({
        method: "GET",
        url: `/expenses/${mockExpenseId}`,
      });
      expect(res.statusCode).toBe(200);
    });
    it("should handle catch block", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      const res = await app.inject({
        method: "GET",
        url: `/expenses/${mockExpenseId}`,
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("updateExpenseHandler", () => {
    it("should handle various validation and error paths", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/expenses/${mockExpenseId}`,
            payload: { amount: 10 },
          })
        ).statusCode,
      ).toBe(404);

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockExpenseId, status: "APPROVED" }]),
      );
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/expenses/${mockExpenseId}`,
            payload: { amount: 10 },
          })
        ).statusCode,
      ).toBe(400);

      (db.select as any).mockReturnValue(
        createMockQuery([{ id: mockExpenseId, status: "DRAFT" }]),
      );
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/expenses/${mockExpenseId}`,
            payload: { expenseDate: "X" },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/expenses/${mockExpenseId}`,
            payload: { expenseDate: "2099-01-01" },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/expenses/${mockExpenseId}`,
            payload: { amount: "NaNValue" },
          })
        ).statusCode,
      ).toBe(400);

      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(true),
      });
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/expenses/${mockExpenseId}`,
            payload: { amount: 50 },
          })
        ).statusCode,
      ).toBe(200);

      (db.select as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/expenses/${mockExpenseId}`,
            payload: { amount: 10 },
          })
        ).statusCode,
      ).toBe(400);
    });
  });

  describe("deleteExpenseHandler", () => {
    it("should handle missing, wrong status, success, catch", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      expect(
        (
          await app.inject({
            method: "DELETE",
            url: `/expenses/${mockExpenseId}`,
          })
        ).statusCode,
      ).toBe(404);

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockExpenseId, status: "CREATED" }]),
      );
      expect(
        (
          await app.inject({
            method: "DELETE",
            url: `/expenses/${mockExpenseId}`,
          })
        ).statusCode,
      ).toBe(400);

      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockExpenseId, status: "DRAFT" }]),
      );
      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockResolvedValue(true),
      });
      expect(
        (
          await app.inject({
            method: "DELETE",
            url: `/expenses/${mockExpenseId}`,
          })
        ).statusCode,
      ).toBe(200);

      (db.select as any).mockImplementationOnce(() => {
        throw new Error("E");
      });
      expect(
        (
          await app.inject({
            method: "DELETE",
            url: `/expenses/${mockExpenseId}`,
          })
        ).statusCode,
      ).toBe(400);
    });
  });

  describe("getExpenseSummaryHandler", () => {
    it("should handle date boundaries and validation", async () => {
      const url = "/expenses/summary?fromDate=2023-01-01&toDate=2023-01-31";
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/expenses/summary?fromDate=X&toDate=Y",
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/expenses/summary?fromDate=2023-12-01&toDate=2023-01-01",
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/expenses/summary?fromDate=2023-01-01&toDate=2099-01-01",
          })
        ).statusCode,
      ).toBe(400);

      mockUser = {
        id: mockUserId,
        roles: [ROLES.EMPLOYEE],
        permissions: [PERMISSIONS.EXPENSE_VIEW_SUMMARY],
      };
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ roleName: "EMPLOYEE" }]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      expect((await app.inject({ method: "GET", url })).statusCode).toBe(400);

      (db.select as any).mockImplementationOnce(() => {
        throw new Error("E");
      });
      expect((await app.inject({ method: "GET", url })).statusCode).toBe(500);
    });
  });

  describe("Workflow Transitions", () => {
    it("Submit: missing, non-draft, success", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/create`,
          })
        ).statusCode,
      ).toBe(404);
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockExpenseId, status: "APPROVED" }]),
      );
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/create`,
          })
        ).statusCode,
      ).toBe(400);
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockExpenseId, status: "DRAFT" }]),
      );
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(true),
      });
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/create`,
          })
        ).statusCode,
      ).toBe(200);
    });
    it("Approve: results in notifications and status change", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { id: mockExpenseId, status: "CREATED", employeeId: mockEmpId },
        ]),
      );
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(true),
      });
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ userId: "target-user" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ firstName: "Boss", lastName: "One" }]),
      );
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(true),
      });
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/approve`,
          })
        ).statusCode,
      ).toBe(200);
    });
    it("Reject: requires reason, results in notification", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { id: mockExpenseId, status: "CREATED", employeeId: mockEmpId },
        ]),
      );
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/reject`,
            payload: { reason: " " },
          })
        ).statusCode,
      ).toBe(400);

      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          { id: mockExpenseId, status: "CREATED", employeeId: mockEmpId },
        ]),
      );
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(true),
      });
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ userId: "target-user" }]),
      );
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ firstName: "Admin", lastName: "G" }]),
      );
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(true),
      });
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/reject`,
            payload: { reason: "Too high" },
          })
        ).statusCode,
      ).toBe(200);
    });
    it("Catches for submit/approve/reject", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("E");
      });
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/create`,
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/approve`,
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "PATCH",
            url: `/expenses/${mockExpenseId}/reject`,
            payload: { reason: "X" },
          })
        ).statusCode,
      ).toBe(400);
    });
  });
});
