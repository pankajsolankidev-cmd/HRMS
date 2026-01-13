import type { FastifyInstance } from "fastify";

import {
  createLeaveRequestHandler,
  getMyLeaveRequestsHandler,
  getLeaveRequestByIdHandler,
  updateLeaveRequestHandler,
  deleteLeaveRequestHandler,
} from "./leave-request.service";

import {
  createLeaveRequestSchema,
  getMyLeaveRequestsSchema,
  getLeaveRequestByIdSchema,
  updateLeaveRequestSchema,
  deleteLeaveRequestSchema,
} from "./leave-request.schema";

import { authenticate } from "../../plugins/auth.plugin";

export default async function leaveRequestRoutes(app: FastifyInstance) {
  app.post(
    "/leave-requests",
    {
      schema: createLeaveRequestSchema,
      preHandler: authenticate,
    },
    createLeaveRequestHandler
  );

  app.get(
    "/leave-requests/me",
    {
      schema: getMyLeaveRequestsSchema,
      preHandler: authenticate,
    },
    getMyLeaveRequestsHandler
  );

  app.get(
    "/leave-requests/:id",
    {
      schema: getLeaveRequestByIdSchema,
      preHandler: authenticate,
    },
    getLeaveRequestByIdHandler
  );

  app.patch(
    "/leave-requests/:id",
    {
      schema: updateLeaveRequestSchema,
      preHandler: authenticate,
    },
    updateLeaveRequestHandler
  );

  app.delete(
    "/leave-requests/:id",
    {
      schema: deleteLeaveRequestSchema,
      preHandler: authenticate,
    },
    deleteLeaveRequestHandler
  );
}
