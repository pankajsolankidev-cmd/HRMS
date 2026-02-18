import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, desc, sql } from "drizzle-orm";

import { db } from "../../db";
import { projects } from "../../db/schema/projects.schema";
import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";
import {
  CreateProjectDto,
  UpdateProjectDto,
} from "@shared/types/src/project/project.dto";

export async function createProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateProjectDto;

  const startDate = new Date(body.startDate);
  const expectedEndDate = body.expectedEndDate
    ? new Date(body.expectedEndDate)
    : null;

  if (isNaN(startDate.getTime())) {
    return reply.status(400).send({
      message: "Invalid startDate",
    });
  }

  if (
    expectedEndDate &&
    (isNaN(expectedEndDate.getTime()) || expectedEndDate < startDate)
  ) {
    return reply.status(400).send({
      message: "expectedEndDate must be after than or equal to startDate",
    });
  }

  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, body.name));

  if (existing) {
    return reply.status(409).send({
      message: "Project with this name already exists",
    });
  }

  await db.insert(projects).values(body);

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
  const body = request.body as UpdateProjectDto;

  if (body.startDate || body.expectedEndDate) {
    const startDate = body.startDate ? new Date(body.startDate) : null;

    const expectedEndDate = body.expectedEndDate
      ? new Date(body.expectedEndDate)
      : null;

    if (startDate && isNaN(startDate.getTime())) {
      return reply.status(400).send({
        message: "Invalid startDate",
      });
    }

    if (
      expectedEndDate &&
      (isNaN(expectedEndDate.getTime()) ||
        (startDate && expectedEndDate < startDate))
    ) {
      return reply.status(400).send({
        message: "expectedEndDate must be after than or equal to startDate",
      });
    }
  }

  if (body.name) {
    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.name, body.name));

    if (existing && existing.id !== id) {
      return reply.status(409).send({
        message: "Project with this name already exists",
      });
    }
  }

  const [updated] = await db
    .update(projects)
    .set(body)
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
