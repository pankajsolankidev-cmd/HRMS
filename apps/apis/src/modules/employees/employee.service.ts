import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "../../db";
import {
  employees,
  documentGeneration,
  users,
  userRoles,
  roles,
} from "../../db/schema";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";
import type { UpdateEmployeeDto } from "@shared/types/src/employee/update-employee.dto";
import { RoleName, ROLES } from "../../db/schema/roles.enums";
import { positions } from "../../db/schema/positions.schema";

import { sendMessage } from "../../utils/api-response";

const DEFAULT_EMPLOYEE_PASSWORD: string = (() => {
  const pwd = process.env.DEFAULT_EMPLOYEE_PASSWORD;
  if (!pwd) {
    throw new Error("DEFAULT_EMPLOYEE_PASSWORD is not set in environment");
  }
  return pwd;
})();

export async function createEmployeeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateEmployeeDto;

  try {
    const result = await db.transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(DEFAULT_EMPLOYEE_PASSWORD, 10);

      const [user] = await tx
        .insert(users)
        .values({
          username: `${body.firstName}.${body.lastName}`.toLowerCase(),
          email: body.email,
          password: hashedPassword,
        })
        .returning({ id: users.id });

      const [employee] = await tx
        .insert(employees)
        .values({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,

          positionId: body.positionId,
          departmentId: body.departmentId,
          joiningDate: body.joiningDate,
          managerId: body.managerId ?? null,
          systemId: body.systemId ?? null,

          welcomeWithWhatsapp: body.welcome.welcomewithWhatsapp,
          welcomeWithGmail: body.welcome.welcomewithGmail,
          welcomeWithSlack: body.welcome.welcomewithSlack,

          userId: user.id,
        })
        .returning({ id: employees.id });

      const [position] = await tx
        .select({ name: positions.name })
        .from(positions)
        .where(eq(positions.id, body.positionId));

      if (!position) {
        throw new Error("Invalid position");
      }

      let roleName: RoleName;

      switch (position.name.toLowerCase()) {
        case "hr":
          roleName = ROLES.HR;
          break;

        case "admin":
          roleName = ROLES.ADMIN;
          break;

        default:
          roleName = ROLES.EMPLOYEE;
          break;
      }

      const [role] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, roleName));

      if (!role) {
        throw new Error(`Role not found: ${roleName}`);
      }

      await tx.insert(userRoles).values({
        userId: user.id,
        roleId: role.id,
      });

      await tx.insert(documentGeneration).values({
        employeeId: employee.id,
        generateOfferLetter: body.documents.generateOfferLetter,
        generateAppointmentLetter: body.documents.generateAppointmentLetter,
      });

      return {
        employeeId: employee.id,
        userId: user.id,
      };
    });

    return reply.code(201).send({
      message: "Employee created successfully",
      employeeId: result.employeeId,
      userId: result.userId,
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      return reply.code(409).send({
        message: "Employee with this email already exists",
      });
    }

    request.log.error(err);
    return reply.code(500).send({
      message: "Internal server error",
    });
  }
}

export async function getEmployeesHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "firstName" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  const conditions = [];

  if (query?.search) {
    conditions.push(
      sql`(
        ${employees.firstName} ILIKE ${`%${query.search}%`} OR
        ${employees.lastName} ILIKE ${`%${query.search}%`} OR
        ${employees.email} ILIKE ${`%${query.search}%`}
      )`,
    );
  }

  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(100, Number(query?.limit) || 10);
  const offset = (page - 1) * limit;

  const orderByClauses = [];

  if (!query?.sortBy) {
    orderByClauses.push(desc(employees.updatedAt));
  } else {
    orderByClauses.push(
      query.sortOrder === "asc"
        ? asc(employees[query.sortBy])
        : desc(employees[query.sortBy]),
    );
  }

  const data = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      positionId: employees.positionId,
      departmentId: employees.departmentId,
      joiningDate: employees.joiningDate,
      managerId: employees.managerId,
      systemId: employees.systemId,
      userId: employees.userId,
      welcome: {
        welcomewithWhatsapp: employees.welcomeWithWhatsapp,
        welcomewithGmail: employees.welcomeWithGmail,
        welcomewithSlack: employees.welcomeWithSlack,
      },
      documents: {
        generateOfferLetter: documentGeneration.generateOfferLetter,
        generateAppointmentLetter: documentGeneration.generateAppointmentLetter,
      },
    })
    .from(employees)
    .leftJoin(
      documentGeneration,
      eq(documentGeneration.employeeId, employees.id),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderByClauses)
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

export async function getEmployeeByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const rows = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      positionId: employees.positionId,
      departmentId: employees.departmentId,
      joiningDate: employees.joiningDate,
      managerId: employees.managerId,
      systemId: employees.systemId,
      userId: employees.userId,

      welcome: {
        welcomewithWhatsapp: employees.welcomeWithWhatsapp,
        welcomewithGmail: employees.welcomeWithGmail,
        welcomewithSlack: employees.welcomeWithSlack,
      },

      documents: {
        generateOfferLetter: documentGeneration.generateOfferLetter,
        generateAppointmentLetter: documentGeneration.generateAppointmentLetter,
      },
    })
    .from(employees)
    .leftJoin(
      documentGeneration,
      eq(documentGeneration.employeeId, employees.id),
    )
    .where(eq(employees.id, id));

  if (!rows.length) {
    return reply.code(404).send({ message: "Employee not found" });
  }

  return rows[0];
}

export async function updateEmployeeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateEmployeeDto;

  const updated = await db.transaction(async (tx) => {
    const employeeUpdateData: Partial<typeof employees.$inferInsert> = {
      firstName: body.firstName,
      lastName: body.lastName,
      positionId: body.positionId,
      departmentId: body.departmentId,
      managerId: body.managerId,
      systemId: body.systemId,
      joiningDate: body.joiningDate,
      welcomeWithWhatsapp: body.welcome?.welcomewithWhatsapp,
      welcomeWithGmail: body.welcome?.welcomewithGmail,
      welcomeWithSlack: body.welcome?.welcomewithSlack,
    };

    Object.keys(employeeUpdateData).forEach(
      (key) =>
        employeeUpdateData[key as keyof typeof employeeUpdateData] ===
          undefined &&
        delete employeeUpdateData[key as keyof typeof employeeUpdateData],
    );

    const [result] = await tx
      .update(employees)
      .set(employeeUpdateData)
      .where(eq(employees.id, id))
      .returning();

    if (!result) return null;

    if (body.documents) {
      await tx
        .update(documentGeneration)
        .set({
          generateOfferLetter: body.documents.generateOfferLetter,
          generateAppointmentLetter: body.documents.generateAppointmentLetter,
          updatedAt: new Date(),
        })
        .where(eq(documentGeneration.employeeId, id));
    }

    return result;
  });

  if (!updated) {
    return reply.code(404).send({ message: "Employee not found" });
  }

  return sendMessage(reply, "Employee updated successfully");
}

export async function deleteEmployeeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  const deleted = await db.transaction(async (tx) => {
    await tx
      .delete(documentGeneration)
      .where(eq(documentGeneration.employeeId, id));

    const [emp] = await tx
      .delete(employees)
      .where(eq(employees.id, id))
      .returning({ id: employees.id });

    return emp;
  });

  if (!deleted) {
    return reply.code(404).send({ message: "Employee not found" });
  }

  return sendMessage(reply, "Employee deleted successfully");
}
