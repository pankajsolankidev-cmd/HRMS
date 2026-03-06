import type { FastifyRequest, FastifyReply } from "fastify";
import { and, asc, desc, eq, SQL, sql } from "drizzle-orm";
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

  request.log.info(
    {
      action: "GET_PAYROLLS",
      userId,
      filters,
    },
    "Get payrolls request received",
  );

  try {
    const conditions: SQL[] = [eq(employees.isActive, true)];

    const userRolesRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const roleNames = userRolesRows
      .map((r) => r.roleName)
      .filter((role): role is string => role !== null);

    const isHRorAdmin = hasAnyRole(roleNames, ["HR", "ADMIN"]);

    if (!isHRorAdmin && filters?.employeeId) {
      request.log.warn(
        {
          action: "GET_PAYROLLS",
          userId,
          attemptedEmployeeId: filters.employeeId,
        },
        "Employee attempted to access other employee payroll",
      );

      return {
        data: [],
        meta: { page: 1, limit: null, total: 0 },
      };
    }

    let resolvedEmployeeId: string | undefined;

    const [employee] = await db
      .select({ id: employees.id, userId: employees.userId })
      .from(employees)
      .where(and(eq(employees.userId, userId), eq(employees.isActive, true)));

    if (!isHRorAdmin) {
      if (!employee) {
        request.log.warn(
          { action: "GET_PAYROLLS", userId },
          "Employee record not found for user",
        );

        return {
          data: [],
          meta: { page: 1, limit: null, total: 0 },
        };
      }

      resolvedEmployeeId = employee.id;
    } else if (filters?.employeeId) {
      resolvedEmployeeId = filters.employeeId;
    }

    if (resolvedEmployeeId) {
      conditions.push(eq(payrolls.employeeId, resolvedEmployeeId));
    }

    if (filters?.month !== undefined) {
      conditions.push(eq(payrolls.month, filters.month));
    }

    if (filters?.year !== undefined) {
      conditions.push(eq(payrolls.year, filters.year));
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

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(payrolls)
      .innerJoin(employees, eq(employees.id, payrolls.employeeId))
      .where(and(...conditions));

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

    request.log.info(
      {
        action: "GET_PAYROLLS",
        userId,
        resultCount: data.length,
        total: countResult?.count ?? 0,
      },
      "Payrolls fetched successfully",
    );

    return {
      data,
      meta: {
        page,
        limit: limit ?? null,
        total: countResult?.count ?? 0,
      },
    };
  } catch (err) {
    request.log.error(
      {
        action: "GET_PAYROLLS",
        userId,
        err,
      },
      "Failed to fetch payrolls",
    );

    return {
      data: [],
      meta: { page: 1, limit: null, total: 0 },
    };
  }
}

