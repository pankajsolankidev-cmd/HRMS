import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { departments } from "../../db/schema/department.schema";
import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "@shared/types/src/Department/department.dto";

export async function createDepartmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateDepartmentDto;

  await db.insert(departments).values(body);

  return sendMessage(reply, "Department created successfully", 201);
}

export async function getDepartmentsHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  const conditions = [];

  if (query?.search) {
    conditions.push(ilike(departments.name, `%${query.search}%`));
  }

  const { page, limit, offset } = getPagination(query);

  const orderByClauses = [];

  if (!query?.sortBy) {
    orderByClauses.push(desc(departments.updatedAt));
  } else {
    orderByClauses.push(
      query.sortOrder === "asc"
        ? asc(departments[query.sortBy])
        : desc(departments[query.sortBy]),
    );
  }

  let queryBuilder = db
    .select()
    .from(departments)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderByClauses)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(departments)
    .where(conditions.length ? and(...conditions) : undefined);

  return {
    data,
    meta: {
      page,
      limit: limit ?? null,
      total: Number(count),
    },
  };
}

export async function getDepartmentByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [department] = await db
    .select()
    .from(departments)
    .where(eq(departments.id, id));

  if (!department) {
    return reply.status(404).send({ message: "Department not found" });
  }

  return department;
}
export async function updateDepartmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateDepartmentDto;

  const [updated] = await db
    .update(departments)
    .set({
      ...body,
    })
    .where(eq(departments.id, id))
    .returning();

  if (!updated) {
    return reply.status(404).send({ message: "Department not found" });
  }

  return sendMessage(reply, "Department updated successfully");
}
export async function deleteDepartmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  await db.delete(departments).where(eq(departments.id, id));

  return sendMessage(reply, "Department deleted successfully");
}
