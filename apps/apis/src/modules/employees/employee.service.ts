import { eq, and, asc, desc, sql } from "drizzle-orm";
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
  return db.transaction(async (tx) => {
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
        systemId: data.systemId ?? null,

        welcomewithWhatsapp: data.welcome.welcomewithWhatsapp,
        welcomewithGmail: data.welcome.welcomewithGmail,
        welcomewithSlack: data.welcome.welcomewithSlack,

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

export async function updateEmployee(id: string, data: UpdateEmployeeDto) {
  return db.transaction(async (tx) => {
    const employeeUpdateData: Partial<typeof employees.$inferInsert> = {
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      departmentId: data.departmentId,
      managerId: data.managerId,
      systemId: data.systemId,

      welcomewithWhatsapp: data.welcome?.welcomewithWhatsapp,
      welcomewithGmail: data.welcome?.welcomewithGmail,
      welcomewithSlack: data.welcome?.welcomewithSlack,

      updatedAt: new Date(),
    };

    Object.keys(employeeUpdateData).forEach(
      (key) =>
        employeeUpdateData[key as keyof typeof employeeUpdateData] ===
          undefined &&
        delete employeeUpdateData[key as keyof typeof employeeUpdateData]
    );

    const result = await tx
      .update(employees)
      .set(employeeUpdateData)
      .where(eq(employees.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Employee not found or nothing to update");
    }

    if (data.documents) {
      const documentUpdateData: Partial<
        typeof documentGeneration.$inferInsert
      > = {
        generateOfferLetter: data.documents.generateOfferLetter,
        generateAppointmentLetter: data.documents.generateAppointmentLetter,
        updatedAt: new Date(),
      };

      Object.keys(documentUpdateData).forEach(
        (key) =>
          documentUpdateData[key as keyof typeof documentUpdateData] ===
            undefined &&
          delete documentUpdateData[key as keyof typeof documentUpdateData]
      );

      await tx
        .update(documentGeneration)
        .set(documentUpdateData)
        .where(eq(documentGeneration.employeeId, id));
    }

    return {
      id,
      message: "Employee updated successfully",
    };
  });
}

export async function getEmployees(query?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "firstName" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const conditions = [];

  if (query?.search) {
    conditions.push(
      sql`(
        ${employees.firstName} ILIKE ${`%${query.search}%`} OR
        ${employees.lastName} ILIKE ${`%${query.search}%`} OR
        ${employees.email} ILIKE ${`%${query.search}%`}
      )`
    );
  }

  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(100, Number(query?.limit) || 10);
  const offset = (page - 1) * limit;

  const sortColumn =
    query?.sortBy === "createdAt" ? employees.createdAt : employees.firstName;

  const order = query?.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const data = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      position: employees.position,
      departmentId: employees.departmentId,
      joiningDate: employees.joiningDate,
      managerId: employees.managerId,
      systemId: employees.systemId,
      userId: employees.userId,

      welcome: {
        welcomewithWhatsapp: employees.welcomewithWhatsapp,
        welcomewithGmail: employees.welcomewithGmail,
        welcomewithSlack: employees.welcomewithSlack,
      },

      documents: {
        generateOfferLetter: documentGeneration.generateOfferLetter,
        generateAppointmentLetter: documentGeneration.generateAppointmentLetter,
      },
    })
    .from(employees)
    .leftJoin(
      documentGeneration,
      eq(documentGeneration.employeeId, employees.id)
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(conditions.length ? and(...conditions) : undefined);

  return {
    data,
    meta: {
      page,
      limit,
      total: Number(count),
    },
  };
}

export async function getEmployeeById(id: string) {
  const rows = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      position: employees.position,
      departmentId: employees.departmentId,
      joiningDate: employees.joiningDate,
      managerId: employees.managerId,
      systemId: employees.systemId,
      userId: employees.userId,

      welcome: {
        welcomewithWhatsapp: employees.welcomewithWhatsapp,
        welcomewithGmail: employees.welcomewithGmail,
        welcomewithSlack: employees.welcomewithSlack,
      },

      documents: {
        generateOfferLetter: documentGeneration.generateOfferLetter,
        generateAppointmentLetter: documentGeneration.generateAppointmentLetter,
      },
    })
    .from(employees)
    .leftJoin(
      documentGeneration,
      eq(documentGeneration.employeeId, employees.id)
    )
    .where(eq(employees.id, id));

  return rows.length ? rows[0] : null;
}

export async function deleteEmployee(id: string) {
  return db.transaction(async (tx) => {
    await tx
      .delete(documentGeneration)
      .where(eq(documentGeneration.employeeId, id));

    const [deleted] = await tx
      .delete(employees)
      .where(eq(employees.id, id))
      .returning({ id: employees.id });

    return deleted;
  });
}
