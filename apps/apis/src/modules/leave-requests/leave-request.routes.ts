import type { FastifyInstance } from "fastify";

import {
  createLeaveRequestHandler,
  getAllLeaveRequestsHandler,
  getLeaveRequestByIdHandler,
  updateLeaveRequestHandler,
  deleteLeaveRequestHandler,
  approveLeaveRequestHandler,
  rejectLeaveRequestHandler,
} from "./leave-request.service";

import {
  createLeaveRequestSchema,
  getAllLeaveRequestsSchema,
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
      preHandler: [authenticate],
    },
    createLeaveRequestHandler,
  );

  app.get(
    "/leave-requests",
    {
      schema: getAllLeaveRequestsSchema,
      preHandler: [authenticate],
    },
    getAllLeaveRequestsHandler,
  );

  app.get(
    "/leave-requests/:id",
    {
      schema: getLeaveRequestByIdSchema,
      preHandler: [authenticate],
    },
    getLeaveRequestByIdHandler,
  );

  app.patch(
    "/leave-requests/:id",
    {
      schema: updateLeaveRequestSchema,
      preHandler: [authenticate],
    },
    updateLeaveRequestHandler,
  );

  app.delete(
    "/leave-requests/:id",
    {
      schema: deleteLeaveRequestSchema,
      preHandler: [authenticate],
    },
    deleteLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/:id/approve",
    { preHandler: [authenticate] },
    approveLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/:id/reject",
    { preHandler: [authenticate] },
    rejectLeaveRequestHandler,
  );
}
