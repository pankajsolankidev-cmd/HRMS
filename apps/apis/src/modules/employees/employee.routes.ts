import type { FastifyInstance } from "fastify";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "./employee.service";

import {
  createEmployeeSchema,
  getEmployeesSchema,
  getEmployeeByIdSchema,
  updateEmployeeSchema,
  deleteEmployeeSchema,
} from "./employee.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

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
    createEmployee
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
    getEmployees
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
    getEmployeeById
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
    updateEmployee
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
    deleteEmployee
  );
}
