import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";

import { db } from "../../db";

import { sendMessage } from "../../utils/api-response";
import { expenses } from "../../db/schema/expenses";
import type { CreateExpenseDto } from "@shared/types/src/expense/create-expense.dto";
import type { UpdateExpenseDto } from "@shared/types/src/expense/update-expense.dto";
import { ExpenseStatus } from "../../db/schema/expense.enums";
import { employees } from "../../db/schema";

export async function createExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as CreateExpenseDto;

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

  if (query.search) {
    conditions.push(ilike(expenses.expenseType, `%${query.search}%`));
  }

  if (query.status) {
    conditions.push(eq(expenses.status, query.status as ExpenseStatus));
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Number(query.limit) || 10);
  const offset = (page - 1) * limit;

  const sortColumn =
    query.sortBy === "amount"
      ? expenses.amount
      : query.sortBy === "expenseDate"
      ? expenses.expenseDate
      : expenses.createdAt;

  const order = query.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const data = await db
    .select()
    .from(expenses)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

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
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };

  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));

  if (!expense) {
    return reply.status(404).send({ message: "Expense not found" });
  }

  return expense;
}

export async function updateExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply
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

  await db
    .update(expenses)
    .set({
      expenseType: body.expenseType,
      description: body.description,
      file: body.file,
      status: body.status,

      amount: body.amount !== undefined ? body.amount.toString() : undefined,

      expenseDate: body.expenseDate,

      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id));

  return sendMessage(reply, "Expense updated successfully");
}

export async function deleteExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply
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

export async function getExpenseSummaryHandler(request: FastifyRequest) {
  const { month, year } = request.query as {
    month: number;
    year: number;
  };

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, request.user!.id));

  if (!employee) {
    throw new Error("Employee profile not found");
  }

  const [summary] = await db
    .select({
      totalAmount: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`,
      totalCount: sql<number>`COUNT(${expenses.id})`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.employeeId, employee.id),
        eq(expenses.status, "DRAFT"),
        sql`EXTRACT(MONTH FROM ${expenses.expenseDate}) = ${month}`,
        sql`EXTRACT(YEAR FROM ${expenses.expenseDate}) = ${year}`
      )
    );

  return {
    month,
    year,
    totalAmount: summary.totalAmount,
    totalExpenses: summary.totalCount,
  };
}
