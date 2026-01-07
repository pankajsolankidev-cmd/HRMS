import { eq } from "drizzle-orm";
import { db } from "../../db";
import { salaryStructures } from "../../db/schema";
import type {
  CreateSalaryStructureDto,
  UpdateSalaryStructureDto,
} from "@shared/types/src/payroll/salary-structure.dto";

export class SalaryStructureService {
  static async create(payload: CreateSalaryStructureDto) {
    const [existing] = await db
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.employeeId, payload.employeeId));

    if (existing) {
      throw new Error("Salary structure already exists for this employee");
    }

    const [created] = await db
      .insert(salaryStructures)
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
    return db.select().from(salaryStructures);
  }

  static async getByEmployee(employeeId: string) {
    const [salaryStructure] = await db
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.employeeId, employeeId));

    if (!salaryStructure) {
      throw new Error("Salary structure not found for this employee");
    }

    return salaryStructure;
  }

  static async getById(id: string) {
    const [salaryStructure] = await db
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.id, id));

    if (!salaryStructure) {
      throw new Error("Salary structure not found");
    }

    return salaryStructure;
  }

  static async update(id: string, payload: UpdateSalaryStructureDto) {
    const [updated] = await db
      .update(salaryStructures)
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
      .where(eq(salaryStructures.id, id))
      .returning();

    if (!updated) {
      throw new Error("Salary structure not found");
    }

    return updated;
  }

  static async delete(id: string) {
    const [deleted] = await db
      .delete(salaryStructures)
      .where(eq(salaryStructures.id, id))
      .returning();

    if (!deleted) {
      throw new Error("Salary structure not found");
    }

    return deleted;
  }
}
