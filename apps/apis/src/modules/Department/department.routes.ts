import type { FastifyInstance } from "fastify";

import {
  createDepartmentHandler,
  getDepartmentsHandler,
  getDepartmentByIdHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
} from "./department.service";

import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentByIdSchema,
  getDepartmentsSchema,
} from "./department.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export default async function departmentRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/departments",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...createDepartmentSchema,
      },
    },
    createDepartmentHandler,
  );

  app.get(
    "/departments",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getDepartmentsSchema,
      },
    },
    getDepartmentsHandler,
  );

  app.get(
    "/departments/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getDepartmentByIdSchema,
      },
    },
    getDepartmentByIdHandler,
  );

  app.put(
    "/departments/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...updateDepartmentSchema,
      },
    },
    updateDepartmentHandler,
  );

  app.delete(
    "/departments/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        tags: ["Departments"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    deleteDepartmentHandler,
  );
}
