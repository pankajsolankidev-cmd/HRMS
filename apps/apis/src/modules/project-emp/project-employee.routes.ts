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

export default async function projectEmployeeRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/projects/:id/employees",
    {
      ...secured,
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
      schema: {
        ...secured.schema,
        ...removeProjectEmployeeSchema,
      },
    },
    removeEmployeeFromProjectHandler,
  );
}
