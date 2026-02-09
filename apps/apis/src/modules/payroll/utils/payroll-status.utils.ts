import { and, eq } from "drizzle-orm";
import { db } from "../../../db";
import { payrolls } from "../../../db/schema";
import { PayrollMonth } from "../../../db/schema/payroll.enums";

export async function isSalaryProcessedForCurrentMonth(employeeId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = PayrollMonth[now.getMonth()];

  const [existing] = await db
    .select({ id: payrolls.id })
    .from(payrolls)
    .where(
      and(
        eq(payrolls.employeeId, employeeId),
        eq(payrolls.month, month),
        eq(payrolls.year, year),
      ),
    );

  return {
    employeeId,
    month,
    year,
    is_salary_processed: Boolean(existing),
  };
}
