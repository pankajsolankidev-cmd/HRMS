import type { FastifyInstance } from "fastify";

import {
  assignEmployeesToProjectHandler,
  getProjectEmployeesHandler,
  removeEmployeeFromProjectHandler,
} from "./project-employee.service";

import {
  assignProjectEmployeesSchema,
  getProjectEmployeesSchema,
  removeProjectEmployeeSchema,
} from "./project-employee.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function projectEmployeeRoutes(app: FastifyInstance) {
  const secured = {
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Project Assignments"],
    },
  };

  app.post(
    "/projects/:id/employees",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PROJECT_ASSIGN)],
      schema: {
        ...secured.schema,
        ...assignProjectEmployeesSchema,
      },
    },
    assignEmployeesToProjectHandler,
  );

  app.get(
    "/projects/:id/employees",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PROJECT_VIEW)],
      schema: {
        ...secured.schema,
        ...getProjectEmployeesSchema,
      },
    },
    getProjectEmployeesHandler,
  );

  app.delete(
    "/projects/:id/employees/:employeeId",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PROJECT_ASSIGN)],
      schema: {
        ...secured.schema,
        ...removeProjectEmployeeSchema,
      },
    },
    removeEmployeeFromProjectHandler,
  );
}
