import { pgTable, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { employees } from "./employees.schema";
import { baseColumns } from "../base-columns";

export const documentGeneration = pgTable("document_generation", {
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),

  generateOfferLetter: boolean("generate_offer_letter")
    .default(false)
    .notNull(),

  generateAppointmentLetter: boolean("generate_appointment_letter")
    .default(false)
    .notNull(),

  ...baseColumns,
});
