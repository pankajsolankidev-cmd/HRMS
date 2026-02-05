import {
  pgTable,
  uuid,
  varchar,
  numeric,
  date,
  timestamp,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";

import { employees, users } from "./index";
import { baseColumns } from "../base-columns";
import { expenseStatusEnum } from "./expense.enums";

export const expenseStatusPgEnum = pgEnum("expense_status", expenseStatusEnum);

export const expenses = pgTable("expenses", {
  ...baseColumns,

  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),

  expenseType: varchar("expense_type", { length: 50 }).notNull(),

  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

  expenseDate: date("expense_date").notNull(),

  file: varchar("file", { length: 255 }),

  description: text("description"),

  status: expenseStatusPgEnum("status").notNull().default("DRAFT"),

  approvedBy: uuid("approved_by").references(() => users.id),

  approvedAt: timestamp("approved_at"),

  rejectedBy: uuid("rejected_by").references(() => users.id),

  rejectedAt: timestamp("rejected_at"),

  rejectionReason: text("rejection_reason"),
});
