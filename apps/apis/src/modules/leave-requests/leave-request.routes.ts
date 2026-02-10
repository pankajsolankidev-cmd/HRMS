import type { FastifyInstance } from "fastify";

import {
  createLeaveRequestHandler,
  getAllLeaveRequestsHandler,
  getLeaveRequestByIdHandler,
  updateLeaveRequestHandler,
  deleteLeaveRequestHandler,
  approveLeaveRequestHandler,
  rejectLeaveRequestHandler,
  createManualLeaveRequestHandler,
  updateManualLeaveRequestHandler,
  deleteManualLeaveRequestHandler,
} from "./leave-request.service";

import {
  createLeaveRequestSchema,
  getAllLeaveRequestsSchema,
  getLeaveRequestByIdSchema,
  updateLeaveRequestSchema,
  deleteLeaveRequestSchema,
  createManualLeaveRequestSchema,
  rejectLeaveRequestSchema,
  approveLeaveRequestSchema,
  updateManualLeaveRequestSchema,
  deleteManualLeaveRequestSchema,
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
    {
      schema: approveLeaveRequestSchema,
      preHandler: [authenticate],
    },
    approveLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/:id/reject",
    {
      schema: rejectLeaveRequestSchema,
      preHandler: [authenticate],
    },
    rejectLeaveRequestHandler,
  );

  app.post(
    "/leave-requests/manual",
    {
      schema: createManualLeaveRequestSchema,
      preHandler: [authenticate],
    },
    createManualLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/manual/:id",
    {
      schema: updateManualLeaveRequestSchema,
      preHandler: [authenticate],
    },
    updateManualLeaveRequestHandler,
  );

  app.delete(
    "/leave-requests/manual/:id",
    {
      schema: deleteManualLeaveRequestSchema,
      preHandler: [authenticate],
    },
    deleteManualLeaveRequestHandler,
  );
}
