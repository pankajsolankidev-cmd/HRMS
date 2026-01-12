import { eq, inArray, ilike, asc, desc, and } from "drizzle-orm";
import { db } from "../../db";
import { systems } from "../../db/schema/systems.schema";
import { systemComponents } from "../../db/schema/system-components.schema";
import { components } from "../../db/schema/components.schema";
import { getPagination } from "../../utils/pagination";

import type {
  CreateSystemDto,
  UpdateSystemDto,
} from "@shared/types/src/system/system.dto";

export async function createSystem(data: CreateSystemDto) {
  return await db.transaction(async (tx) => {
    const [system] = await tx
      .insert(systems)
      .values({
        name: data.name,
        description: data.description,
      })
      .returning();

    if (data.componentIds?.length) {
      const mappings = data.componentIds.map((componentId) => ({
        systemId: system.id,
        componentId,
      }));

      await tx.insert(systemComponents).values(mappings);
    }

    return system;
  });
}

export async function getSystems(query?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}) {
  const { limit, offset, page } = getPagination(query || {});
  const sortBy = query?.sortBy ?? "createdAt";
  const sortOrder = query?.sortOrder ?? "desc";

  const conditions = [];

  if (query?.search) {
    conditions.push(ilike(systems.name, `%${query.search}%`));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy =
    sortOrder === "asc"
      ? asc(systems[sortBy])
      : desc(systems[sortBy]);

  const systemsList = await db
    .select()
    .from(systems)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  if (systemsList.length === 0) {
    return {
      data: [],
      page,
      limit,
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

  return {
    data: systemsList.map((system) => ({
      ...system,
      components: rows
        .filter((r) => r.systemId === system.id)
        .map((r) => r.component),
    })),
    page,
    limit,
  };
}

export async function getSystemById(id: string) {
  const [system] = await db.select().from(systems).where(eq(systems.id, id));
  if (!system) return null;

  const rows = await db
    .select({ component: components })
    .from(systemComponents)
    .innerJoin(components, eq(systemComponents.componentId, components.id))
    .where(eq(systemComponents.systemId, id));

  return {
    ...system,
    components: rows.map((r) => r.component),
  };
}

export async function updateSystem(id: string, data: UpdateSystemDto) {
  return await db.transaction(async (tx) => {
    const [system] = await tx
      .update(systems)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        updatedAt: new Date(),
      })
      .where(eq(systems.id, id))
      .returning();

    if (!system) return null;

    if (Array.isArray(data.componentIds)) {
      await tx
        .delete(systemComponents)
        .where(eq(systemComponents.systemId, id));

      if (data.componentIds.length > 0) {
        await tx.insert(systemComponents).values(
          data.componentIds.map((componentId) => ({
            systemId: id,
            componentId,
          }))
        );
      }
    }

    return system;
  });
}

export async function deleteSystem(id: string) {
  const [deleted] = await db
    .delete(systems)
    .where(eq(systems.id, id))
    .returning();

  return deleted;
}
