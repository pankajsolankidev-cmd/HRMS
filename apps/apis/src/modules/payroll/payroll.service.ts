import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { payrolls, salaryStructures } from "../../db/schema";
import type { ProcessPayrollDto } from "@shared/types/src/payroll/payroll.dto";

export class PayrollService {
  static async process(payload: ProcessPayrollDto, processedBy: string) {
    const [salaryStructure] = await db
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.employeeId, payload.employeeId));

    if (!salaryStructure) {
      throw new Error("Salary structure not found for employee");
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
      throw new Error("Payroll already processed for this month");
    }

    const basicSalary = Number(salaryStructure.basicSalary);
    const deductions = Number(payload.totalDeductions ?? 0);

    if (deductions > basicSalary) {
      throw new Error("Deductions cannot be greater than salary");
    }

    const net = basicSalary - deductions;

    const [created] = await db
      .insert(payrolls)
      .values({
        employeeId: payload.employeeId,
        month: payload.month,
        year: payload.year,
        processedBy,

        totalDeductions: deductions.toString(),
        netSalary: net.toString(),

        file: payload.file,
        processedAt: new Date(),
      })
      .returning();

    return created;
  }

  static async getAll() {
    return db.select().from(payrolls);
  }

  static async getById(id: string) {
    const [payroll] = await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, id));

    if (!payroll) {
      throw new Error("Payroll not found");
    }

    return payroll;
  }
}
