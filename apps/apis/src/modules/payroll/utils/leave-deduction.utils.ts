import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "../../../db";
import { leaveRequests } from "../../../db/schema/leave-requests.schema";
import { LeaveStatus } from "../../../db/schema/leave.enums";

type LeaveDeductionParams = {
  employeeId: string;
  month: number;
  year: number;
  allowedLeave?: number;
  salaryNet: number;
  workingDays?: number;
};

export async function calculateLeaveDeductionForPayroll({
  employeeId,
  month,
  year,
  salaryNet,
  allowedLeave = 1.25,
  workingDays = 30,
}: LeaveDeductionParams) {
  const fromDate = new Date(year, month - 1, 1).toISOString().split("T")[0];

  const toDate = new Date(year, month, 0).toISOString().split("T")[0];

  const leaves = await db
    .select({
      totalDays: leaveRequests.totalDays,
    })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, employeeId),
        eq(leaveRequests.status, LeaveStatus.Approved),

        gte(leaveRequests.fromDate, fromDate),
        lte(leaveRequests.toDate, toDate),

        ne(leaveRequests.type, "wfh"),
      ),
    );

  const totalLeaveTaken = leaves.reduce(
    (sum, l) => sum + Number(l.totalDays),
    0,
  );

  const excessLeave = Math.max(0, totalLeaveTaken - allowedLeave);

  const perDaySalary = salaryNet / workingDays;

  const leaveDeduction = excessLeave * perDaySalary;

  return {
    totalLeaveTaken,
    excessLeave,
    leaveDeduction,
  };
}
