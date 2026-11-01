import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const users = pgTable("users", {
  ...baseColumns,
  username: varchar("username", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  password: text("password").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});
