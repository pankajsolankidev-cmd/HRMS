import { pgTable, varchar, date, text } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";

export const holidays = pgTable("holidays", {
  ...baseColumns,
  title: varchar("title", { length: 255 }).notNull(),
  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),
  description: text("description"),
});
