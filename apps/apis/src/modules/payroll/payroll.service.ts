import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { payrolls, salaryStructures } from "../../db/schema";

import type {
  ProcessPayrollDto,
  UpdatePayrollDto,
} from "@shared/types/src/payroll/payroll.dto";
import type { PayrollFilterDto } from "@shared/types/src/payroll/payroll-filter.dto";

export class PayrollService {
  static async process(payload: ProcessPayrollDto, processedBy: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (
      payload.year > currentYear ||
      (payload.year === currentYear && payload.month > currentMonth)
    ) {
      throw new Error("Cannot process payroll for a future month");
    }

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

    const netSalary = basicSalary - deductions;

    const [created] = await db
      .insert(payrolls)
      .values({
        employeeId: payload.employeeId,
        month: payload.month,
        year: payload.year,
        processedBy,
        totalDeductions: deductions.toString(),
        netSalary: netSalary.toString(),
        file: payload.file,
        processedAt: new Date(),
      })
      .returning();

    return created;
  }

  static async getAll(filters?: PayrollFilterDto) {
    const conditions = [];

    if (filters?.month) {
      conditions.push(eq(payrolls.month, filters.month));
    }

    if (filters?.year) {
      conditions.push(eq(payrolls.year, filters.year));
    }

    if (filters?.employeeId) {
      conditions.push(eq(payrolls.employeeId, filters.employeeId));
    }

    if (conditions.length === 0) {
      return db.select().from(payrolls);
    }

    return db
      .select()
      .from(payrolls)
      .where(and(...conditions));
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

  static async getSummary(month: number, year: number) {
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

  static async update(id: string, payload: UpdatePayrollDto) {
    const [existing] = await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, id));

    if (!existing) {
      throw new Error("Payroll not found");
    }

    const updateData: any = {};

    const employeeId = payload.employeeId ?? existing.employeeId;
    updateData.employeeId = employeeId;

    if (payload.month !== undefined) {
      updateData.month = payload.month;
    }

    if (payload.year !== undefined) {
      updateData.year = payload.year;
    }

    if (payload.totalDeductions !== undefined) {
      const [salaryStructure] = await db
        .select()
        .from(salaryStructures)
        .where(eq(salaryStructures.employeeId, employeeId));

      if (!salaryStructure) {
        throw new Error("Salary structure not found for employee");
      }

      const basicSalary = Number(salaryStructure.basicSalary);
      const deductions = Number(payload.totalDeductions);

      if (deductions > basicSalary) {
        throw new Error("Deductions cannot be greater than salary");
      }

      const netSalary = basicSalary - deductions;

      updateData.totalDeductions = deductions.toString();
      updateData.netSalary = netSalary.toString();
    }

    if (payload.file !== undefined) {
      updateData.file = payload.file;
    }

    const [updated] = await db
      .update(payrolls)
      .set(updateData)
      .where(eq(payrolls.id, id))
      .returning();

    return updated;
  }

  static async delete(id: string) {
    const [existing] = await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.id, id));

    if (!existing) {
      throw new Error("Payroll not found");
    }

    const [deleted] = await db
      .delete(payrolls)
      .where(eq(payrolls.id, id))
      .returning();

    return deleted;
  }
}
