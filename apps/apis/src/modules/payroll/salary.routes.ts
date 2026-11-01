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
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function salaryRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Salary"],
    },
  };

  app.post(
    "/salary",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SALARY_CREATE)],
      schema: {
        ...secured.schema,
        ...createSalarySchema,
      },
    },
    createSalaryHandler,
  );

  app.get(
    "/salary",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SALARY_VIEW)],
      schema: {
        ...secured.schema,
        ...getAllSalarySchema,
      },
    },
    getSalariesHandler,
  );

  app.get(
    "/salary/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SALARY_VIEW)],
      schema: {
        ...secured.schema,
        ...getSalaryByIdSchema,
      },
    },
    getSalaryByIdHandler,
  );

  app.get(
    "/salary/employee/:employeeId",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SALARY_VIEW)],
      schema: {
        ...secured.schema,
        ...getSalaryByEmployeeSchema,
      },
    },
    getSalaryByEmployeeHandler,
  );

  app.put(
    "/salary/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SALARY_UPDATE)],
      schema: {
        ...secured.schema,
        ...updateSalarySchema,
      },
    },
    updateSalaryHandler,
  );

  app.delete(
    "/salary/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SALARY_DELETE)],
      schema: {
        ...secured.schema,
        ...deleteSalarySchema,
      },
    },
    deleteSalaryHandler,
  );
}
