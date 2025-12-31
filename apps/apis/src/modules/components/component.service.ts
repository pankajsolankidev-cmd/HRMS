import { eq } from "drizzle-orm";
import { db } from "../../db";
import { components } from "../../db/schema/components.schema";

import type { CreateComponentDto } from "@shared/types/src/components/create-component.dto";
import type { UpdateComponentDto } from "@shared/types/src/components/update-component.dto";

export async function createComponent(data: CreateComponentDto) {
  const [component] = await db.insert(components).values(data).returning();

  return component;
}

export async function getComponents() {
  return db.select().from(components);
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
