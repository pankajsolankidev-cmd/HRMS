import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";

import { db } from "../../db";
import { sendMessage } from "../../utils/api-response";
import { expenses } from "../../db/schema/expenses";
import type { CreateExpenseDto } from "@shared/types/src/expense/create-expense.dto";
import type { UpdateExpenseDto } from "@shared/types/src/expense/update-expense.dto";
import { ExpenseStatus } from "../../db/schema/expense.enums";
import { employees, roles, userRoles } from "../../db/schema";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

interface AuthUser {
  id: string;
  email: string;
  iat: number;
  exp: number;
  permissions?: string[];
}

export async function createExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateExpenseDto;

  const expenseDate = new Date(body.expenseDate);

  if (isNaN(expenseDate.getTime())) {
    return reply.status(400).send({
      message: "Invalid expenseDate. Use format yyyy-mm-dd",
    });
  }

  expenseDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (expenseDate > today) {
    return reply.status(400).send({
      message: "expenseDate cannot be in the future",
    });
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, request.user!.id));

  if (!employee) {
    return reply.status(400).send({ message: "Employee profile not found" });
  }

  await db.insert(expenses).values({
    employeeId: employee.id,
    expenseType: body.expenseType,
    amount: String(body.amount),
    expenseDate: body.expenseDate,
    description: body.description ?? null,
    file: body.file ?? null,
  });

  return sendMessage(reply, "Expense created successfully", 201);
}

export async function getExpensesHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: "expenseDate" | "createdAt" | "amount";
    sortOrder?: "asc" | "desc";
  };

  const conditions = [];

  const userId = request.user!.id;

  // ✅ ROLE BASED LOGIC (LIKE LEAVE MODULE)
  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows.map((r) => r.roleName?.toUpperCase());

  const isHRorAdmin =
    roleNames.includes("HR") || roleNames.includes("ADMIN");

  // ✅ IF NOT HR/ADMIN → ONLY OWN EXPENSES
  if (!isHRorAdmin) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId));

    if (!employee) {
      return {
        data: [],
        meta: { page: 1, limit: 10, total: 0 },
      };
    }

    conditions.push(eq(expenses.employeeId, employee.id));
  }

  // ✅ SEARCH
  if (query.search) {
    conditions.push(ilike(expenses.expenseType, `%${query.search}%`));
  }

  // ✅ STATUS FILTER
  if (query.status) {
    conditions.push(eq(expenses.status, query.status as any));
  }

  // ✅ PAGINATION
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 10);
  const offset = (page - 1) * limit;

  // ✅ SORTING
  const sortColumn =
    query.sortBy === "amount"
      ? expenses.amount
      : query.sortBy === "expenseDate"
        ? expenses.expenseDate
        : expenses.createdAt;

  const order = query.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  // ✅ DATA QUERY
  const data = await db
    .select()
    .from(expenses)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  // ✅ COUNT QUERY
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(expenses)
    .where(conditions.length ? and(...conditions) : undefined);

  return {
    data,
    meta: {
      page,
      limit,
      total: Number(count),
    },
  };
}
export async function getExpenseByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const canViewAll = (request.user as AuthUser)?.permissions?.includes(
    PERMISSIONS.EXPENSE_VIEW_ALL,
  );

  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));

  if (!expense) {
    return reply.status(404).send({ message: "Expense not found" });
  }

  if (!canViewAll) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, request.user!.id));

    if (!employee || expense.employeeId !== employee.id) {
      return reply.status(403).send({
        message: "You are not authorized to view this expense",
      });
    }
  }

  return expense;
}

export async function updateExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateExpenseDto;

  const [existing] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id));

  if (!existing) {
    return reply.status(404).send({ message: "Expense not found" });
  }

  if (existing.status !== "DRAFT") {
    return reply
      .status(400)
      .send({ message: "Only DRAFT expenses can be updated" });
  }

  if (body.expenseDate) {
    const expenseDate = new Date(body.expenseDate);

    if (isNaN(expenseDate.getTime())) {
      return reply.status(400).send({
        message: "Invalid expenseDate. Use format yyyy-mm-dd",
      });
    }

    expenseDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (expenseDate > today) {
      return reply.status(400).send({
        message: "expenseDate cannot be in the future",
      });
    }
  }

  await db
    .update(expenses)
    .set({
      expenseType: body.expenseType,
      description: body.description,
      file: body.file,

      amount: body.amount !== undefined ? body.amount.toString() : undefined,
      expenseDate: body.expenseDate,

      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id));

  return sendMessage(reply, "Expense updated successfully");
}

