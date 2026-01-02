import { eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { systems } from "../../db/schema/systems.schema";
import { systemComponents } from "../../db/schema/system-components.schema";
import { components } from "../../db/schema/components.schema";
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

    if (data.componentIds && data.componentIds.length > 0) {
      const mappings = data.componentIds.map((componentId) => ({
        systemId: system.id,
        componentId,
      }));

      await tx.insert(systemComponents).values(mappings);
    }

    return system;
  });
}

export async function getSystems() {
  const systemsList = await db.select().from(systems);

  if (systemsList.length === 0) return [];

  const systemIds = systemsList.map((s) => s.id);

  const rows = await db
    .select({
      systemId: systemComponents.systemId,
      component: components,
    })
    .from(systemComponents)
    .innerJoin(components, eq(systemComponents.componentId, components.id))
    .where(inArray(systemComponents.systemId, systemIds));

  return systemsList.map((system) => ({
    ...system,
    components: rows
      .filter((r) => r.systemId === system.id)
      .map((r) => r.component),
  }));
}

export async function getSystemById(id: string) {
  const [system] = await db.select().from(systems).where(eq(systems.id, id));

  if (!system) return null;

  const rows = await db
    .select({
      component: components,
    })
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
    const hasSystemFields =
      data.name !== undefined || data.description !== undefined;

    let updatedSystem = null;

    if (hasSystemFields) {
      const [result] = await tx
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

      updatedSystem = result;
    } else {
      const [existing] = await tx
        .select()
        .from(systems)
        .where(eq(systems.id, id));

      updatedSystem = existing;
    }

    if (!updatedSystem) return null;

    if (Array.isArray(data.componentIds)) {
      await tx
        .delete(systemComponents)
        .where(eq(systemComponents.systemId, id));

      if (data.componentIds.length > 0) {
        const mappings = data.componentIds.map((componentId) => ({
          systemId: id,
          componentId,
        }));

        await tx.insert(systemComponents).values(mappings);
      }
    }

    return updatedSystem;
  });
}

export async function deleteSystem(id: string) {
  const [deleted] = await db
    .delete(systems)
    .where(eq(systems.id, id))
    .returning();

  return deleted;
}
