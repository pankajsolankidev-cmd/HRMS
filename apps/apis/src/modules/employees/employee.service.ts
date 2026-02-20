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
  refreshTokens,
} from "../../db/schema";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";
import type { UpdateEmployeeDto } from "@shared/types/src/employee/update-employee.dto";
import { RoleName, ROLES } from "../../db/schema/roles.enums";
import { positions } from "../../db/schema/positions.schema";

import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";

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

  const email = body.email.toLowerCase().trim();

  request.log.info(
    {
      action: "CREATE_EMPLOYEE",
      email,
      positionId: body.positionId,
      departmentId: body.departmentId,
    },
    "Create employee request received",
  );

  try {
    const result = await db.transaction(async (tx) => {
      const hashedPassword = await bcrypt.hash(DEFAULT_EMPLOYEE_PASSWORD, 10);

      const [user] = await tx
        .insert(users)
        .values({
          username: email,
          email,
          password: hashedPassword,
        })
        .returning({ id: users.id });

      const [employee] = await tx
        .insert(employees)
        .values({
          firstName: body.firstName,
          lastName: body.lastName,
          email,
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

    request.log.info(
      {
        action: "CREATE_EMPLOYEE",
        employeeId: result.employeeId,
        userId: result.userId,
      },
      "Employee created successfully",
    );

    return reply.code(201).send({
      message: "Employee created successfully",
      employeeId: result.employeeId,
      userId: result.userId,
    });
  } catch (err: any) {
    const dbError = err?.cause ?? err?.originalError ?? err;

    if (dbError?.code === "23505") {
      request.log.warn(
        {
          action: "CREATE_EMPLOYEE",
          email,
          constraint: dbError.constraint,
        },
        "Duplicate employee creation attempt",
      );

      if (
        dbError.constraint === "users_email_unique" ||
        dbError.constraint === "users_username_unique" ||
        dbError.constraint === "employees_email_unique"
      ) {
        return reply.code(409).send({
          message: "Employee with this email already exists",
        });
      }

      return reply.code(409).send({
        message: "Duplicate record",
      });
    }

    request.log.error(
      {
        action: "CREATE_EMPLOYEE",
        email,
        err: dbError,
      },
      "Failed to create employee",
    );

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

  request.log.info(
    {
      action: "GET_EMPLOYEES",
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    "Get employees request received",
  );

  try {
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

    const { page, limit, offset } = getPagination(query);

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

    let queryBuilder = db
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
          generateAppointmentLetter:
            documentGeneration.generateAppointmentLetter,
        },
      })
      .from(employees)
      .leftJoin(
        documentGeneration,
        eq(documentGeneration.employeeId, employees.id),
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...orderByClauses)
      .$dynamic();

    if (limit !== undefined && offset !== undefined) {
      queryBuilder = queryBuilder.limit(limit).offset(offset);
    }

    const data = await queryBuilder;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(conditions.length ? and(...conditions) : undefined);

    request.log.info(
      {
        action: "GET_EMPLOYEES",
        resultCount: data.length,
        total: Number(count),
        page,
        limit,
      },
      "Employees fetched successfully",
    );

    return {
      data,
      meta: {
        page,
        limit: limit ?? null,
        total: Number(count),
      },
    };
  } catch (err: any) {
    request.log.error(
      {
        action: "GET_EMPLOYEES",
        err,
        query,
      },
      "Failed to fetch employees",
    );

    return {
      data: [],
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? null,
        total: 0,
      },
    };
  }
}

export async function getEmployeeByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "GET_EMPLOYEE_BY_ID",
      employeeId: id,
    },
    "Get employee by id request received",
  );

  try {
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
          generateAppointmentLetter:
            documentGeneration.generateAppointmentLetter,
        },
      })
      .from(employees)
      .leftJoin(
        documentGeneration,
        eq(documentGeneration.employeeId, employees.id),
      )
      .where(eq(employees.id, id));

    if (!rows.length) {
      request.log.warn(
        {
          action: "GET_EMPLOYEE_BY_ID",
          employeeId: id,
        },
        "Employee not found",
      );

      return reply.code(404).send({ message: "Employee not found" });
    }

    request.log.info(
      {
        action: "GET_EMPLOYEE_BY_ID",
        employeeId: id,
      },
      "Employee fetched successfully",
    );

    return rows[0];
  } catch (err: any) {
    request.log.error(
      {
        action: "GET_EMPLOYEE_BY_ID",
        employeeId: id,
        err,
      },
      "Failed to fetch employee",
    );

    return reply.code(500).send({
      message: "Internal server error",
    });
  }
}

