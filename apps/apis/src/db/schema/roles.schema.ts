import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const roles = pgTable("roles", {
  ...baseColumns,

  name: varchar("name", { length: 50 }).notNull().unique(),
});
