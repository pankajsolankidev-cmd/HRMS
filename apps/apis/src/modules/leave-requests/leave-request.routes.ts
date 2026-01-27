import type { FastifyInstance } from "fastify";

import {
  createLeaveRequestHandler,
  getMyLeaveRequestsHandler,
  getAllLeaveRequestsHandler,
  getLeaveRequestByIdHandler,
  updateLeaveRequestHandler,
  deleteLeaveRequestHandler,
} from "./leave-request.service";

import {
  createLeaveRequestSchema,
  getMyLeaveRequestsSchema,
  getAllLeaveRequestsSchema,
  getLeaveRequestByIdSchema,
  updateLeaveRequestSchema,
  deleteLeaveRequestSchema,
} from "./leave-request.schema";

import { authenticate } from "../../plugins/auth.plugin";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function leaveRequestRoutes(app: FastifyInstance) {
  app.post(
    "/leave-requests",
    {
      schema: createLeaveRequestSchema,
      preHandler: [authenticate, authorize(PERMISSIONS.LEAVE_CREATE)],
    },
    createLeaveRequestHandler,
  );

  app.get(
    "/leave-requests/me",
    {
      schema: getMyLeaveRequestsSchema,
      preHandler: [authenticate, authorize(PERMISSIONS.LEAVE_VIEW_OWN)],
    },
    getMyLeaveRequestsHandler,
  );

  app.get(
    "/leave-requests",
    {
      schema: getAllLeaveRequestsSchema,
      // preHandler: [authenticate, authorize(PERMISSIONS.LEAVE_VIEW_ALL)],
    },
    getAllLeaveRequestsHandler,
  );

  app.get(
    "/leave-requests/:id",
    {
      schema: getLeaveRequestByIdSchema,
      preHandler: [authenticate, authorize(PERMISSIONS.LEAVE_VIEW_OWN)],
    },
    getLeaveRequestByIdHandler,
  );

  app.patch(
    "/leave-requests/:id",
    {
      schema: updateLeaveRequestSchema,
      preHandler: [authenticate, authorize(PERMISSIONS.LEAVE_UPDATE)],
    },
    updateLeaveRequestHandler,
  );

  app.delete(
    "/leave-requests/:id",
    {
      schema: deleteLeaveRequestSchema,
      preHandler: [authenticate, authorize(PERMISSIONS.LEAVE_DELETE)],
    },
    deleteLeaveRequestHandler,
  );
}
