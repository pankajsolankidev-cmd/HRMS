import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { systems } from '../../db/schema/systems.schema'
import type {
  CreateSystemDto,
  UpdateSystemDto
} from '@shared/types/src/system/system.dto'

export async function createSystem(data: CreateSystemDto) {
  const [system] = await db
    .insert(systems)
    .values({
      name: data.name,
      description: data.description
    })
    .returning()

  return system
}

export async function getSystems() {
  return await db.select().from(systems)
}

export async function getSystemById(id: string) {
  const [system] = await db
    .select()
    .from(systems)
    .where(eq(systems.id, id))

  return system
}

export async function updateSystem(
  id: string,
  data: UpdateSystemDto
) {
  const [updated] = await db
    .update(systems)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(systems.id, id))
    .returning()

  return updated
}

export async function deleteSystem(id: string) {
  const [deleted] = await db
    .delete(systems)
    .where(eq(systems.id, id))
    .returning()

  return deleted
}
