import { pgTable, varchar, time } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";
import { weekDayEnum } from "./week-day.pg-enum";

export const organization = pgTable("organization", {
  ...baseColumns,
  name: varchar("name", { length: 255 }).notNull(),
  workingStartTime: time("working_start_time").notNull(),
  workingEndTime: time("working_end_time").notNull(),
  weekOff: weekDayEnum("week_off").array().notNull(),
});
