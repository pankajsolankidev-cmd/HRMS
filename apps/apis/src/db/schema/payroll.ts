import { pgTable, uuid, integer, numeric, timestamp, text, uniqueIndex } from "drizzle-orm/pg-core";
import { employees } from "./employees.schema";
import { baseColumns } from "../base-columns";

export const salaryStructures = pgTable("salary_structures", {
  ...baseColumns,

  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),

  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  appraisalDate: timestamp("appraisal_date"),
}, (table) => ({
  uniqueEmployeeSalary: uniqueIndex("uniq_salary_employee").on(table.employeeId),
}));

export const payrolls = pgTable("payrolls", {
  ...baseColumns,

  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),

  month: integer("month").notNull(), 
  year: integer("year").notNull(),

  processedBy: uuid("processed_by")
    .notNull()
    .references(() => employees.id),

  totalDeductions: numeric("total_deductions", { precision: 12, scale: 2 }).default("0"),
  netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull(),

  file: text("file"), 

  processedAt: timestamp("processed_at").defaultNow().notNull(),
}, (table) => ({
  uniquePayroll: uniqueIndex("uniq_employee_month_year").on(
    table.employeeId,
    table.month,
    table.year,
  ),
}));
