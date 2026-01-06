import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const components = pgTable("components", {
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 50 }).notNull().unique(),
  ...baseColumns,
});