export async function updateEmployeeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateEmployeeDto;

  const loggedInUserId = (request.user as any)?.id;

  request.log.info(
    {
      action: "UPDATE_EMPLOYEE",
      employeeId: id,
      updatedFields: Object.keys(body ?? {}),
    },
    "Update employee request received",
  );

  try {
    const updated = await db.transaction(async (tx) => {
      const [employee] = await tx
        .select({ id: employees.id, userId: employees.userId })
        .from(employees)
        .where(eq(employees.id, id));

      if (!employee) return null;

      if (employee.userId === loggedInUserId) {
        request.log.warn(
          {
            action: "UPDATE_EMPLOYEE",
            employeeId: id,
            userId: loggedInUserId,
          },
          "Self update attempt blocked",
        );

        return reply.code(403).send({
          message: "You cannot update your own record",
        });
      }

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
      request.log.warn(
        {
          action: "UPDATE_EMPLOYEE",
          employeeId: id,
        },
        "Employee not found for update",
      );

      return reply.code(404).send({ message: "Employee not found" });
    }

    request.log.info(
      {
        action: "UPDATE_EMPLOYEE",
        employeeId: id,
      },
      "Employee updated successfully",
    );

    return sendMessage(reply, "Employee updated successfully");
  } catch (err: any) {
    request.log.error(
      {
        action: "UPDATE_EMPLOYEE",
        employeeId: id,
        err,
      },
      "Failed to update employee",
    );

    return reply.code(500).send({
      message: "Internal server error",
    });
  }
}

export async function deleteEmployeeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const loggedInUserId = (request.user as any)?.id;

  request.log.info(
    {
      action: "DELETE_EMPLOYEE",
      employeeId: id,
    },
    "Delete employee request received",
  );

  try {
    const deleted = await db.transaction(async (tx) => {
      const [employee] = await tx
        .select({ id: employees.id, userId: employees.userId })
        .from(employees)
        .where(eq(employees.id, id));

      if (!employee) return null;

      if (employee.userId === loggedInUserId) {
        request.log.warn(
          {
            action: "DELETE_EMPLOYEE",
            employeeId: id,
            userId: loggedInUserId,
          },
          "Self delete attempt blocked",
        );

        return reply.code(404).send({
          message: "self delete not allowed",
        });
      }

      await tx
        .delete(documentGeneration)
        .where(eq(documentGeneration.employeeId, id));

      await tx.delete(userRoles).where(eq(userRoles.userId, employee.userId));

      await tx
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, employee.userId));

      await tx.delete(employees).where(eq(employees.id, id));
      await tx.delete(users).where(eq(users.id, employee.userId));

      return { employeeId: id };
    });

    if (!deleted) {
      request.log.warn(
        {
          action: "DELETE_EMPLOYEE",
          employeeId: id,
        },
        "Employee not found for delete",
      );

      return reply.code(404).send({
        message: "Employee not found",
      });
    }

    request.log.info(
      {
        action: "DELETE_EMPLOYEE",
        employeeId: id,
      },
      "Employee deleted successfully",
    );

    return sendMessage(reply, "Employee deleted successfully");
  } catch (err: any) {
    if (err.message === "SELF_DELETE_NOT_ALLOWED") {
      return reply.code(403).send({
        message: "You cannot delete your own record",
      });
    }

    request.log.error(
      {
        action: "DELETE_EMPLOYEE",
        employeeId: id,
        err,
      },
      "Failed to delete employee",
    );

    return reply.code(500).send({
      message: "Internal server error",
    });
  }
}
