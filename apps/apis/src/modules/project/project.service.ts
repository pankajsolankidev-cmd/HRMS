import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, desc, sql, asc } from "drizzle-orm";

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

  request.log.info(
    {
      action: "CREATE_PROJECT",
      projectName: body.name,
    },
    "Create project request received",
  );

  const startDate = new Date(body.startDate);
  const expectedEndDate = body.expectedEndDate
    ? new Date(body.expectedEndDate)
    : null;

  if (isNaN(startDate.getTime())) {
    request.log.warn(
      {
        action: "CREATE_PROJECT",
        projectName: body.name,
      },
      "Invalid startDate provided",
    );

    return reply.status(400).send({
      message: "Invalid startDate",
    });
  }

  if (
    expectedEndDate &&
    (isNaN(expectedEndDate.getTime()) || expectedEndDate < startDate)
  ) {
    request.log.warn(
      {
        action: "CREATE_PROJECT",
        projectName: body.name,
      },
      "Invalid expectedEndDate provided",
    );

    return reply.status(400).send({
      message: "expectedEndDate must be after than or equal to startDate",
    });
  }

  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.name, body.name));

  if (existing) {
    request.log.warn(
      {
        action: "CREATE_PROJECT",
        projectName: body.name,
      },
      "Project with same name already exists",
    );

    return reply.status(409).send({
      message: "Project with this name already exists",
    });
  }

  await db.insert(projects).values(body);

  request.log.info(
    {
      action: "CREATE_PROJECT",
      projectName: body.name,
    },
    "Project created successfully",
  );

  return sendMessage(reply, "Project created successfully", 201);
}

export async function getProjectsHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    status?: "ACTIVE" | "COMPLETED";
    page?: number;
    limit?: number;
    sortBy?: "name" | "startDate" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  const conditions = [];

  request.log.info(
    {
      action: "GET_PROJECTS",
      search: query.search,
      status: query.status,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    "Get projects request received",
  );

  if (query.search) {
    conditions.push(ilike(projects.name, `%${query.search}%`));
  }

  if (query.status) {
    conditions.push(eq(projects.status, query.status));
  }

  const { page, limit, offset } = getPagination(query);

  const orderByClauses = [];

  if (!query.sortBy) {
    orderByClauses.push(desc(projects.updatedAt));
  } else {
    orderByClauses.push(
      query.sortOrder === "asc"
        ? asc(projects[query.sortBy])
        : desc(projects[query.sortBy]),
    );
  }

  let queryBuilder = db
    .select()
    .from(projects)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderByClauses)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(conditions.length ? and(...conditions) : undefined);

  request.log.info(
    {
      action: "GET_PROJECTS",
      resultCount: data.length,
      total: Number(count),
      page,
      limit,
    },
    "Projects fetched successfully",
  );

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

  request.log.info(
    {
      action: "UPDATE_PROJECT",
      projectId: id,
      fields: Object.keys(body),
    },
    "Update project request received",
  );

  if (body.startDate || body.expectedEndDate) {
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const expectedEndDate = body.expectedEndDate
      ? new Date(body.expectedEndDate)
      : null;

    if (startDate && isNaN(startDate.getTime())) {
      request.log.warn(
        {
          action: "UPDATE_PROJECT",
          projectId: id,
        },
        "Invalid startDate provided",
      );

      return reply.status(400).send({
        message: "Invalid startDate",
      });
    }

    if (
      expectedEndDate &&
      (isNaN(expectedEndDate.getTime()) ||
        (startDate && expectedEndDate < startDate))
    ) {
      request.log.warn(
        {
          action: "UPDATE_PROJECT",
          projectId: id,
        },
        "Invalid expectedEndDate provided",
      );

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
      request.log.warn(
        {
          action: "UPDATE_PROJECT",
          projectId: id,
          projectName: body.name,
        },
        "Project with same name already exists",
      );

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
    request.log.warn(
      {
        action: "UPDATE_PROJECT",
        projectId: id,
      },
      "Project not found for update",
    );

    return reply.status(404).send({ message: "Project not found" });
  }

  request.log.info(
    {
      action: "UPDATE_PROJECT",
      projectId: id,
    },
    "Project updated successfully",
  );

  return sendMessage(reply, "Project updated successfully");
}

export async function getProjectByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "GET_PROJECT_BY_ID",
      projectId: id,
    },
    "Get project by id request received",
  );

  const [project] = await db.select().from(projects).where(eq(projects.id, id));

  if (!project) {
    request.log.warn(
      {
        action: "GET_PROJECT_BY_ID",
        projectId: id,
      },
      "Project not found",
    );

    return reply.status(404).send({ message: "Project not found" });
  }

  request.log.info(
    {
      action: "GET_PROJECT_BY_ID",
      projectId: id,
    },
    "Project fetched successfully",
  );

  return project;
}
