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
  getManualLeaveRequestByIdHandler,
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
  getManualLeaveRequestByIdSchema,
} from "./leave-request.schema";
import { verify } from "crypto";
import { verifyAccessToken } from "../../middlewares/auth.middlewares";


export default async function leaveRequestRoutes(app: FastifyInstance) {
  app.post(
    "/leave-requests",
    {
      schema: createLeaveRequestSchema,
      preHandler: [verifyAccessToken],
    },
    createLeaveRequestHandler,
  );

  app.get(
    "/leave-requests",
    {
      schema: getAllLeaveRequestsSchema,
      preHandler: [verifyAccessToken],
    },
    getAllLeaveRequestsHandler,
  );

  app.get(
    "/leave-requests/:id",
    {
      schema: getLeaveRequestByIdSchema,
      preHandler: [verifyAccessToken],
    },
    getLeaveRequestByIdHandler,
  );

  app.patch(
    "/leave-requests/:id",
    {
      schema: updateLeaveRequestSchema,
      preHandler: [verifyAccessToken],
    },
    updateLeaveRequestHandler,
  );

  app.delete(
    "/leave-requests/:id",
    {
      schema: deleteLeaveRequestSchema,
      preHandler: [verifyAccessToken],
    },
    deleteLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/:id/approve",
    {
      schema: approveLeaveRequestSchema,
      preHandler: [verifyAccessToken],
    },
    approveLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/:id/reject",
    {
      schema: rejectLeaveRequestSchema,
      preHandler: [verifyAccessToken],
    },
    rejectLeaveRequestHandler,
  );

  app.post(
    "/leave-requests/manual",
    {
      schema: createManualLeaveRequestSchema,
      preHandler: [verifyAccessToken],
    },
    createManualLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/manual/:id",
    {
      schema: updateManualLeaveRequestSchema,
      preHandler: [verifyAccessToken],
    },
    updateManualLeaveRequestHandler,
  );

  app.delete(
    "/leave-requests/manual/:id",
    {
      schema: deleteManualLeaveRequestSchema,
      preHandler: [verifyAccessToken],
    },
    deleteManualLeaveRequestHandler,
  );
  app.get(
    "/leave-requests/manual/:id",
    {
      schema: getManualLeaveRequestByIdSchema,
      preHandler: [verifyAccessToken],
    },
    getManualLeaveRequestByIdHandler,
  );
}