export async function deletePayrollHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "DELETE_PAYROLL",
      payrollId: id,
    },
    "Delete payroll request received",
  );

  try {
    const [existing] = await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, id));

    if (!existing) {
      request.log.warn(
        {
          action: "DELETE_PAYROLL",
          payrollId: id,
        },
        "Payroll not found",
      );

      return reply.code(404).send({ message: "Payroll not found" });
    }

    await db.delete(payrolls).where(eq(payrolls.id, id));

    request.log.info(
      {
        action: "DELETE_PAYROLL",
        payrollId: id,
      },
      "Payroll deleted successfully",
    );

    return sendMessage(reply, "Payroll deleted successfully");
  } catch (err) {
    request.log.error(
      {
        action: "DELETE_PAYROLL",
        payrollId: id,
        err,
      },
      "Failed to delete payroll",
    );

    return reply.code(500).send({ message: "Internal Server Error" });
  }
}
export async function getPayrollSummaryHandler(request: FastifyRequest) {
  const { month, year } = request.query as {
    month: PayrollMonthType;
    year: number;
  };

  request.log.info(
    {
      action: "GET_PAYROLL_SUMMARY",
      month,
      year,
    },
    "Get payroll summary request received",
  );

  try {
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
      .where(and(eq(payrolls.month, month), eq(payrolls.year, year)));

    const employeesProcessed = Number(result?.employeesProcessed ?? 0);
    const netPayroll = Number(result?.totalNetPayroll ?? 0);

    const avgSalary =
      employeesProcessed > 0 ? Math.round(netPayroll / employeesProcessed) : 0;

    request.log.info(
      {
        action: "GET_PAYROLL_SUMMARY",
        month,
        year,
        employeesProcessed,
        netPayroll,
        avgSalary,
      },
      "Payroll summary fetched successfully",
    );

    return {
      employeesProcessed,
      avgSalary,
      netPayroll,
    };
  } catch (err) {
    request.log.error(
      {
        action: "GET_PAYROLL_SUMMARY",
        month,
        year,
        err,
      },
      "Failed to fetch payroll summary",
    );

    return {
      employeesProcessed: 0,
      avgSalary: 0,
      netPayroll: 0,
    };
  }
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
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    resolvedYear = prevMonthDate.getFullYear();
    resolvedMonth = PayrollMonth[prevMonthDate.getMonth()] as PayrollMonthType;
  } else {
    resolvedMonth = month;
    resolvedYear = year;
  }

  request.log.info(
    {
      action: "BULK_PAYROLL_PREVIEW",
      month: resolvedMonth,
      year: resolvedYear,
    },
    "Employee bulk payroll preview request received",
  );

  try {
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
        and(eq(payrolls.month, resolvedMonth), eq(payrolls.year, resolvedYear)),
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

    request.log.info(
      {
        action: "BULK_PAYROLL_PREVIEW",
        month: resolvedMonth,
        year: resolvedYear,
        employeeCount: preview.length,
      },
      "Employee bulk payroll preview generated",
    );

    return {
      month: resolvedMonth,
      year: resolvedYear,
      data: preview,
    };
  } catch (err) {
    request.log.error(
      {
        action: "BULK_PAYROLL_PREVIEW",
        month: resolvedMonth,
        year: resolvedYear,
        err,
      },
      "Failed to generate bulk payroll preview",
    );

    return {
      month: resolvedMonth,
      year: resolvedYear,
      data: [],
    };
  }
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
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    resolvedYear = prevMonthDate.getFullYear();
    resolvedMonth = PayrollMonth[prevMonthDate.getMonth()] as PayrollMonthType;
  } else {
    resolvedMonth = month;
    resolvedYear = year;
  }

  request.log.info(
    {
      action: "PROCESS_BULK_PAYROLL",
      month: resolvedMonth,
      year: resolvedYear,
      employeeCount: adjustments.length,
    },
    "Process bulk payroll request received",
  );

  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth() + 1;
  const requestedMonthIndex = PayrollMonth.indexOf(resolvedMonth) + 1;

  if (
    resolvedYear > currentYear ||
    (resolvedYear === currentYear && requestedMonthIndex > currentMonthIndex)
  ) {
    request.log.warn(
      {
        action: "PROCESS_BULK_PAYROLL",
        month: resolvedMonth,
        year: resolvedYear,
      },
      "Attempted to process future payroll",
    );

    return reply.code(400).send({
      message: "Future month payroll cannot be processed",
    });
  }

  if (!adjustments.length) {
    request.log.warn(
      { action: "PROCESS_BULK_PAYROLL" },
      "No employees selected for payroll processing",
    );

    return reply.code(400).send({
      message: "No employees selected for payroll processing",
    });
  }

  try {
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
      request.log.warn(
        {
          action: "PROCESS_BULK_PAYROLL",
          month: resolvedMonth,
          year: resolvedYear,
          alreadyProcessedCount: alreadyProcessed.length,
        },
        "Payroll already processed for some employees",
      );

      return reply.code(409).send({
        message: `Payroll already processed for ${resolvedMonth} ${resolvedYear}`,
        employees: alreadyProcessed.map((e) => `${e.firstName} ${e.lastName}`),
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

    const salaryMap = new Map(salaryRows.map((r) => [r.employeeId, r]));

    const invalidEmployees: string[] = [];

    for (const adj of adjustments) {
      const row = salaryMap.get(adj.employeeId);
      if (!row) continue;

      const salaryNet = Number(row.netSalary);
      const deductions = Number(adj.deductions ?? 0);
      const bonus = Number(adj.bonus ?? 0);

      if (deductions < 0 || bonus < 0) {
        invalidEmployees.push(`${row.firstName} ${row.lastName}`);
        continue;
      }

      const { leaveDeduction } = await calculateLeaveDeductionForPayroll({
        employeeId: adj.employeeId,
        month: monthIndex,
        year: resolvedYear,
        salaryNet,
      });

      const finalNetSalary = salaryNet - leaveDeduction - deductions + bonus;

      if (finalNetSalary < 0) {
        invalidEmployees.push(`${row.firstName} ${row.lastName}`);
      }
    }

    if (invalidEmployees.length > 0) {
      request.log.warn(
        {
          action: "PROCESS_BULK_PAYROLL",
          invalidEmployeeCount: invalidEmployees.length,
        },
        "Invalid payroll data detected",
      );

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

        const { leaveDeduction } = await calculateLeaveDeductionForPayroll({
          employeeId: adj.employeeId,
          month: monthIndex,
          year: resolvedYear,
          salaryNet,
        });

        const deductions = Number(adj.deductions ?? 0);
        const bonus = Number(adj.bonus ?? 0);

        const finalNetSalary = salaryNet - leaveDeduction - deductions + bonus;

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

    request.log.info(
      {
        action: "PROCESS_BULK_PAYROLL",
        month: resolvedMonth,
        year: resolvedYear,
        processedCount: adjustments.length,
      },
      "Bulk payroll processed successfully",
    );

    return sendMessage(reply, "Bulk payroll processed successfully", 201);
  } catch (err) {
    request.log.error(
      {
        action: "PROCESS_BULK_PAYROLL",
        month: resolvedMonth,
        year: resolvedYear,
        err,
      },
      "Failed to process bulk payroll",
    );

    return reply.code(500).send({ message: "Internal Server Error" });
  }
}
