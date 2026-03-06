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
  departments,
  systems,
  components,
  systemComponents,
} from "../../db/schema";
import { alias } from "drizzle-orm/pg-core";

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
        throw new Error("INVALID_POSITION");
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
        throw new Error("ROLE_NOT_FOUND");
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

      return reply.code(409).send({
        message: "Employee with this email already exists",
      });
    }

    if (dbError?.message === "INVALID_POSITION") {
      return reply.code(400).send({
        message: "Invalid position selected",
      });
    }

    if (dbError?.message === "ROLE_NOT_FOUND") {
      request.log.error(
        {
          action: "CREATE_EMPLOYEE",
          email,
        },
        "Role configuration error",
      );

      return reply.code(400).send({
        message: "Employee role configuration missing",
      });
    }

    request.log.error(
      {
        action: "CREATE_EMPLOYEE",
        email,
        err: dbError,
      },
      "Unexpected employee creation error",
    );

    return reply.code(400).send({
      message: "Unable to create employee",
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
    const conditions = [eq(employees.isActive, true)];

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

    const manager = alias(employees, "manager");

    let queryBuilder = db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        joiningDate: employees.joiningDate,
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

        position: {
          id: positions.id,
          name: positions.name,
        },

        department: {
          id: departments.id,
          name: departments.name,
        },

        manager: {
          id: manager.id,
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
        },

        system: {
          id: systems.id,
          name: systems.name,
          description: systems.description,
          componentId: components.id,
          componentName: components.name,
          componentDescription: components.description,
          componentCode: components.code,
        },
      })
      .from(employees)
      .leftJoin(
        documentGeneration,
        eq(documentGeneration.employeeId, employees.id),
      )
      .leftJoin(positions, eq(positions.id, employees.positionId))
      .leftJoin(departments, eq(departments.id, employees.departmentId))
      .leftJoin(manager, eq(manager.id, employees.managerId))
      .leftJoin(systems, eq(systems.id, employees.systemId))
      .leftJoin(systemComponents, eq(systemComponents.systemId, systems.id))
      .leftJoin(components, eq(components.id, systemComponents.componentId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...orderByClauses)
      .$dynamic();

    if (limit !== undefined && offset !== undefined) {
      queryBuilder = queryBuilder.limit(limit).offset(offset);
    }

    const rows = await queryBuilder;

    const employeeMap = new Map<string, any>();

    for (const row of rows) {
      if (!employeeMap.has(row.id)) {
        employeeMap.set(row.id, {
          id: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          joiningDate: row.joiningDate,
          userId: row.userId,
          welcome: row.welcome,
          documents: row.documents,
          position: row.position?.id ? row.position : null,
          department: row.department?.id ? row.department : null,
          manager: row.manager?.id ? row.manager : null,
          system: row.system?.id
            ? {
                id: row.system.id,
                name: row.system.name,
                description: row.system.description,
                components: [],
              }
            : null,
        });
      }

      const employee = employeeMap.get(row.id);

      if (row.system?.componentId) {
        employee.system.components.push({
          id: row.system.componentId,
          name: row.system.componentName,
          description: row.system.componentDescription,
          code: row.system.componentCode,
        });
      }
    }

    const data = Array.from(employeeMap.values());

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(and(...conditions));
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
    const manager = alias(employees, "manager");

    const rows = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        joiningDate: employees.joiningDate,
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

        position: {
          id: positions.id,
          name: positions.name,
        },

        department: {
          id: departments.id,
          name: departments.name,
        },

        manager: {
          id: manager.id,
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
        },

        system: {
          id: systems.id,
          name: systems.name,
          description: systems.description,
          componentId: components.id,
          componentName: components.name,
          componentDescription: components.description,
          componentCode: components.code,
        },
      })
      .from(employees)
      .leftJoin(
        documentGeneration,
        eq(documentGeneration.employeeId, employees.id),
      )
      .leftJoin(positions, eq(positions.id, employees.positionId))
      .leftJoin(departments, eq(departments.id, employees.departmentId))
      .leftJoin(manager, eq(manager.id, employees.managerId))
      .leftJoin(systems, eq(systems.id, employees.systemId))
      .leftJoin(systemComponents, eq(systemComponents.systemId, systems.id))
      .leftJoin(components, eq(components.id, systemComponents.componentId))
      .where(eq(employees.id, id));

    if (!rows.length) {
      request.log.warn(
        {
          action: "GET_EMPLOYEE_BY_ID",
          employeeId: id,
        },
        "Employee not found",
      );

      return reply.code(404).send({
        message: "Employee not found",
      });
    }

    const employeeMap = new Map<string, any>();

    for (const row of rows) {
      if (!employeeMap.has(row.id)) {
        employeeMap.set(row.id, {
          id: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          joiningDate: row.joiningDate,
          userId: row.userId,
          welcome: row.welcome,
          documents: row.documents,
          position: row.position?.id ? row.position : null,
          department: row.department?.id ? row.department : null,
          manager: row.manager?.id ? row.manager : null,
          system: row.system?.id
            ? {
                id: row.system.id,
                name: row.system.name,
                description: row.system.description,
                components: [],
              }
            : null,
        });
      }

      const employee = employeeMap.get(row.id);

      if (row.system?.componentId) {
        employee.system.components.push({
          id: row.system.componentId,
          name: row.system.componentName,
          description: row.system.componentDescription,
          code: row.system.componentCode,
        });
      }
    }

    const result = Array.from(employeeMap.values())[0];

    request.log.info(
      {
        action: "GET_EMPLOYEE_BY_ID",
        employeeId: id,
      },
      "Employee fetched successfully",
    );

    return result;
  } catch (err: any) {
    request.log.error(
      {
        action: "GET_EMPLOYEE_BY_ID",
        employeeId: id,
        err,
      },
      "Unexpected error while fetching employee",
    );

    return reply.code(400).send({
      message: "Unable to fetch employee",
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

      if (!employee) {
        throw new Error("EMPLOYEE_NOT_FOUND");
      }

      if (employee.userId === loggedInUserId) {
        throw new Error("SELF_UPDATE_NOT_ALLOWED");
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

    request.log.info(
      {
        action: "UPDATE_EMPLOYEE",
        employeeId: id,
      },
      "Employee updated successfully",
    );

    return sendMessage(reply, "Employee updated successfully");
  } catch (err: any) {
    const error = err?.cause ?? err;

    if (error?.message === "EMPLOYEE_NOT_FOUND") {
      return reply.code(404).send({
        message: "Employee not found",
      });
    }

    if (error?.message === "SELF_UPDATE_NOT_ALLOWED") {
      return reply.code(403).send({
        message: "You cannot update your own record",
      });
    }

    request.log.error(
      {
        action: "UPDATE_EMPLOYEE",
        employeeId: id,
        err: error,
      },
      "Unexpected error while updating employee",
    );

    return reply.code(400).send({
      message: "Unable to update employee",
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
    const result = await db.transaction(async (tx) => {
      const [employee] = await tx
        .select({
          id: employees.id,
          userId: employees.userId,
          isActive: employees.isActive,
        })
        .from(employees)
        .where(eq(employees.id, id));

      if (!employee) return "NOT_FOUND";

      if (!employee.isActive) return "ALREADY_DELETED";

      if (employee.userId === loggedInUserId) return "SELF_DELETE_NOT_ALLOWED";

      await tx
        .update(employees)
        .set({ isActive: false,systemId: null })
        .where(eq(employees.id, id));

      await tx
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, employee.userId));

      return "SUCCESS";
    });

    if (result === "NOT_FOUND") {
      return reply.code(404).send({
        message: "Employee not found",
      });
    }

    if (result === "ALREADY_DELETED") {
      return reply.code(409).send({
        message: "Employee already deleted",
      });
    }

    if (result === "SELF_DELETE_NOT_ALLOWED") {
      return reply.code(403).send({
        message: "You cannot delete your own record",
      });
    }

    return reply.code(200).send({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    request.log.error(
      {
        action: "DELETE_EMPLOYEE",
        employeeId: id,
        error,
      },
      "Unexpected error during employee deletion",
    );

    return reply.code(400).send({
      message: "Unable to process delete request",
    });
  }
}
