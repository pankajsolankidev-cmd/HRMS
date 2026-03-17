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

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function leaveRequestRoutes(app: FastifyInstance) {
  const secured = {
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Leave Requests"],
    },
  };

  app.post(
    "/leave-requests",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.LEAVE_CREATE)],
      schema: { ...secured.schema, ...createLeaveRequestSchema },
    },
    createLeaveRequestHandler,
  );

  app.get(
    "/leave-requests",
    {
      ...secured,
      preHandler: [verifyAccessToken],
      schema: { ...secured.schema, ...getAllLeaveRequestsSchema },
    },
    getAllLeaveRequestsHandler,
  );

  app.get(
    "/leave-requests/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken],
      schema: { ...secured.schema, ...getLeaveRequestByIdSchema },
    },
    getLeaveRequestByIdHandler,
  );

  app.patch(
    "/leave-requests/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken],
      schema: { ...secured.schema, ...updateLeaveRequestSchema },
    },
    updateLeaveRequestHandler,
  );

  app.delete(
    "/leave-requests/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken],
      schema: { ...secured.schema, ...deleteLeaveRequestSchema },
    },
    deleteLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/:id/approve",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.LEAVE_APPROVE)],
      schema: { ...secured.schema, ...approveLeaveRequestSchema },
    },
    approveLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/:id/reject",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.LEAVE_APPROVE)],
      schema: { ...secured.schema, ...rejectLeaveRequestSchema },
    },
    rejectLeaveRequestHandler,
  );

  app.post(
    "/leave-requests/manual",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.LEAVE_UPDATE_ALL)],
      schema: { ...secured.schema, ...createManualLeaveRequestSchema },
    },
    createManualLeaveRequestHandler,
  );

  app.patch(
    "/leave-requests/manual/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.LEAVE_UPDATE_ALL)],
      schema: { ...secured.schema, ...updateManualLeaveRequestSchema },
    },
    updateManualLeaveRequestHandler,
  );

  app.delete(
    "/leave-requests/manual/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.LEAVE_DELETE_ALL)],
      schema: { ...secured.schema, ...deleteManualLeaveRequestSchema },
    },
    deleteManualLeaveRequestHandler,
  );

  app.get(
    "/leave-requests/manual/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.LEAVE_VIEW_ALL)],
      schema: { ...secured.schema, ...getManualLeaveRequestByIdSchema },
    },
    getManualLeaveRequestByIdHandler,
  );
}
