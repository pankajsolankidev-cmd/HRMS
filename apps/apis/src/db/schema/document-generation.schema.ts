import { pgTable, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { employees } from "./employees.schema";

export const documentGeneration = pgTable("document_generation", {
  id: uuid("id").defaultRandom().primaryKey(),

  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),

  generateOfferLetter: boolean("generate_offer_letter")
    .default(false)
    .notNull(),

  generateAppointmentLetter: boolean("generate_appointment_letter")
    .default(false)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
