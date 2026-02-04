import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, gte, lte, asc, desc, sql } from "drizzle-orm";

import { db } from "../../db";
import { salary } from "../../db/schema";
import { getPagination } from "../../utils/pagination";

import type {
  CreateSalaryDto,
  UpdateSalaryDto,
} from "@shared/types/src/payroll/salary.dto";

import { sendMessage } from "../../utils/api-response";

export async function createSalaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const payload = request.body as CreateSalaryDto;

  const [existing] = await db
    .select()
    .from(salary)
    .where(eq(salary.employeeId, payload.employeeId));

  if (existing) {
    return reply
      .code(409)
      .send({ message: "Salary structure already exists for this employee" });
  }

  await db.insert(salary).values({
    employeeId: payload.employeeId,
    basicSalary: payload.basicSalary.toString(),
    description: payload.description,
    appraisalDate: payload.appraisalDate
      ? new Date(payload.appraisalDate)
      : undefined,
  });

  return sendMessage(reply, "Salary structure created successfully", 201);
}

export async function getSalariesHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    employeeId?: string;
    minSalary?: number;
    maxSalary?: number;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "basicSalary";
    sortOrder?: "asc" | "desc";
  };

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

  const { page, limit, offset } = getPagination(query ?? {});

  const sortColumn =
    query?.sortBy === "basicSalary" ? salary.basicSalary : salary.createdAt;

  const order = query?.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const whereClause = conditions.length ? and(...conditions) : undefined;

  let queryBuilder = db
    .select()
    .from(salary)
    .where(whereClause)
    .orderBy(order)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salary)
    .where(whereClause);

  return {
    data,
    meta: {
      page,
      limit: limit ?? null,
      total: Number(count),
    },
  };
}

export async function getSalaryByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [salaryStructure] = await db
    .select()
    .from(salary)
    .where(eq(salary.id, id));

  if (!salaryStructure) {
    return reply.code(404).send({ message: "Salary structure not found" });
  }

  return salaryStructure;
}

export async function getSalaryByEmployeeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { employeeId } = request.params as { employeeId: string };

  const [salaryStructure] = await db
    .select()
    .from(salary)
    .where(eq(salary.employeeId, employeeId));

  if (!salaryStructure) {
    return reply
      .code(404)
      .send({ message: "Salary structure not found for this employee" });
  }

  return salaryStructure;
}

export async function updateSalaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const payload = request.body as UpdateSalaryDto;

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
    return reply.code(404).send({ message: "Salary structure not found" });
  }

  return sendMessage(reply, "Salary structure updated successfully");
}

export async function deleteSalaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [deleted] = await db
    .delete(salary)
    .where(eq(salary.id, id))
    .returning();

  if (!deleted) {
    return reply.code(404).send({ message: "Salary structure not found" });
  }

  return sendMessage(reply, "Salary structure deleted successfully");
}
