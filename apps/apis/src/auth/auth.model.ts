import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { baseColumns } from "../db/base-columns";

export const users = pgTable("users", {
  ...baseColumns,
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
});
