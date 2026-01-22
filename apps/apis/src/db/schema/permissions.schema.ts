import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const permissions = pgTable("permissions", {
  ...baseColumns,

  name: varchar("name", { length: 100 }).notNull().unique(),
});
