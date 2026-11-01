import { pgTable, varchar } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const departments = pgTable("departments", {
  ...baseColumns,
  name: varchar("name", { length: 100 }).notNull().unique(),
});
