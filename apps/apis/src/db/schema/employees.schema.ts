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
import { baseColumns } from "../base-columns";
import { positions } from "./positions.schema";
import { departments } from "./department.schema";

export const employees = pgTable("employees", {
  ...baseColumns,
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),

  positionId: uuid("position_id").notNull().references(() => positions.id),
  departmentId: uuid("department_id").references(() => departments.id),
  joiningDate: date("joining_date").notNull(),

  managerId: uuid("manager_id"),

  welcomeWithWhatsapp: boolean("welcomeWithWhatsapp").default(false).notNull(),
  welcomeWithGmail: boolean("welcomeWithGmail").default(false).notNull(),
  welcomeWithSlack: boolean("welcomeWithSlack").default(false).notNull(),

  systemId: uuid("system_id").references(() => systems.id).unique(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
});
