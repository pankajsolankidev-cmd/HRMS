import {
  pgTable,
  uuid,
  date,
  text,
  numeric,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { employees } from "./employees.schema";
import {
  leaveTypeEnum,
  leaveDayTypeEnum,
  leaveStatusEnum,
  LeaveStatus,
} from "./leave.enums";
import { baseColumns } from "../base-columns";
import { users } from "./users.schema";

export const leaveRequests = pgTable("leave_requests", {
  ...baseColumns,

  employeeId: uuid("employee_id")
    .references(() => employees.id)
    .notNull(),

  createdBy: uuid("created_by")
    .references(() => users.id)
    .notNull(),

  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),

  type: leaveTypeEnum("type").notNull(),
  dayType: leaveDayTypeEnum("day_type").notNull(),
  fromHour: integer("from_hour").notNull(),
  toHour: integer("to_hour").notNull(),

  totalHours: integer("total_hours").notNull(),
  totalDays: numeric("total_days").notNull(),

  status: leaveStatusEnum("status").default(LeaveStatus.Pending).notNull(),

  reason: text("reason"),
  file: text("file"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),

  rejectedBy: uuid("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
});
