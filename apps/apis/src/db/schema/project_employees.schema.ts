import { pgTable, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { baseColumns } from "../base-columns";
import { projects } from "./projects.schema";
import { employees } from "./employees.schema";

export const projectEmployees = pgTable(
  "project_employees",
  {
    ...baseColumns,

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueProjectEmployee: uniqueIndex("uniq_project_employee").on(
      table.projectId,
      table.employeeId,
    ),
  }),
);
