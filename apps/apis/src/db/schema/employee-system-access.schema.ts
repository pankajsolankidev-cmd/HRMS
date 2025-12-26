import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp
} from 'drizzle-orm/pg-core'

import { employees } from './employees.schema'

export const employeeSystemAccess = pgTable(
  'employee_system_access',
  {
    id: serial('id').primaryKey(),

    employeeId: integer('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),

    system: varchar('system', { length: 100 }).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull()
  }
)
