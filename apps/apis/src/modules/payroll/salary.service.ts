import { and, eq, ilike, gte, lte, asc, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { salary } from "../../db/schema";
import { getPagination } from "../../utils/pagination";

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

  static async getAll(query?: {
    search?: string;
    employeeId?: string;
    minSalary?: number;
    maxSalary?: number;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "basicSalary";
    sortOrder?: "asc" | "desc";
  }) {
    const conditions = [];

    if (query?.search) {
      conditions.push(ilike(salary.description, `%${query.search}%`));
    }

    if (query?.employeeId) {
      conditions.push(eq(salary.employeeId, query.employeeId));
    }

    if (query?.minSalary !== undefined) {
      conditions.push(gte(salary.basicSalary, query.minSalary.toString()));
    }

    if (query?.maxSalary !== undefined) {
      conditions.push(lte(salary.basicSalary, query.maxSalary.toString()));
    }

    const { limit, offset, page } = getPagination(query ?? {});

    const sortColumn =
      query?.sortBy === "basicSalary" ? salary.basicSalary : salary.createdAt;

    const order =
      query?.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(salary)
      .where(whereClause)
      .orderBy(order)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(salary)
      .where(whereClause);

    return {
      data,
      meta: {
        page,
        limit,
        total: Number(count),
      },
    };
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
