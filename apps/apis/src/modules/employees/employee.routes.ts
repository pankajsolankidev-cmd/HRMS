import type { FastifyInstance } from "fastify";

import {
  createEmployeeSchema,
  getEmployeesSchema,
  getEmployeeByIdSchema,
  updateEmployeeSchema,
  deleteEmployeeSchema,
} from "./employee.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import {
  createEmployeeHandler,
  deleteEmployeeHandler,
  getEmployeeByIdHandler,
  getEmployeesHandler,
  updateEmployeeHandler,
} from "./employee.service";

export default async function employeeRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Employees"],
    },
  };

  app.post(
    "/employees",
    {
      ...secured,
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
      schema: {
        ...secured.schema,
        ...deleteEmployeeSchema,
      },
    },
    deleteEmployeeHandler,
  );
}
