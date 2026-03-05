import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, inArray, ilike, asc, desc, and, sql } from "drizzle-orm";

import { db } from "../../db";
import { systems } from "../../db/schema/systems.schema";
import { systemComponents } from "../../db/schema/system-components.schema";
import { components } from "../../db/schema/components.schema";
import { getPagination } from "../../utils/pagination";
import { sendMessage } from "../../utils/api-response";

import type {
  CreateSystemDto,
  UpdateSystemDto,
} from "@shared/types/src/system/system.dto";

export async function createSystemHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateSystemDto;

  request.log.info(
    {
      action: "CREATE_SYSTEM",
      name: body.name,
      componentCount: body.componentIds?.length ?? 0,
    },
    "Create system request received",
  );

  try {
    await db.transaction(async (tx) => {
      const [system] = await tx
        .insert(systems)
        .values({
          name: body.name.trim(),
          description: body.description?.trim() ?? null,
        })
        .returning();

      if (body.componentIds?.length) {
        await tx.insert(systemComponents).values(
          body.componentIds.map((componentId) => ({
            systemId: system.id,
            componentId,
          })),
        );
      }

      request.log.info(
        {
          action: "CREATE_SYSTEM",
          systemId: system.id,
        },
        "System created successfully",
      );
    });

    return sendMessage(reply, "System created successfully", 201);
  } catch (err: any) {
    request.log.error(
      {
        action: "CREATE_SYSTEM",
        err,
      },
      "Failed to create system",
    );

    const errorCode = err?.code || err?.cause?.code;

    if (errorCode === "23505") {
      return reply.code(409).send({
        message: "Component already assigned to this system",
      });
    }

    return reply.code(400).send({
      message: "Unable to create system",
    });
  }
}

export async function getSystemsHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "name";
    sortOrder?: "asc" | "desc";
  };

  request.log.info(
    {
      action: "GET_SYSTEMS",
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    "Get systems request received",
  );

  const { limit, offset, page } = getPagination(query ?? {});

  const conditions = [];

  if (query?.search) {
    conditions.push(ilike(systems.name, `%${query.search}%`));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orderByClauses = [];

  if (!query?.sortBy) {
    orderByClauses.push(desc(systems.updatedAt));
  } else {
    orderByClauses.push(
      query.sortOrder === "asc"
        ? asc(systems[query.sortBy])
        : desc(systems[query.sortBy]),
    );
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(systems)
    .where(whereClause);

  let systemsQuery = db
    .select()
    .from(systems)
    .where(whereClause)
    .orderBy(...orderByClauses)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    systemsQuery = systemsQuery.limit(limit).offset(offset);
  }

  const systemsList = await systemsQuery;

  if (!systemsList.length) {
    request.log.info(
      {
        action: "GET_SYSTEMS",
        resultCount: 0,
        total: Number(count),
      },
      "No systems found",
    );

    return {
      data: [],
      meta: {
        page,
        limit: limit ?? null,
        total: Number(count),
      },
    };
  }

  const systemIds = systemsList.map((s) => s.id);

  const rows = await db
    .select({
      systemId: systemComponents.systemId,
      component: components,
    })
    .from(systemComponents)
    .innerJoin(components, eq(systemComponents.componentId, components.id))
    .where(inArray(systemComponents.systemId, systemIds));

  request.log.info(
    {
      action: "GET_SYSTEMS",
      resultCount: systemsList.length,
      total: Number(count),
    },
    "Systems fetched successfully",
  );

  return {
    data: systemsList.map((system) => ({
      ...system,
      components: rows
        .filter((r) => r.systemId === system.id)
        .map((r) => r.component),
    })),
    meta: {
      page,
      limit: limit ?? null,
      total: Number(count),
    },
  };
}

export async function getSystemByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "GET_SYSTEM_BY_ID",
      systemId: id,
    },
    "Get system by id request received",
  );

  const [system] = await db.select().from(systems).where(eq(systems.id, id));

  if (!system) {
    request.log.warn(
      {
        action: "GET_SYSTEM_BY_ID",
        systemId: id,
      },
      "System not found",
    );

    return reply.code(404).send({ message: "System not found" });
  }

  const rows = await db
    .select({ component: components })
    .from(systemComponents)
    .innerJoin(components, eq(systemComponents.componentId, components.id))
    .where(eq(systemComponents.systemId, id));

  request.log.info(
    {
      action: "GET_SYSTEM_BY_ID",
      systemId: id,
      componentCount: rows.length,
    },
    "System fetched successfully",
  );

  return {
    ...system,
    components: rows.map((r) => r.component),
  };
}

export async function updateSystemHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateSystemDto;

  request.log.info(
    {
      action: "UPDATE_SYSTEM",
      systemId: id,
      fields: Object.keys(body),
      componentCount: Array.isArray(body.componentIds)
        ? body.componentIds.length
        : undefined,
    },
    "Update system request received",
  );

  try {
    const updated = await db.transaction(async (tx) => {
      const [system] = await tx
        .update(systems)
        .set({
          ...(body.name !== undefined && { name: body.name.trim() }),
          ...(body.description !== undefined && {
            description: body.description?.trim() ?? null,
          }),
          updatedAt: new Date(),
        })
        .where(eq(systems.id, id))
        .returning();

      if (!system) return null;

      if (Array.isArray(body.componentIds)) {
        const componentIds = [...new Set(body.componentIds)];

        await tx
          .delete(systemComponents)
          .where(eq(systemComponents.systemId, id));

        if (componentIds.length) {
          await tx.insert(systemComponents).values(
            componentIds.map((componentId) => ({
              systemId: id,
              componentId,
            })),
          );
        }
      }

      return system;
    });

    if (!updated) {
      request.log.warn(
        {
          action: "UPDATE_SYSTEM",
          systemId: id,
        },
        "System not found for update",
      );

      return reply.code(404).send({
        message: "System not found",
      });
    }

    request.log.info(
      {
        action: "UPDATE_SYSTEM",
        systemId: id,
      },
      "System updated successfully",
    );

    return sendMessage(reply, "System updated successfully");
  } catch (err: any) {
    request.log.error(
      {
        action: "UPDATE_SYSTEM",
        systemId: id,
        err,
      },
      "Failed to update system",
    );

    const errorCode = err?.code || err?.cause?.code;

    if (errorCode === "23505") {
      return reply.code(409).send({
        message: "Component already assigned to this system",
      });
    }

    return reply.code(400).send({
      message: "Unable to update system",
    });
  }
}

export async function deleteSystemHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "DELETE_SYSTEM",
      systemId: id,
    },
    "Delete system request received",
  );

  const [deleted] = await db
    .delete(systems)
    .where(eq(systems.id, id))
    .returning({ id: systems.id });

  if (!deleted) {
    request.log.warn(
      {
        action: "DELETE_SYSTEM",
        systemId: id,
      },
      "System not found for delete",
    );

    return reply.code(404).send({ message: "System not found" });
  }

  request.log.info(
    {
      action: "DELETE_SYSTEM",
      systemId: id,
    },
    "System deleted successfully",
  );

  return sendMessage(reply, "System deleted successfully");
}
