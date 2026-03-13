import type { FastifyInstance } from "fastify";

import {
  createProjectHandler,
  getProjectByIdHandler,
  getProjectsHandler,
  updateProjectHandler,
} from "./project.service";

import {
  createProjectSchema,
  updateProjectSchema,
  getProjectByIdSchema,
  getProjectsSchema,
} from "./project.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function projectRoutes(app: FastifyInstance) {
  const secured = {
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Projects"],
    },
  };

  app.post(
    "/projects",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PROJECT_CREATE)],
      schema: {
        ...secured.schema,
        ...createProjectSchema,
      },
    },
    createProjectHandler,
  );

  app.get(
    "/projects",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PROJECT_VIEW)],
      schema: {
        ...secured.schema,
        ...getProjectsSchema,
      },
    },
    getProjectsHandler,
  );

  app.get(
    "/projects/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PROJECT_VIEW)],
      schema: {
        ...secured.schema,
        ...getProjectByIdSchema,
      },
    },
    getProjectByIdHandler,
  );

  app.put(
    "/projects/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PROJECT_UPDATE)],
      schema: {
        ...secured.schema,
        ...updateProjectSchema,
      },
    },
    updateProjectHandler,
  );
}
