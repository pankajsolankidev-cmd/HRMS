import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),

  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),

  email: varchar("email", { length: 150 }).notNull().unique(),

  position: varchar("position", { length: 100 }).notNull(),

  departmentId: integer("department_id"),

  joiningDate: date("joining_date").notNull(),

  managerId: integer("manager_id"),
  buddyId: integer("buddy_id"),

  whatsapp: boolean("whatsapp").default(false).notNull(),
  gmail: boolean("gmail").default(false).notNull(),
  slack: boolean("slack").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
