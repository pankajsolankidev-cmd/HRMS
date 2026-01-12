import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { components } from "../../db/schema/components.schema";

import type { CreateComponentDto } from "@shared/types/src/components/create-component.dto";
import type { UpdateComponentDto } from "@shared/types/src/components/update-component.dto";

export async function createComponent(data: CreateComponentDto) {
  const [component] = await db.insert(components).values(data).returning();
  return component;
}

export async function getComponents(query?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const conditions = [];

  if (query?.search) {
    conditions.push(ilike(components.name, `%${query.search}%`));
  }

  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(100, Number(query?.limit) || 10);
  const offset = (page - 1) * limit;

  const sortColumn =
    query?.sortBy === "createdAt" ? components.createdAt : components.name;

  const order = query?.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const data = await db
    .select()
    .from(components)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(components)
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

export async function getComponentById(id: string) {
  const [component] = await db
    .select()
    .from(components)
    .where(eq(components.id, id));

  return component;
}

export async function updateComponent(id: string, data: UpdateComponentDto) {
  const [updated] = await db
    .update(components)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(components.id, id))
    .returning();

  return updated;
}

export async function deleteComponent(id: string) {
  const [deleted] = await db
    .delete(components)
    .where(eq(components.id, id))
    .returning();

  return deleted;
}
