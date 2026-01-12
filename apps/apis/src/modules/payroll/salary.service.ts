import { eq } from "drizzle-orm";
import { db } from "../../db";
import { salary } from "../../db/schema";
import type {
  CreateSalaryDto,
  UpdateSalaryDto,
} from "@shared/types/src/payroll/salary.dto";

export class SalaryService {
  static async create(payload: CreateSalaryDto) {
    const [existing] = await db
      .select()
      .from(salary)
      .where(eq(salary.employeeId, payload.employeeId));

    if (existing) {
      throw new Error("Salary structure already exists for this employee");
    }

    const [created] = await db
      .insert(salary)
      .values({
        employeeId: payload.employeeId,
        basicSalary: payload.basicSalary.toString(),
        description: payload.description,
        appraisalDate: payload.appraisalDate
          ? new Date(payload.appraisalDate)
          : undefined,
      })
      .returning();

    return created;
  }

  static async getAll() {
    return db.select().from(salary);
  }

  static async getByEmployee(employeeId: string) {
    const [salaryStructure] = await db
      .select()
      .from(salary)
      .where(eq(salary.employeeId, employeeId));

    if (!salaryStructure) {
      throw new Error("Salary structure not found for this employee");
    }

    return salaryStructure;
  }

  static async getById(id: string) {
    const [salaryStructure] = await db
      .select()
      .from(salary)
      .where(eq(salary.id, id));

    if (!salaryStructure) {
      throw new Error("Salary structure not found");
    }

    return salaryStructure;
  }

  static async update(id: string, payload: UpdateSalaryDto) {
    const [updated] = await db
      .update(salary)
      .set({
        basicSalary:
          payload.basicSalary !== undefined
            ? payload.basicSalary.toString()
            : undefined,

        description: payload.description,

        appraisalDate: payload.appraisalDate
          ? new Date(payload.appraisalDate)
          : undefined,

        updatedAt: new Date(),
      })
      .where(eq(salary.id, id))
      .returning();

    if (!updated) {
      throw new Error("Salary structure not found");
    }

    return updated;
  }

  static async delete(id: string) {
    const [deleted] = await db
      .delete(salary)
      .where(eq(salary.id, id))
      .returning();

    if (!deleted) {
      throw new Error("Salary structure not found");
    }

    return deleted;
  }
}
