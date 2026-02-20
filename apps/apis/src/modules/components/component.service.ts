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
  request.log.info("Request received");

  request.log.info({ name: body.name }, "Create component request received");

  try {
    await db.insert(components).values(body);

    request.log.info({ name: body.name }, "Component created successfully");

    return sendMessage(reply, "Component created successfully", 201);
  } catch (err) {
    request.log.error({ err, body }, "Failed to create component");
    throw err;
  }
}

export async function getComponentsHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  request.log.info(
    {
      action: "GET_COMPONENTS",
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    "Get components request received",
  );

  try {
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

    return {
      data,
      meta: {
        page,
        limit: limit ?? null,
        total: Number(count),
      },
    };
  } catch (err) {
    request.log.error(
      {
        action: "GET_COMPONENTS",
        err,
        query,
      },
      "Failed to fetch components",
    );
    throw err;
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

      return reply.status(404).send({ message: "Component not found" });
    }

    request.log.info(
      {
        action: "GET_COMPONENT_BY_ID",
        componentId: id,
      },
      "Component fetched successfully",
    );

    return component;
  } catch (err) {
    request.log.error(
      {
        action: "GET_COMPONENT_BY_ID",
        componentId: id,
        err,
      },
      "Failed to fetch component",
    );
    throw err;
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
    const [updated] = await db
      .update(components)
      .set({ ...body })
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

      return reply.status(404).send({ message: "Component not found" });
    }

    request.log.info(
      {
        action: "UPDATE_COMPONENT",
        componentId: id,
      },
      "Component updated successfully",
    );

    return sendMessage(reply, "Component updated successfully");
  } catch (err) {
    request.log.error(
      {
        action: "UPDATE_COMPONENT",
        componentId: id,
        err,
      },
      "Failed to update component",
    );
    throw err;
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

      return reply.status(404).send({ message: "Component not found" });
    }

    request.log.info(
      {
        action: "DELETE_COMPONENT",
        componentId: id,
      },
      "Component deleted successfully",
    );

    return sendMessage(reply, "Component deleted successfully");
  } catch (err) {
    request.log.error(
      {
        action: "DELETE_COMPONENT",
        componentId: id,
        err,
      },
      "Failed to delete component",
    );
    throw err;
  }
}
