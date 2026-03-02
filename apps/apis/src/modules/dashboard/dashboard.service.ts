import type { FastifyRequest, FastifyReply } from "fastify";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  employees,
  leaveRequests,
  projectEmployees,
  projects,
  roles,
  userRoles,
} from "../../db/schema";
import { expenses } from "../../db/schema/expenses";
import { LeaveStatus } from "../../db/schema/leave.enums";
import { hasAnyRole } from "../../utils/role.utils";
import { holidays } from "../../db/schema/holidays.schema";

export async function getDashboardSummaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.info(
    { action: "GET_DASHBOARD_SUMMARY" },
    "Dashboard summary request received",
  );

  try {
    const userId = request.user?.id;

    if (!userId) {
      return reply.code(401).send({
        message: "Unauthorized",
      });
    }

    const userRolesRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const roleNames = userRolesRows
      .map((r) => r.roleName)
      .filter((role): role is string => role !== null);

    const isHRorAdmin = hasAnyRole(roleNames, ["HR", "ADMIN"]);

    if (!isHRorAdmin) {
      return reply.code(403).send({
        message: "Forbidden",
      });
    }

    const today = sql`CURRENT_DATE`;

    const startOfMonth = sql`date_trunc('month', CURRENT_DATE)`;

    const [
      totalEmployeesResult,
      onLeaveRows,
      recentLeaves,
      recentExpenses,
      totalExpenseThisMonthResult,
    ] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(employees),

      db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          type: leaveRequests.type,
          fromDate: leaveRequests.fromDate,
          toDate: leaveRequests.toDate,
          totalDays: leaveRequests.totalDays,
        })
        .from(leaveRequests)
        .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
        .where(
          and(
            eq(leaveRequests.status, LeaveStatus.Approved),
            lte(leaveRequests.fromDate, today),
            gte(leaveRequests.toDate, today),
          ),
        ),

      db
        .select({
          id: leaveRequests.id,
          employeeName: sql<string>`
            concat(${employees.firstName}, ' ', ${employees.lastName})
          `,
          type: leaveRequests.type,
          status: leaveRequests.status,
          createdAt: leaveRequests.createdAt,
        })
        .from(leaveRequests)
        .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
        .where(eq(leaveRequests.status, LeaveStatus.Pending))
        .orderBy(desc(leaveRequests.createdAt))
        .limit(5),

      db
        .select({
          id: expenses.id,
          employeeName: sql<string>`
            concat(${employees.firstName}, ' ', ${employees.lastName})
          `,
          expenseType: expenses.expenseType,
          amount: sql<number>`cast(${expenses.amount} as float)`,
          status: expenses.status,
          createdAt: expenses.createdAt,
        })
        .from(expenses)
        .innerJoin(employees, eq(employees.id, expenses.employeeId))
        .where(eq(expenses.status, "CREATED"))
        .orderBy(desc(expenses.createdAt))
        .limit(5),

      db
        .select({
          total: sql<number>`coalesce(sum(${expenses.amount}), 0)::float`,
        })
        .from(expenses)
        .where(gte(expenses.expenseDate, startOfMonth)),
    ]);

    const totalEmployees = Number(totalEmployeesResult[0]?.count ?? 0);

    const onLeaveToday = {
      count: onLeaveRows.length,
      employees: onLeaveRows,
    };

    const availableToday = totalEmployees - onLeaveToday.count;

    const totalExpenseThisMonth = Number(
      totalExpenseThisMonthResult[0]?.total ?? 0,
    );

    return {
      totalEmployees,
      availableToday,
      onLeaveToday,
      recentLeaves,
      recentExpenses,
      totalExpenseThisMonth,
    };
  } catch (err) {
    request.log.error(
      { action: "GET_DASHBOARD_SUMMARY", err },
      "Failed to fetch dashboard summary",
    );

    return reply.code(500).send({
      message: "Internal server error",
    });
  }
}

export async function getEmployeeDashboardHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const userId = request.user?.id;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const employee = await db.query.employees.findFirst({
      where: eq(employees.userId, userId),
    });

    if (!employee) {
      return reply.code(404).send({ message: "Employee not found" });
    }

    const today = sql`CURRENT_DATE`;

    const monthsWorkedResult = await db
      .select({
        months: sql<number>`
          (
            date_part('year', age(CURRENT_DATE, ${employees.joiningDate})) * 12
            +
            date_part('month', age(CURRENT_DATE, ${employees.joiningDate}))
          )
        `,
      })
      .from(employees)
      .where(eq(employees.id, employee.id));

    const monthsWorked = Number(monthsWorkedResult[0]?.months ?? 0);

    const MONTHLY_ACCRUAL = 1.25;

    const totalEarned = monthsWorked * MONTHLY_ACCRUAL;

    const usedLeavesResult = await db
      .select({
        total: sql<number>`
          coalesce(sum(${leaveRequests.totalDays}), 0)::float
        `,
      })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.employeeId, employee.id),
          eq(leaveRequests.status, LeaveStatus.Approved),
        ),
      );

    const totalUsed = Number(usedLeavesResult[0]?.total ?? 0);

    const remaining = totalEarned - totalUsed;

    const upcomingHolidayResult = await db
      .select({
        id: holidays.id,
        title: holidays.title,
        fromDate: holidays.fromDate,
        toDate: holidays.toDate,
        description: holidays.description,
      })
      .from(holidays)
      .where(gte(holidays.toDate, today))
      .orderBy(holidays.fromDate)
      .limit(1);

    const upcomingHoliday =
      upcomingHolidayResult.length > 0 ? upcomingHolidayResult[0] : null;

   const currentProjects = await db
  .select({
    id: projects.id,
    name: projects.name,
    clientName: projects.clientName,
    startDate: projects.startDate,
    expectedEndDate: projects.expectedEndDate,
    status: projects.status,
  })
  .from(projectEmployees)
  .innerJoin(projects, eq(projects.id, projectEmployees.projectId))
  .where(
    and(
      eq(projectEmployees.employeeId, employee.id),
      eq(projects.status, "ACTIVE"),
    ),
  );
    

    

    return {
      leaveBalance: {
        monthsWorked,
        monthlyAccrual: MONTHLY_ACCRUAL,
        totalEarned,
        totalUsed,
        remaining,
      },
      upcomingHoliday,
      currentProjects,
    };
  } catch (error) {
    request.log.error(
      { action: "GET_EMPLOYEE_DASHBOARD_SUMMARY", error },
      "Failed to fetch employee dashboard summary",
    );

    return reply.code(500).send({
      message: "Internal server error",
    });
  }
}
