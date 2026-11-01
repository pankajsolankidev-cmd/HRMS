import {
  pgTable,
  uuid,
  integer,
  numeric,
  timestamp,
  text,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

import { employees } from "./employees.schema";
import { users } from "./users.schema";
import { baseColumns } from "../base-columns";
import { PayrollMonth } from "./payroll.enums";
import { sql } from "drizzle-orm";
import { check } from "drizzle-orm/gel-core";

export const salary = pgTable(
  "salary",
  {
    ...baseColumns,

    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),

    basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }).notNull(),

    tax: numeric("tax", { precision: 12, scale: 2 }).default("0").notNull(),

    pf: numeric("pf", { precision: 12, scale: 2 }).default("0").notNull(),

    netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull(),

    description: text("description"),
    appraisalDate: timestamp("appraisal_date"),
  },
  (table) => ({
    uniqueEmployeeSalary: uniqueIndex("uniq_salary_employee").on(
      table.employeeId,
    ),
    basicSalaryNonNegative: check(
      "salary_basic_non_negative",
      sql`${table.basicSalary} >= 0`,
    ),
    taxNonNegative: check("salary_tax_non_negative", sql`${table.tax} >= 0`),
    pfNonNegative: check("salary_pf_non_negative", sql`${table.pf} >= 0`),
    netSalaryNonNegative: check(
      "salary_net_non_negative",
      sql`${table.netSalary} >= 0`,
    ),
  }),
);

export const payrollMonthEnum = pgEnum("payroll_month", PayrollMonth);

export const payrolls = pgTable(
  "payrolls",
  {
    ...baseColumns,

    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),

    month: payrollMonthEnum("month").notNull(),
    year: integer("year").notNull(),

    processedBy: uuid("processed_by")
      .notNull()
      .references(() => users.id),

    deductions: numeric("deductions", {
      precision: 12,
      scale: 2,
    })
      .default("0")
      .notNull(),
    deductionReason: text("deduction_reason"),

    leaveDeduction: numeric("leave_deduction", {
      precision: 12,
      scale: 2,
    })
      .default("0")
      .notNull(),

    bonus: numeric("bonus", {
      precision: 12,
      scale: 2,
    })
      .default("0")
      .notNull(),
    bonusDescription: text("bonus_description"),

    netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull(),

    file: text("file"),
    processedAt: timestamp("processed_at").defaultNow().notNull(),
  },

  (table) => ({
    uniquePayroll: uniqueIndex("uniq_employee_month_year").on(
      table.employeeId,
      table.month,
      table.year,
    ),
    deductionsNonNegative: check(
      "payroll_deductions_non_negative",
      sql`${table.deductions} >= 0`,
    ),

    leaveDeductionNonNegative: check(
      "payroll_leave_deduction_non_negative",
      sql`${table.leaveDeduction} >= 0`,
    ),
    bonusNonNegative: check(
      "payroll_bonus_non_negative",
      sql`${table.bonus} >= 0`,
    ),
    netSalaryNonNegative: check(
      "payroll_net_salary_non_negative",
      sql`${table.netSalary} >= 0`,
    ),
  }),
);
