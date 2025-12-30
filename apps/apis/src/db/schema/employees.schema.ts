import {
  pgTable,
  uuid,
  varchar,
  integer,
  date,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

import { systems } from "./systems.schema";
import { users } from "./users.schema";

export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),

  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),

  position: varchar("position", { length: 100 }).notNull(),
  departmentId: integer("department_id"),
  joiningDate: date("joining_date").notNull(),

  managerId: uuid("manager_id"),

  welcomewithWhatsapp: boolean("welcomewith_whatsapp").default(false).notNull(),
  welcomewithGmail: boolean("welcomewith_gmail").default(false).notNull(),
  welcomewithSlack: boolean("welcomewith_slack").default(false).notNull(),

  systemId: uuid("system_id")
    .notNull()
    .references(() => systems.id),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
