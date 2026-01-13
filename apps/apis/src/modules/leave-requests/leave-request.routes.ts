import type { FastifyInstance } from "fastify";

import {
  createLeaveRequest,
  getMyLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,
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
    createLeaveRequest
  );

  app.get(
    "/leave-requests/me",
    {
      schema: getMyLeaveRequestsSchema,
      preHandler: authenticate,
    },
    getMyLeaveRequests
  );

  app.get(
    "/leave-requests/:id",
    {
      schema: getLeaveRequestByIdSchema,
      preHandler: authenticate,
    },
    getLeaveRequestById
  );

  app.patch(
    "/leave-requests/:id",
    {
      schema: updateLeaveRequestSchema,
      preHandler: authenticate,
    },
    updateLeaveRequest
  );

  app.delete(
    "/leave-requests/:id",
    {
      schema: deleteLeaveRequestSchema,
      preHandler: authenticate,
    },
    deleteLeaveRequest
  );
}