export async function deleteExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [existing] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id));

  if (!existing) {
    return reply.status(404).send({ message: "Expense not found" });
  }

  if (existing.status !== "DRAFT") {
    return reply
      .status(400)
      .send({ message: "Only DRAFT expenses can be deleted" });
  }

  await db.delete(expenses).where(eq(expenses.id, id));

  return sendMessage(reply, "Expense deleted successfully");
}

export async function getExpenseSummaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { fromDate, toDate } = request.query as {
    fromDate?: string;
    toDate?: string;
  };

  if (!fromDate || !toDate) {
    return reply.status(400).send({
      message: "fromDate and toDate are required (format: yyyy-mm-dd)",
    });
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return reply.status(400).send({
      message: "Invalid date format. Use yyyy-mm-dd",
    });
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  if (from > to) {
    return reply.status(400).send({
      message: "fromDate must be less than or equal to toDate",
    });
  }

  const now = new Date();
  now.setHours(23, 59, 59, 999);

  if (to > now) {
    return reply.status(400).send({
      message: "toDate cannot be in the future",
    });
  }

  if (from > now) {
    return reply.status(400).send({
      message: "fromDate cannot be in the future",
    });
  }

  const userId = request.user!.id;

  // ✅ ROLE BASED (LIKE LEAVE)
  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows.map((r) => r.roleName?.toUpperCase());

  const isHRorAdmin =
    roleNames.includes("HR") || roleNames.includes("ADMIN");

  let whereCondition;

  if (isHRorAdmin) {
    // ✅ HR/ADMIN → ALL EXPENSES
    whereCondition = sql`${expenses.expenseDate} BETWEEN ${from} AND ${to}`;
  } else {
    // ✅ EMPLOYEE → ONLY OWN EXPENSES
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId));

    if (!employee) {
      return reply.status(400).send({
        message: "Employee profile not found",
      });
    }

    whereCondition = and(
      eq(expenses.employeeId, employee.id),
      sql`${expenses.expenseDate} BETWEEN ${from} AND ${to}`,
    );
  }

  const [summary] = await db
    .select({
      totalAmount: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`,
      totalCount: sql<number>`COUNT(${expenses.id})`,
    })
    .from(expenses)
    .where(whereCondition);

  return {
    fromDate,
    toDate,
    totalAmount: summary.totalAmount,
    totalExpenses: summary.totalCount,
  };
}


export async function createExpenseRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [existing] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id));

  if (!existing) {
    return reply.status(404).send({ message: "Expense not found" });
  }

  if (existing.status !== "DRAFT") {
    return reply.status(400).send({
      message: "Only DRAFT expenses can be created",
    });
  }

  await db
    .update(expenses)
    .set({
      status: "CREATED",
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id));

  return sendMessage(reply, "Expense request created successfully");
}

export async function approveExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [existing] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id));

  if (!existing) {
    return reply.status(404).send({ message: "Expense not found" });
  }

  if (existing.status !== "CREATED") {
    return reply.status(400).send({
      message: "Only CREATED expenses can be approved",
    });
  }

  await db
    .update(expenses)
    .set({
      status: "APPROVED",
      approvedBy: request.user!.id,
      approvedAt: new Date(),

      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,

      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id));

  return sendMessage(reply, "Expense approved successfully");
}

export async function rejectExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const { reason } = request.body as { reason?: string };

  const [existing] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id));

  if (!existing) {
    return reply.status(404).send({ message: "Expense not found" });
  }

  if (existing.status !== "CREATED") {
    return reply.status(400).send({
      message: "Only CREATED expenses can be rejected",
    });
  }

  if (!reason || !reason.trim()) {
    return reply.status(400).send({
      message: "Rejection reason is required",
    });
  }

  await db
    .update(expenses)
    .set({
      status: "REJECTED",
      rejectedBy: request.user!.id,
      rejectedAt: new Date(),
      rejectionReason: reason,

      approvedBy: null,
      approvedAt: null,

      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id));

  return sendMessage(reply, "Expense rejected successfully");
}
