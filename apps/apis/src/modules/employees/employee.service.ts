import { eq } from "drizzle-orm";
import { db } from "../../db";

import {
  employees,
  documentGeneration,
} from "../../db/schema";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";
import type { UpdateEmployeeDto } from "@shared/types/src/employee/update-employee.dto";

// ============================
// CREATE EMPLOYEE
// ============================
export async function createEmployee(data: CreateEmployeeDto) {
  return await db.transaction(async (tx) => {
    const [employee] = await tx
      .insert(employees)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        position: data.position,
        departmentId: data.departmentId,
        joiningDate: data.joiningDate,
        managerId: data.managerId ?? null,

        welcomewithWhatsapp: data.welcome.whatsapp,
        welcomewithGmail: data.welcome.gmail,
        welcomewithSlack: data.welcome.slack,

        systemId: data.systemId,
        userId: data.userId,
      })
      .returning({ id: employees.id });

    await tx.insert(documentGeneration).values({
      employeeId: employee.id,
      generateOfferLetter: data.documents.generateOfferLetter,
      generateAppointmentLetter: data.documents.generateAppointmentLetter,
    });

    return { employeeId: employee.id };
  });
}

// ============================
// GET ALL EMPLOYEES
// ============================
export async function getEmployees() {
  return await db.select().from(employees);
}

// ============================
// GET EMPLOYEE BY ID
// ============================
export async function getEmployeeById(id: string) {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id));

  return employee;
}

// ============================
// UPDATE EMPLOYEE
// ============================
export async function updateEmployee(
  id: string,
  data: UpdateEmployeeDto
) {
  const [updated] = await db
    .update(employees)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(employees.id, id))
    .returning({ id: employees.id });

  return updated;
}

// ============================
// DELETE EMPLOYEE
// ============================
export async function deleteEmployee(id: string) {
  const [deleted] = await db
    .delete(employees)
    .where(eq(employees.id, id))
    .returning({ id: employees.id });

  return deleted;
}
