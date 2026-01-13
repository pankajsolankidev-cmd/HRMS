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
import { LeaveStatus } from "../../db/schema/leave.enums";
import { sendMessage } from "../../utils/api-response";

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

      await createLeaveRequest(userId, body);

      return sendMessage(reply, "Leave request created successfully", 201);
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

      const query = request.query as {
        search?: string;
        status?: (typeof LeaveStatus)[keyof typeof LeaveStatus];
        type?: string;
        page?: number;
        limit?: number;
        sortBy?: "createdAt" | "fromDate";
        sortOrder?: "asc" | "desc";
      };

      const result = await getMyLeaveRequests(userId, query);

      return reply.send(result);
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
      if (!updated) {
        return reply.code(404).send({ message: "Leave request not found" });
      }

      return sendMessage(reply, "Leave request updated successfully");
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

      const deleted = await deleteLeaveRequest(userId, id);
      if (!deleted) {
        return reply.code(404).send({ message: "Leave request not found" });
      }

      return sendMessage(reply, "Leave request deleted successfully");
    }
  );
}
