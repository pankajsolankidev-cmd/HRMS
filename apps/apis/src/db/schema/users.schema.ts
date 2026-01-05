import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const users = pgTable("users", {
  ...baseColumns,
  username: varchar("username", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull(),

  password: text("password").notNull(),
});
