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
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function departmentRoutes(app: FastifyInstance) {
  const secured = {
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/departments",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.DEPARTMENT_CREATE)],
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
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.DEPARTMENT_VIEW)],
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
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.DEPARTMENT_VIEW)],
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
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.DEPARTMENT_UPDATE)],
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
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.DEPARTMENT_DELETE)],
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
