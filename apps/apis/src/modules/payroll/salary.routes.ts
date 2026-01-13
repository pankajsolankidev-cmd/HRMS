import type { FastifyInstance } from "fastify";

import {
  createSalary,
  getSalaries,
  getSalaryById,
  getSalaryByEmployee,
  updateSalary,
  deleteSalary,
} from "./salary.service";

import {
  createSalarySchema,
  getAllSalarySchema,
  getSalaryByIdSchema,
  getSalaryByEmployeeSchema,
  updateSalarySchema,
  deleteSalarySchema,
} from "./salary.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export default async function salaryRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Salary"],
    },
  };

  app.post(
    "/salary",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...createSalarySchema,
      },
    },
    createSalary
  );

  app.get(
    "/salary",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getAllSalarySchema,
      },
    },
    getSalaries
  );

  app.get(
    "/salary/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getSalaryByIdSchema,
      },
    },
    getSalaryById
  );

  app.get(
    "/salary/employee/:employeeId",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getSalaryByEmployeeSchema,
      },
    },
    getSalaryByEmployee
  );

  app.put(
    "/salary/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...updateSalarySchema,
      },
    },
    updateSalary
  );

  app.delete(
    "/salary/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...deleteSalarySchema,
      },
    },
    deleteSalary
  );
}
