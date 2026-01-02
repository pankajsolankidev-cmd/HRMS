import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "../../db";
import { employees, documentGeneration, users } from "../../db/schema";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";
import type { UpdateEmployeeDto } from "@shared/types/src/employee/update-employee.dto";

const DEFAULT_EMPLOYEE_PASSWORD: string = (() => {
  const pwd = process.env.DEFAULT_EMPLOYEE_PASSWORD;
  if (!pwd) {
    throw new Error("DEFAULT_EMPLOYEE_PASSWORD is not set in environment");
  }
  return pwd;
})();

export async function createEmployee(data: CreateEmployeeDto) {
  return await db.transaction(async (tx) => {
    /* ---------- 1️⃣ CREATE USER ---------- */
    const hashedPassword = await bcrypt.hash(DEFAULT_EMPLOYEE_PASSWORD, 10);

    const [user] = await tx
      .insert(users)
      .values({
        username: `${data.firstName}.${data.lastName}`.toLowerCase(),
        email: data.email,
        password: hashedPassword,
      })
      .returning({ id: users.id });

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

        systemId: data.systemId ?? null,

        userId: user.id,
      })
      .returning({ id: employees.id });

    await tx.insert(documentGeneration).values({
      employeeId: employee.id,
      generateOfferLetter: data.documents.generateOfferLetter,
      generateAppointmentLetter: data.documents.generateAppointmentLetter,
    });

    return {
      employeeId: employee.id,
      userId: user.id,
    };
  });
}

export async function getEmployees() {
  return await db.select().from(employees);
}

export async function getEmployeeById(id: string) {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id));

  return employee;
}

export async function updateEmployee(id: string, data: UpdateEmployeeDto) {
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

export async function deleteEmployee(id: string) {
  const [deleted] = await db
    .delete(employees)
    .where(eq(employees.id, id))
    .returning({ id: employees.id });

  return deleted;
}
