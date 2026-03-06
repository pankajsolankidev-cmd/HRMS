import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql, isNull } from "drizzle-orm";

import { db } from "../../db";
import { components } from "../../db/schema/components.schema";

import type { CreateComponentDto } from "@shared/types/src/components/create-component.dto";
import type { UpdateComponentDto } from "@shared/types/src/components/update-component.dto";

import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";
import { systemComponents } from "../../db/schema";

export async function createComponentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateComponentDto;

  try {
    const data = {
      name: body.name.trim(),
      description: body.description?.trim(),
      code: body.code.trim().toUpperCase(),
    };

    await db.insert(components).values(data);

    return sendMessage(reply, "Component created successfully", 201);
  } catch (err: any) {
    request.log.error({ err }, "Create component failed");

    const errorCode = err.code || err?.cause?.code;

    if (errorCode === "23505") {
      return reply.status(409).send({
        message: "Component code already exists",
      });
    }

    return reply.status(400).send({
      message: err.message || "Unable to create component",
    });
  }
}

export async function getComponentsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "createdAt";
    sortOrder?: "asc" | "desc";
    excludeAssigned?: boolean;
  };

  request.log.info(
    {
      action: "GET_COMPONENTS",
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      excludeAssigned: query.excludeAssigned,
    },
    "Get components request received",
  );

  try {
    const conditions = [];

    if (query?.search) {
      conditions.push(ilike(components.name, `%${query.search.trim()}%`));
    }

    if (query?.excludeAssigned) {
      conditions.push(isNull(systemComponents.componentId));
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
      .selectDistinct({
        id: components.id,
        name: components.name,
        code: components.code,
        description: components.description,
        createdAt: components.createdAt,
        updatedAt: components.updatedAt,
      })
      .from(components)
      .leftJoin(
        systemComponents,
        eq(systemComponents.componentId, components.id),
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...orderByClauses)
      .$dynamic();

    if (limit !== undefined && offset !== undefined) {
      queryBuilder = queryBuilder.limit(limit).offset(offset);
    }

    const data = await queryBuilder;

    const [{ count }] = await db
      .select({ count: sql<number>`count(distinct ${components.id})` })
      .from(components)
      .leftJoin(
        systemComponents,
        eq(systemComponents.componentId, components.id),
      )
      .where(conditions.length ? and(...conditions) : undefined);

    request.log.info(
      {
        action: "GET_COMPONENTS",
        resultCount: data.length,
        total: Number(count),
        page,
        limit,
      },
      "Components fetched successfully",
    );

    return reply.send({
      data,
      meta: {
        page,
        limit: limit ?? null,
        total: Number(count),
      },
    });
  } catch (err: any) {
    request.log.error(
      {
        action: "GET_COMPONENTS",
        err,
        query,
      },
      "Failed to fetch components",
    );

    return reply.status(400).send({
      message: err?.message || "Unable to fetch components",
    });
  }
}
export async function getComponentByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "GET_COMPONENT_BY_ID",
      componentId: id,
    },
    "Get component by id request received",
  );

  try {
    const [component] = await db
      .select()
      .from(components)
      .where(eq(components.id, id));

    if (!component) {
      request.log.warn(
        {
          action: "GET_COMPONENT_BY_ID",
          componentId: id,
        },
        "Component not found",
      );

      return reply.status(404).send({
        message: "Component not found",
      });
    }

    request.log.info(
      {
        action: "GET_COMPONENT_BY_ID",
        componentId: id,
      },
      "Component fetched successfully",
    );

    return reply.send(component);
  } catch (err: any) {
    request.log.error(
      {
        action: "GET_COMPONENT_BY_ID",
        componentId: id,
        err,
      },
      "Failed to fetch component",
    );

    return reply.status(400).send({
      message: err?.message || "Unable to fetch component",
    });
  }
}
export async function updateComponentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateComponentDto;

  request.log.info(
    {
      action: "UPDATE_COMPONENT",
      componentId: id,
      fields: Object.keys(body),
    },
    "Update component request received",
  );

  try {
    const data: Partial<UpdateComponentDto> = {
      ...body,
    };

    if (data.name) data.name = data.name.trim();
    if (data.description) data.description = data.description.trim();
    if (data.code) data.code = data.code.trim().toUpperCase();

    const [updated] = await db
      .update(components)
      .set(data)
      .where(eq(components.id, id))
      .returning();

    if (!updated) {
      request.log.warn(
        {
          action: "UPDATE_COMPONENT",
          componentId: id,
        },
        "Component not found for update",
      );

      return reply.status(404).send({
        message: "Component not found",
      });
    }

    request.log.info(
      {
        action: "UPDATE_COMPONENT",
        componentId: id,
      },
      "Component updated successfully",
    );

    return sendMessage(reply, "Component updated successfully");
  } catch (err: any) {
    request.log.error(
      {
        action: "UPDATE_COMPONENT",
        componentId: id,
        err,
      },
      "Failed to update component",
    );

    const errorCode = err?.code || err?.cause?.code;

    if (errorCode === "23505") {
      return reply.status(409).send({
        message: "Component code already exists",
      });
    }

    return reply.status(400).send({
      message: err?.message || "Unable to update component",
    });
  }
}

export async function deleteComponentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "DELETE_COMPONENT",
      componentId: id,
    },
    "Delete component request received",
  );

  try {
    const [assigned] = await db
      .select({ id: systemComponents.componentId })
      .from(systemComponents)
      .where(eq(systemComponents.componentId, id))
      .limit(1);

    if (assigned) {
      request.log.warn(
        {
          action: "DELETE_COMPONENT",
          componentId: id,
        },
        "Component cannot be deleted because it is assigned to a system",
      );

      return reply.status(409).send({
        message: "Component is assigned to a system and cannot be deleted",
      });
    }

    const deleted = await db
      .delete(components)
      .where(eq(components.id, id))
      .returning({ id: components.id });

    if (!deleted.length) {
      request.log.warn(
        {
          action: "DELETE_COMPONENT",
          componentId: id,
        },
        "Component not found for delete",
      );

      return reply.status(404).send({
        message: "Component not found",
      });
    }

    request.log.info(
      {
        action: "DELETE_COMPONENT",
        componentId: id,
      },
      "Component deleted successfully",
    );

    return sendMessage(reply, "Component deleted successfully");
  } catch (err: any) {
    request.log.error(
      {
        action: "DELETE_COMPONENT",
        componentId: id,
        err,
      },
      "Failed to delete component",
    );

    return reply.status(400).send({
      message: err?.message || "Unable to delete component",
    });
  }
}
