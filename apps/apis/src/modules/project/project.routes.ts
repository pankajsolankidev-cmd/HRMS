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

export default async function projectRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/projects",
    {
      ...secured,
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
      schema: {
        ...secured.schema,
        ...updateProjectSchema,
      },
    },
    updateProjectHandler,
  );

 
}
