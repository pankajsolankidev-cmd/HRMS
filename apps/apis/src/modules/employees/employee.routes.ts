import type { FastifyInstance } from "fastify";

import {
  createEmployeeSchema,
  getEmployeesSchema,
  getEmployeeByIdSchema,
  updateEmployeeSchema,
  deleteEmployeeSchema,
} from "./employee.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";

import {
  createEmployeeHandler,
  deleteEmployeeHandler,
  getEmployeeByIdHandler,
  getEmployeesHandler,
  updateEmployeeHandler,
} from "./employee.service";

import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function employeeRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Employees"],
    },
  };

  app.post(
    "/employees",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EMPLOYEE_CREATE)],
      schema: {
        ...secured.schema,
        ...createEmployeeSchema,
      },
    },
    createEmployeeHandler,
  );

  app.get(
    "/employees",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EMPLOYEE_VIEW)],
      schema: {
        ...secured.schema,
        ...getEmployeesSchema,
      },
    },
    getEmployeesHandler,
  );

  app.get(
    "/employees/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EMPLOYEE_VIEW)],
      schema: {
        ...secured.schema,
        ...getEmployeeByIdSchema,
      },
    },
    getEmployeeByIdHandler,
  );

  app.put(
    "/employees/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EMPLOYEE_UPDATE)],
      schema: {
        ...secured.schema,
        ...updateEmployeeSchema,
      },
    },
    updateEmployeeHandler,
  );

  app.delete(
    "/employees/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EMPLOYEE_DELETE)],
      schema: {
        ...secured.schema,
        ...deleteEmployeeSchema,
      },
    },
    deleteEmployeeHandler,
  );
}
