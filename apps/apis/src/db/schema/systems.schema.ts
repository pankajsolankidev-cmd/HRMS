import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const systems = pgTable("systems", {
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  ...baseColumns,
});
