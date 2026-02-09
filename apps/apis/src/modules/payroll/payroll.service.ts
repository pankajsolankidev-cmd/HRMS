import type { FastifyRequest, FastifyReply } from "fastify";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { employees, payrolls, salary } from "../../db/schema";

import type {
  ProcessPayrollDto,
  UpdatePayrollDto,
} from "@shared/types/src/payroll/payroll.dto";

import type { PayrollFilterDto } from "@shared/types/src/payroll/payroll-filter.dto";
import { PayrollMonth, PayrollMonthType } from "../../db/schema/payroll.enums";
import { getPagination } from "../../utils/pagination";
import { sendMessage } from "../../utils/api-response";
import { calculateLeaveDeductionForPayroll } from "./utils/leave-deduction.utils";
import { isSalaryProcessedForCurrentMonth } from "./utils/payroll-status.utils";

export async function processPayrollHandler(
  request: FastifyRequest,
  reply: FastifyReply,
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
        eq(payrolls.year, payload.year),
      ),
    );

  if (existingPayroll) {
    return reply
      .code(409)
      .send({ message: "Payroll already processed for this month" });
  }

  const salaryNet = Number(salaryStructure.netSalary);

  const { leaveDeduction } = await calculateLeaveDeductionForPayroll({
    employeeId: payload.employeeId,
    month: payloadMonthIndex + 1,
    year: payload.year,
    salaryNet,
  });

  const deductions = Number(payload.deductions ?? 0);
  const bonus = Number(payload.bonus ?? 0);

  if (deductions < 0 || bonus < 0) {
    return reply
      .code(400)
      .send({ message: "Deductions or bonus cannot be negative" });
  }

  const finalNetSalary = salaryNet - leaveDeduction - deductions + bonus;

  if (finalNetSalary < 0) {
    return reply
      .code(400)
      .send({ message: "Final net salary cannot be negative" });
  }

  await db.insert(payrolls).values({
    employeeId: payload.employeeId,
    month: payload.month,
    year: payload.year,
    processedBy,
    deductions: deductions.toString(),
    deductionReason: payload.deductionReason ?? null,
    leaveDeduction: leaveDeduction.toString(),
    bonus: bonus.toString(),
    bonusDescription: payload.bonusDescription ?? null,
    netSalary: finalNetSalary.toString(),
    file: payload.file,
  });

  return sendMessage(reply, "Payroll processed successfully", 201);
}

export async function getPayrollsHandler(request: FastifyRequest) {
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

  const { page, limit, offset } = getPagination(filters ?? {});

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orderByClauses = [];

  if (!filters?.sortBy) {
    orderByClauses.push(desc(payrolls.updatedAt));
  } else {
    orderByClauses.push(
      filters.sortOrder === "asc"
        ? asc(payrolls[filters.sortBy])
        : desc(payrolls[filters.sortBy]),
    );
  }

  let queryBuilder = db
    .select()
    .from(payrolls)
    .innerJoin(employees, eq(employees.id, payrolls.employeeId))
    .where(whereClause)
    .orderBy(...orderByClauses)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payrolls)
    .where(whereClause);

  return {
    data,
    meta: {
      page,
      limit: limit ?? null,
      total: Number(count),
    },
  };
}

export async function getPayrollByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [payroll] = await db
    .select({
      payroll: payrolls,
      employee: {
        firstName: employees.firstName,
        lastName: employees.lastName,
      },
    })
    .from(payrolls)
    .innerJoin(employees, eq(employees.id, payrolls.employeeId))
    .where(eq(payrolls.id, id));

  if (!payroll) {
    return reply.code(404).send({ message: "Payroll not found" });
  }

  return payroll;
}

export async function updatePayrollHandler(
  request: FastifyRequest,
  reply: FastifyReply,
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

  const employeeId = payload.employeeId ?? existing.employeeId;

  const [salaryStructure] = await db
    .select()
    .from(salary)
    .where(eq(salary.employeeId, employeeId));

  if (!salaryStructure) {
    return reply
      .code(404)
      .send({ message: "Salary structure not found for employee" });
  }

  const salaryNet = Number(salaryStructure.netSalary);

  const payloadMonth = payload.month ?? existing.month;
  const payloadYear = payload.year ?? existing.year;
  const payloadMonthIndex = PayrollMonth.indexOf(payloadMonth);

  const { leaveDeduction } = await calculateLeaveDeductionForPayroll({
    employeeId,
    month: payloadMonthIndex + 1,
    year: payloadYear,
    salaryNet,
  });

  const deductions =
    payload.deductions !== undefined
      ? Number(payload.deductions)
      : Number(existing.deductions);

  const bonus =
    payload.bonus !== undefined
      ? Number(payload.bonus)
      : Number(existing.bonus);

  if (deductions < 0 || bonus < 0) {
    return reply
      .code(400)
      .send({ message: "Deductions or bonus cannot be negative" });
  }

  const finalNetSalary = salaryNet - leaveDeduction - deductions + bonus;

  if (finalNetSalary < 0) {
    return reply
      .code(400)
      .send({ message: "Final net salary cannot be negative" });
  }

  await db
    .update(payrolls)
    .set({
      employeeId,
      month: payloadMonth,
      year: payloadYear,
      deductions: deductions.toString(),
      deductionReason:
        payload.deductionReason !== undefined
          ? payload.deductionReason
          : existing.deductionReason,
      bonus: bonus.toString(),
      bonusDescription:
        payload.bonusDescription !== undefined
          ? payload.bonusDescription
          : existing.bonusDescription,
      leaveDeduction: leaveDeduction.toString(),
      netSalary: finalNetSalary.toString(),
      file: payload.file ?? existing.file,
    })
    .where(eq(payrolls.id, id));

  return sendMessage(reply, "Payroll updated successfully");
}

