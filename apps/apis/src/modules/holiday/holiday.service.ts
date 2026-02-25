import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";
import {
  CreateHolidayDto,
  UpdateHolidayDto,
} from "@shared/types/src/Holiday/holiday.dto";
import { holidays } from "../../db/schema/holidays.schema";

export async function createHolidayHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateHolidayDto;

  try {
    await db.insert(holidays).values(body);
    return sendMessage(reply, "Holiday created successfully", 201);
  } catch (err) {
    request.log.error({ action: "CREATE_HOLIDAY", err });
    return reply.status(500).send({ message: "Failed to create holiday" });
  }
}

export async function getHolidaysHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "title" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  try {
    const conditions = [];

    if (query?.search) {
      conditions.push(ilike(holidays.title, `%${query.search}%`));
    }

    const { page, limit, offset } = getPagination(query);

    const orderByClauses = [];

    if (!query?.sortBy) {
      orderByClauses.push(desc(holidays.updatedAt));
    } else {
      orderByClauses.push(
        query.sortOrder === "asc"
          ? asc(holidays[query.sortBy])
          : desc(holidays[query.sortBy]),
      );
    }

    let queryBuilder = db
      .select()
      .from(holidays)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...orderByClauses)
      .$dynamic();

    if (limit !== undefined && offset !== undefined) {
      queryBuilder = queryBuilder.limit(limit).offset(offset);
    }

    const data = await queryBuilder;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(holidays)
      .where(conditions.length ? and(...conditions) : undefined);

    return {
      data,
      meta: {
        page,
        limit: limit ?? null,
        total: Number(count),
      },
    };
  } catch (err) {
    request.log.error({ action: "GET_HOLIDAYS", err });
    return {
      data: [],
      meta: { page: 1, limit: null, total: 0 },
    };
  }
}

export async function getHolidayByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  try {
    const [holiday] = await db
      .select()
      .from(holidays)
      .where(eq(holidays.id, id));

    if (!holiday) {
      return reply.status(404).send({ message: "Holiday not found" });
    }

    return holiday;
  } catch (err) {
    request.log.error({ action: "GET_HOLIDAY_BY_ID", err });
    return reply.status(500).send({ message: "Failed to fetch holiday" });
  }
}

export async function updateHolidayHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateHolidayDto;

  try {
    const [updated] = await db
      .update(holidays)
      .set({ ...body })
      .where(eq(holidays.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ message: "Holiday not found" });
    }

    return sendMessage(reply, "Holiday updated successfully");
  } catch (err) {
    request.log.error({ action: "UPDATE_HOLIDAY", err });
    return reply.status(500).send({ message: "Failed to update holiday" });
  }
}

export async function deleteHolidayHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  try {
    const deleted = await db
      .delete(holidays)
      .where(eq(holidays.id, id))
      .returning({ id: holidays.id });

    if (!deleted.length) {
      return reply.status(404).send({ message: "Holiday not found" });
    }

    return sendMessage(reply, "Holiday deleted successfully");
  } catch (err) {
    request.log.error({ action: "DELETE_HOLIDAY", err });
    return reply.status(500).send({ message: "Failed to delete holiday" });
  }
}
