import type { FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "../../db";
import {
  components,
  departments,
  documentGeneration,
  employees,
  systemComponents,
  systems,
  users,
  organization,
} from "../../db/schema";
import { positions } from "../../db/schema/positions.schema";

export async function getProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = (request.user as any)?.id;

  request.log.info(
    { action: "GET_PROFILE", userId },
    "Get profile request received",
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
      .from(users)
      .leftJoin(employees, eq(employees.userId, users.id))
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
      .where(eq(users.id, userId));

    const org = await db.query.organization.findFirst();

    if (!rows.length) {
      return reply.code(404).send({ message: "Profile not found" });
    }

    const employeeMap = new Map<string, any>();

    for (const row of rows) {
      if (!row.id) continue;

      if (!employeeMap.has(row.id)) {
        employeeMap.set(row.id, {
          employee: {
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
          },
        });
      }

      const profile = employeeMap.get(row.id);

      if (row.system?.componentId) {
        profile.employee.system.components.push({
          id: row.system.componentId,
          name: row.system.componentName,
          description: row.system.componentDescription,
          code: row.system.componentCode,
        });
      }
    }

    return {
      organization: org ?? null,
      profile: Array.from(employeeMap.values())[0],
    };
  } catch (err) {
    request.log.error(
      { action: "GET_PROFILE", userId, err },
      "Failed to fetch profile",
    );

    return reply.code(500).send({ message: "Internal server error" });
  }
}
