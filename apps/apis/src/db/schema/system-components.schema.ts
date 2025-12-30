import { pgTable, uuid,timestamp } from 'drizzle-orm/pg-core'
import { systems } from './systems.schema'
import { components } from './components.schema'

export const systemComponents = pgTable('system_components', {
  id: uuid('id').defaultRandom().primaryKey(),

  systemId: uuid('system_id')
    .notNull()
    .references(() => systems.id, { onDelete: 'cascade' }),

  componentId: uuid('component_id')
    .notNull()
    .references(() => components.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
