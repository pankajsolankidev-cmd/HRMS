import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, desc, sql } from "drizzle-orm";

import { db } from "../../db";
import { projects } from "../../db/schema/projects.schema";
import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";

export async function createProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await db.insert(projects).values(request.body as any);
  return sendMessage(reply, "Project created successfully", 201);
}

export async function getProjectsHandler(request: FastifyRequest) {
  const query = request.query as any;
  const conditions = [];

  if (query.search) {
    conditions.push(ilike(projects.name, `%${query.search}%`));
  }

  if (query.status) {
    conditions.push(eq(projects.status, query.status));
  }

  const { page, limit, offset } = getPagination(query);

  let queryBuilder = db
    .select()
    .from(projects)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(projects.updatedAt))
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(conditions.length ? and(...conditions) : undefined);

  return {
    data,
    meta: {
      page,
      limit,
      total: Number(count),
    },
  };
}

export async function updateProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [updated] = await db
    .update(projects)
    .set(request.body as any)
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return reply.status(404).send({ message: "Project not found" });
  }

  return sendMessage(reply, "Project updated successfully");
}

export async function getProjectByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const [project] = await db.select().from(projects).where(eq(projects.id, id));

  if (!project) {
    return reply.status(404).send({ message: "Project not found" });
  }

  return project;
}
