import type { FastifyInstance } from "fastify";

import {
  createSalaryHandler,
  getSalariesHandler,
  getSalaryByIdHandler,
  getSalaryByEmployeeHandler,
  updateSalaryHandler,
  deleteSalaryHandler,
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
    createSalaryHandler
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
    getSalariesHandler
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
    getSalaryByIdHandler
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
    getSalaryByEmployeeHandler
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
    updateSalaryHandler
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
    deleteSalaryHandler
  );
}
