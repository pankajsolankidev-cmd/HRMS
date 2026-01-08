import { pgTable, uuid, date, text } from "drizzle-orm/pg-core";
import { employees } from "./employees.schema";
import {
  leaveTypeEnum,
  leaveDayTypeEnum,
  leaveStatusEnum,
  LeaveStatus,
} from "./leave.enums";
import { baseColumns } from "../base-columns";

export const leaveRequests = pgTable("leave_requests", {
  ...baseColumns,

  employeeId: uuid("employee_id")
    .references(() => employees.id)
    .notNull(),

  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),

  type: leaveTypeEnum("type").notNull(),
  dayType: leaveDayTypeEnum("day_type").notNull(),

  status: leaveStatusEnum("status").default(LeaveStatus.Pending).notNull(),

  reason: text("reason"),
  file: text("file"),
});
