import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";

import { db } from "../../db";
import { components } from "../../db/schema/components.schema";

import type { CreateComponentDto } from "@shared/types/src/components/create-component.dto";
import type { UpdateComponentDto } from "@shared/types/src/components/update-component.dto";

import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";

export async function createComponentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateComponentDto;

  await db.insert(components).values(body);

  return sendMessage(reply, "Component created successfully", 201);
}

export async function getComponentsHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  const conditions = [];

  if (query?.search) {
    conditions.push(ilike(components.name, `%${query.search}%`));
  }

  const { page, limit, offset } = getPagination(query);

  const orderByClauses = [];

  if (!query?.sortBy) {
    orderByClauses.push(desc(components.updatedAt));
  } else {
    orderByClauses.push(
      query.sortOrder === "asc"
        ? asc(components[query.sortBy])
        : desc(components[query.sortBy]),
    );
  }

  let queryBuilder = db
    .select()
    .from(components)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderByClauses)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(components)
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



export async function getComponentByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [component] = await db
    .select()
    .from(components)
    .where(eq(components.id, id));

  if (!component) {
    return reply.status(404).send({ message: "Component not found" });
  }

  return component;
}

export async function updateComponentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateComponentDto;

  const [updated] = await db
    .update(components)
    .set({
      ...body,
    })
    .where(eq(components.id, id))
    .returning();

  if (!updated) {
    return reply.status(404).send({ message: "Component not found" });
  }

  return sendMessage(reply, "Component updated successfully");
}

export async function deleteComponentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  await db.delete(components).where(eq(components.id, id));

  return sendMessage(reply, "Component deleted successfully");
}