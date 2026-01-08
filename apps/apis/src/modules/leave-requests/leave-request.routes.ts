import { FastifyInstance } from "fastify";
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
import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
} from "@shared/types/src/leave-request/leave-request.types";
import { authenticate } from "../../plugins/auth.plugin";

export default async function leaveRequestRoutes(app: FastifyInstance) {
  app.post(
    "/leave-requests",
    {
      schema: createLeaveRequestSchema,
      preHandler: authenticate,
    },
    async (request, reply) => {
      const userId = request.user!.id;
      const body = request.body as CreateLeaveRequestDto;

      const leave = await createLeaveRequest(userId, body);

      return reply.status(201).send({
        message: "Leave request created successfully",
        data: leave,
      });
    }
  );

  app.get(
    "/leave-requests/me",
    {
      schema: getMyLeaveRequestsSchema,
      preHandler: authenticate,
    },
    async (request, reply) => {
      const userId = request.user!.id;

      const leaves = await getMyLeaveRequests(userId);

      return reply.send({ data: leaves });
    }
  );

  app.get(
    "/leave-requests/:id",
    {
      schema: getLeaveRequestByIdSchema,
      preHandler: authenticate,
    },
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params as { id: string };

      const leave = await getLeaveRequestById(userId, id);

      return reply.send({ data: leave });
    }
  );

  app.patch(
    "/leave-requests/:id",
    {
      schema: updateLeaveRequestSchema,
      preHandler: authenticate,
    },
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params as { id: string };
      const body = request.body as UpdateLeaveRequestDto;

      const updated = await updateLeaveRequest(userId, id, body);

      return reply.send({
        message: "Leave request updated successfully",
        data: updated,
      });
    }
  );

  app.delete(
    "/leave-requests/:id",
    {
      schema: deleteLeaveRequestSchema,
      preHandler: authenticate,
    },
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params as { id: string };

      await deleteLeaveRequest(userId, id);

      return reply.send({
        message: "Leave request deleted successfully",
      });
    }
  );
}
