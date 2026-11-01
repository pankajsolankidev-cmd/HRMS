import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { systems } from "./systems.schema";
import { components } from "./components.schema";
import { baseColumns } from "../base-columns";

export const systemComponents = pgTable("system_components", {
  systemId: uuid("system_id")
    .notNull()
    .references(() => systems.id, { onDelete: "cascade" }),

  componentId: uuid("component_id")
    .notNull()
    .unique()
    .references(() => components.id, { onDelete: "cascade" }),
  ...baseColumns,
});
