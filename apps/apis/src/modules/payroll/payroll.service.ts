import type { FastifyRequest, FastifyReply } from "fastify";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { employees, payrolls, roles, salary, userRoles } from "../../db/schema";
import type { PayrollFilterDto } from "@shared/types/src/payroll/payroll-filter.dto";
import { PayrollMonth, PayrollMonthType } from "../../db/schema/payroll.enums";
import { getPagination } from "../../utils/pagination";
import { sendMessage } from "../../utils/api-response";
import { calculateLeaveDeductionForPayroll } from "./utils/leave-deduction.utils";
import { hasAnyRole, hasRole } from "../../utils/role.utils";

export async function getPayrollsHandler(request: FastifyRequest) {
  const userId = request.user!.id;

  const filters = request.query as PayrollFilterDto;

  const conditions = [];

  // 1️⃣ Fetch user roles from DB (same as leave handler)
  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isHRorAdmin = hasAnyRole(roleNames, ["HR", "ADMIN"]);

  // 2️⃣ Employee cannot filter other employees
  if (!isHRorAdmin && filters?.employeeId) {
    throw new Error("Employee cannot filter other employees payroll");
  }

  // 3️⃣ Resolve employeeId
  let resolvedEmployeeId: string | undefined;

  const [employee] = await db
    .select({ id: employees.id, userId: employees.userId })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!isHRorAdmin) {
    // EMPLOYEE: only own payroll
    if (!employee) {
      return {
        data: [],
        meta: { page: 1, limit: null, total: 0 },
      };
    }

    resolvedEmployeeId = employee.id;
  } else {
    // HR / ADMIN: optional employee filter
    if (filters?.employeeId) {
      resolvedEmployeeId = filters.employeeId;
    }
  }

  if (resolvedEmployeeId) {
    conditions.push(eq(payrolls.employeeId, resolvedEmployeeId));
  }

  // 4️⃣ Other filters
  if (filters?.month !== undefined) {
    conditions.push(eq(payrolls.month, filters.month));
  }

  if (filters?.year !== undefined) {
    conditions.push(eq(payrolls.year, filters.year));
  }

  const { page, limit, offset } = getPagination(filters ?? {});

  const whereClause = conditions.length ? and(...conditions) : undefined;

  // 5️⃣ Sorting
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

  // 6️⃣ Count
  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(payrolls)
    .where(whereClause);

  // 7️⃣ Data query
  let queryBuilder = db
    .select({
      payroll: payrolls,
      employee: {
        id: employees.id,
        userId: employees.userId,
        firstName: employees.firstName,
        lastName: employees.lastName,
      },
    })
    .from(payrolls)
    .innerJoin(employees, eq(employees.id, payrolls.employeeId))
    .where(whereClause)
    .orderBy(...orderByClauses)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  return {
    data,
    meta: {
      page,
      limit: limit ?? null,
      total: countResult?.count ?? 0,
    },
  };
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

export async function getPayrollSummaryHandler(
  request: FastifyRequest,
) {
  const { month, year } = request.query as {
    month: PayrollMonthType;
    year: number;
  };

  const [result] = await db
    .select({
      employeesProcessed: sql<number>`
        COUNT(DISTINCT ${payrolls.employeeId})
      `,
      totalNetPayroll: sql<number>`
        COALESCE(SUM(${payrolls.netSalary}::numeric), 0)
      `,
    })
    .from(payrolls)
    .where(
      and(
        eq(payrolls.month, month),
        eq(payrolls.year, year),
      ),
    );

  const employeesProcessed = Number(
    result?.employeesProcessed ?? 0,
  );
  const netPayroll = Number(
    result?.totalNetPayroll ?? 0,
  );

  const avgSalary =
    employeesProcessed > 0
      ? Math.round(netPayroll / employeesProcessed)
      : 0;

  return {
    employeesProcessed,
    avgSalary,
    netPayroll,
  };
}

