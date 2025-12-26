import { eq } from "drizzle-orm";

import { db } from "../../db";
import {
  employees,
  employeeSystemAccess,
  documentGeneration,
} from "../../db/schema";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";

import type { UpdateEmployeeDto } from "@shared/types/src/employee/update-employee.dto";

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
        managerId: data.managerId,
        buddyId: data.buddyId,
        whatsapp: data.welcome.whatsapp,
        gmail: data.welcome.gmail,
        slack: data.welcome.slack,
      })
      .returning({ id: employees.id });

    const employeeId = employee.id;

    if (data.systems?.length > 0) {
      await tx.insert(employeeSystemAccess).values(
        data.systems.map((system) => ({
          employeeId,
          system,
        }))
      );
    }

    await tx.insert(documentGeneration).values({
      employeeId,
      generateOfferLetter: data.documents.generateOfferLetter,
      generateAppointmentLetter: data.documents.generateAppointmentLetter,
    });

    return { employeeId };
  });
}

export async function getEmployees() {
  return await db.select().from(employees);
}

export async function getEmployeeById(id: number) {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id));

  return employee;
}

export async function updateEmployee(id: number, data: UpdateEmployeeDto) {
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

export async function deleteEmployee(id: number) {
  const [deleted] = await db
    .delete(employees)
    .where(eq(employees.id, id))
    .returning({ id: employees.id });

  return deleted;
}
