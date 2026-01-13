import type { FastifyRequest, FastifyReply } from "fastify";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { payrolls, salary } from "../../db/schema";

import type {
  ProcessPayrollDto,
  UpdatePayrollDto,
} from "@shared/types/src/payroll/payroll.dto";

import type { PayrollFilterDto } from "@shared/types/src/payroll/payroll-filter.dto";
import { PayrollMonth, PayrollMonthType } from "../../db/schema/payroll.enums";
import { getPagination } from "../../utils/pagination";
import { sendMessage } from "../../utils/api-response";

export async function processPayroll(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const payload = request.body as ProcessPayrollDto;
  const processedBy = request.user!.id;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const payloadMonthIndex = PayrollMonth.indexOf(payload.month);

  if (
    payload.year > currentYear ||
    (payload.year === currentYear && payloadMonthIndex > currentMonthIndex)
  ) {
    return reply
      .code(400)
      .send({ message: "Cannot process payroll for a future month" });
  }

  const [salaryStructure] = await db
    .select()
    .from(salary)
    .where(eq(salary.employeeId, payload.employeeId));

  if (!salaryStructure) {
    return reply
      .code(404)
      .send({ message: "Salary structure not found for employee" });
  }

  const [existingPayroll] = await db
    .select()
    .from(payrolls)
    .where(
      and(
        eq(payrolls.employeeId, payload.employeeId),
        eq(payrolls.month, payload.month),
        eq(payrolls.year, payload.year)
      )
    );

  if (existingPayroll) {
    return reply
      .code(409)
      .send({ message: "Payroll already processed for this month" });
  }

  const basicSalary = Number(salaryStructure.basicSalary);
  const deductions = Number(payload.totalDeductions ?? 0);

  if (deductions > basicSalary) {
    return reply
      .code(400)
      .send({ message: "Deductions cannot be greater than salary" });
  }

  const netSalary = basicSalary - deductions;

  await db.insert(payrolls).values({
    employeeId: payload.employeeId,
    month: payload.month,
    year: payload.year,
    processedBy,
    totalDeductions: deductions.toString(),
    netSalary: netSalary.toString(),
    file: payload.file,
  });

  return sendMessage(reply, "Payroll processed successfully", 201);
}

export async function getPayrolls(request: FastifyRequest) {
  const filters = request.query as PayrollFilterDto;

  const conditions = [];

  if (filters?.month !== undefined) {
    conditions.push(eq(payrolls.month, filters.month));
  }

  if (filters?.year !== undefined) {
    conditions.push(eq(payrolls.year, filters.year));
  }

  if (filters?.employeeId !== undefined) {
    conditions.push(eq(payrolls.employeeId, filters.employeeId));
  }

  const { limit, offset, page } = getPagination(filters ?? {});

  const sortColumn =
    filters?.sortBy === "netSalary"
      ? payrolls.netSalary
      : filters?.sortBy === "year"
      ? payrolls.year
      : payrolls.processedAt;

  const order =
    filters?.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(payrolls)
    .where(whereClause)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payrolls)
    .where(whereClause);

  return {
    data,
    meta: {
      page,
      limit,
      total: Number(count),
    },
  };
}

export async function getPayrollById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };

  const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, id));

  if (!payroll) {
    return reply.code(404).send({ message: "Payroll not found" });
  }

  return payroll;
}

export async function updatePayroll(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const payload = request.body as UpdatePayrollDto;

  const [existing] = await db
    .select()
    .from(payrolls)
    .where(eq(payrolls.id, id));

  if (!existing) {
    return reply.code(404).send({ message: "Payroll not found" });
  }

  const updateData: any = {};
  const employeeId = payload.employeeId ?? existing.employeeId;

  updateData.employeeId = employeeId;

  if (payload.month !== undefined) updateData.month = payload.month;
  if (payload.year !== undefined) updateData.year = payload.year;

  if (payload.totalDeductions !== undefined) {
    const [salaryStructure] = await db
      .select()
      .from(salary)
      .where(eq(salary.employeeId, employeeId));

    if (!salaryStructure) {
      return reply
        .code(404)
        .send({ message: "Salary structure not found for employee" });
    }

    const basicSalary = Number(salaryStructure.basicSalary);
    const deductions = Number(payload.totalDeductions);

    if (deductions > basicSalary) {
      return reply
        .code(400)
        .send({ message: "Deductions cannot be greater than salary" });
    }

    updateData.totalDeductions = deductions.toString();
    updateData.netSalary = (basicSalary - deductions).toString();
  }

  if (payload.file !== undefined) {
    updateData.file = payload.file;
  }

  await db.update(payrolls).set(updateData).where(eq(payrolls.id, id));

  return sendMessage(reply, "Payroll updated successfully");
}

export async function deletePayroll(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };

  const [existing] = await db
    .select()
    .from(payrolls)
    .where(eq(payrolls.id, id));

  if (!existing) {
    return reply.code(404).send({ message: "Payroll not found" });
  }

  await db.delete(payrolls).where(eq(payrolls.id, id));

  return sendMessage(reply, "Payroll deleted successfully");
}

export async function getPayrollSummary(request: FastifyRequest) {
  const { month, year } = request.query as {
    month: PayrollMonthType;
    year: number;
  };

  const [result] = await db
    .select({
      employeesProcessed: sql<number>`COUNT(${payrolls.id})`,
      avgSalary: sql<number>`AVG(${payrolls.netSalary})`,
      netPayroll: sql<number>`SUM(${payrolls.netSalary})`,
    })
    .from(payrolls)
    .where(and(eq(payrolls.month, month), eq(payrolls.year, year)));

  return {
    employeesProcessed: Number(result?.employeesProcessed ?? 0),
    avgSalary: Math.round(Number(result?.avgSalary ?? 0)),
    netPayroll: Number(result?.netPayroll ?? 0),
  };
}
