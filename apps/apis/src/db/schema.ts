import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  username: varchar('username', { length: 100 }).notNull(),

  email: varchar('email', { length: 255 }).notNull(),

  password: text('password').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})



export const schema = {
  users
}
