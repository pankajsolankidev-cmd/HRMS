import { pgEnum } from "drizzle-orm/pg-core";

export const weekDayEnum = pgEnum("week_day_enum", [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
