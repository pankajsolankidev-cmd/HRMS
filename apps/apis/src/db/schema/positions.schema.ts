import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const positions = pgTable("positions", {
  ...baseColumns,

  name: varchar("name", { length: 100 }).notNull().unique(),
});