export async function deletePayrollHandler(
  request: FastifyRequest,
  reply: FastifyReply,
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

export async function getCurrentPayrollStatusHandler(request: FastifyRequest) {
  const { employeeId } = request.query as { employeeId: string };

  return isSalaryProcessedForCurrentMonth(employeeId);
}

export async function getPayrollSummaryHandler(request: FastifyRequest) {
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

export async function previewBulkPayrollHandler(request: FastifyRequest) {
  const { month, year } = request.query as {
    month: PayrollMonthType;
    year: number;
  };

  const monthIndex = PayrollMonth.indexOf(month) + 1;

  const employeesWithSalary = await db
    .select({
      employeeId: salary.employeeId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      salaryNet: salary.netSalary,
      pf: salary.pf,
      tax: salary.tax,
    })
    .from(salary)
    .innerJoin(employees, eq(employees.id, salary.employeeId));

  const processedPayrolls = await db
    .select({
      employeeId: payrolls.employeeId,
    })
    .from(payrolls)
    .where(and(eq(payrolls.month, month), eq(payrolls.year, year)));

  const processedEmployeeSet = new Set(
    processedPayrolls.map((p) => p.employeeId),
  );

  const preview = [];

  for (const row of employeesWithSalary) {
    const salaryNet = Number(row.salaryNet);

    const { leaveDeduction } = await calculateLeaveDeductionForPayroll({
      employeeId: row.employeeId,
      month: monthIndex,
      year,
      salaryNet,
    });

    preview.push({
      employeeId: row.employeeId,
      firstName: row.firstName,
      lastName: row.lastName,
      salaryNet,
      pf: row.pf,
      tax: row.tax,
      leaveDeduction,
      suggestedNetSalary: salaryNet - leaveDeduction,
      isSalaryProcessed: processedEmployeeSet.has(row.employeeId),
    });
  }

  return {
    month,
    year,
    data: preview,
  };
}

export async function processBulkPayrollHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { month, year, adjustments } = request.body as {
    month: PayrollMonthType;
    year: number;
    adjustments: {
      employeeId: string;
      deductions?: string;
      bonus?: string;
    }[];
  };

  const processedBy = request.user!.id;
  const monthIndex = PayrollMonth.indexOf(month) + 1;

  const adjustmentMap = new Map<
    string,
    { deductions: number; bonus: number }
  >();

  for (const adj of adjustments) {
    adjustmentMap.set(adj.employeeId, {
      deductions: Number(adj.deductions ?? 0),
      bonus: Number(adj.bonus ?? 0),
    });
  }

  await db.transaction(async (tx) => {
    const salaryRows = await tx.select().from(salary);

    for (const row of salaryRows) {
      const employeeId = row.employeeId;

      const [existingPayroll] = await tx
        .select()
        .from(payrolls)
        .where(
          and(
            eq(payrolls.employeeId, employeeId),
            eq(payrolls.month, month),
            eq(payrolls.year, year),
          ),
        );

      if (existingPayroll) continue;

      const salaryNet = Number(row.netSalary);

      const { leaveDeduction } = await calculateLeaveDeductionForPayroll({
        employeeId,
        month: monthIndex,
        year,
        salaryNet,
      });

      const adjustment = adjustmentMap.get(employeeId) ?? {
        deductions: 0,
        bonus: 0,
      };

      if (adjustment.deductions < 0 || adjustment.bonus < 0) continue;

      const finalNetSalary =
        salaryNet - leaveDeduction - adjustment.deductions + adjustment.bonus;

      if (finalNetSalary < 0) continue;

      await tx.insert(payrolls).values({
        employeeId,
        month,
        year,
        processedBy,
        deductions: adjustment.deductions.toString(),
        deductionReason: null,
        bonus: adjustment.bonus.toString(),
        bonusDescription: null,
        leaveDeduction: leaveDeduction.toString(),
        netSalary: finalNetSalary.toString(),
      });
    }
  });

  return sendMessage(reply, "Bulk payroll processed successfully", 201);
}
