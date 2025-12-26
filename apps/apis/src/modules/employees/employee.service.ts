import { db } from "../../db";

import {
  employees,
  employeeSystemAccess,
  documentGeneration,
} from "../../db/schema";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";

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

    if (data.systems && data.systems.length > 0) {
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

    return {
      employeeId,
    };
  });
}
