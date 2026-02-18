import { pgTable, uuid, varchar, date, pgEnum } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const projectStatusEnum = pgEnum("project_status", [
  "ACTIVE",
  "COMPLETED",
]);

export const projects = pgTable("projects", {
  ...baseColumns,
  name: varchar("name", { length: 150 }).notNull(),
  clientName: varchar("client_name", { length: 150 }),
  startDate: date("start_date").notNull(),
  expectedEndDate: date("expected_end_date"),
  status: projectStatusEnum("status").notNull().default("ACTIVE"),
});