export async function employeeBulkPayrollHandler(request: FastifyRequest) {
  const { month, year } = request.query as {
    month?: PayrollMonthType;
    year?: number;
  };

  const now = new Date();

  let resolvedMonth: PayrollMonthType;
  let resolvedYear: number;

  if (!month || !year) {
    const prevMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    resolvedYear = prevMonthDate.getFullYear();
    resolvedMonth = PayrollMonth[
      prevMonthDate.getMonth()
    ] as PayrollMonthType;
  } else {
    resolvedMonth = month;
    resolvedYear = year;
  }

  const monthIndex = PayrollMonth.indexOf(resolvedMonth) + 1;

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
    .where(
      and(
        eq(payrolls.month, resolvedMonth),
        eq(payrolls.year, resolvedYear),
      ),
    );

  const processedEmployeeSet = new Set(
    processedPayrolls.map((p) => p.employeeId),
  );

  const preview = [];

  for (const row of employeesWithSalary) {
    const salaryNet = Number(row.salaryNet);

    const { leaveDeduction } = await calculateLeaveDeductionForPayroll({
      employeeId: row.employeeId,
      month: monthIndex,
      year: resolvedYear,
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
    month: resolvedMonth,
    year: resolvedYear,
    data: preview,
  };
}


export async function processBulkPayrollHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { month, year, adjustments } = request.body as {
    month?: PayrollMonthType;
    year?: number;
    adjustments: {
      employeeId: string;
      deductions?: number;
      deductionReason?: string;
      bonus?: number;
      bonusDescription?: string;
    }[];
  };

  const now = new Date();

  let resolvedMonth: PayrollMonthType;
  let resolvedYear: number;

  if (!month || !year) {
    const prevMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    resolvedYear = prevMonthDate.getFullYear();
    resolvedMonth = PayrollMonth[
      prevMonthDate.getMonth()
    ] as PayrollMonthType;
  } else {
    resolvedMonth = month;
    resolvedYear = year;
  }

  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth() + 1;
  const requestedMonthIndex =
    PayrollMonth.indexOf(resolvedMonth) + 1;

  if (
    resolvedYear > currentYear ||
    (resolvedYear === currentYear &&
      requestedMonthIndex > currentMonthIndex)
  ) {
    return reply.code(400).send({
      message: "Future month payroll cannot be processed",
    });
  }

  if (!adjustments.length) {
    return reply.code(400).send({
      message: "No employees selected for payroll processing",
    });
  }

  const processedBy = request.user!.id;
  const monthIndex = requestedMonthIndex;
  const employeeIds = adjustments.map((a) => a.employeeId);

  const alreadyProcessed = await db
    .select({
      employeeId: payrolls.employeeId,
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(payrolls)
    .innerJoin(employees, eq(employees.id, payrolls.employeeId))
    .where(
      and(
        eq(payrolls.month, resolvedMonth),
        eq(payrolls.year, resolvedYear),
        sql`${payrolls.employeeId} IN ${employeeIds}`,
      ),
    );

  if (alreadyProcessed.length > 0) {
    return reply.code(409).send({
      message: `Payroll already processed for ${resolvedMonth} ${resolvedYear}`,
      employees: alreadyProcessed.map(
        (e) => `${e.firstName} ${e.lastName}`,
      ),
    });
  }

  const salaryRows = await db
    .select({
      employeeId: salary.employeeId,
      netSalary: salary.netSalary,
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(salary)
    .innerJoin(employees, eq(employees.id, salary.employeeId))
    .where(sql`${salary.employeeId} IN ${employeeIds}`);

  const salaryMap = new Map(
    salaryRows.map((r) => [r.employeeId, r]),
  );

  const invalidEmployees: string[] = [];

  for (const adj of adjustments) {
    const row = salaryMap.get(adj.employeeId);
    if (!row) continue;

    const salaryNet = Number(row.netSalary);
    const deductions = Number(adj.deductions ?? 0);
    const bonus = Number(adj.bonus ?? 0);

    if (deductions < 0 || bonus < 0) {
      invalidEmployees.push(
        `${row.firstName} ${row.lastName}`,
      );
      continue;
    }

    const { leaveDeduction } =
      await calculateLeaveDeductionForPayroll({
        employeeId: adj.employeeId,
        month: monthIndex,
        year: resolvedYear,
        salaryNet,
      });

    const finalNetSalary =
      salaryNet - leaveDeduction - deductions + bonus;

    if (finalNetSalary < 0) {
      invalidEmployees.push(
        `${row.firstName} ${row.lastName}`,
      );
    }
  }

  if (invalidEmployees.length > 0) {
    return reply.code(422).send({
      message: "Invalid payroll data for selected employees",
      employees: invalidEmployees,
    });
  }

  await db.transaction(async (tx) => {
    for (const adj of adjustments) {
      const row = salaryMap.get(adj.employeeId);
      if (!row) continue;

      const salaryNet = Number(row.netSalary);

      const { leaveDeduction } =
        await calculateLeaveDeductionForPayroll({
          employeeId: adj.employeeId,
          month: monthIndex,
          year: resolvedYear,
          salaryNet,
        });

      const deductions = Number(adj.deductions ?? 0);
      const bonus = Number(adj.bonus ?? 0);

      const finalNetSalary =
        salaryNet - leaveDeduction - deductions + bonus;

      await tx.insert(payrolls).values({
        employeeId: adj.employeeId,
        month: resolvedMonth,
        year: resolvedYear,
        processedBy,
        deductions: deductions.toString(),
        deductionReason: adj.deductionReason ?? null,
        bonus: bonus.toString(),
        bonusDescription: adj.bonusDescription ?? null,
        leaveDeduction: leaveDeduction.toString(),
        netSalary: finalNetSalary.toString(),
      });
    }
  });

  return sendMessage(
    reply,
    "Bulk payroll processed successfully",
    201,
  );
}

