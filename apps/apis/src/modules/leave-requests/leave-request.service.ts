import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, desc, asc, and, ilike, sql, gte } from "drizzle-orm";

import { db } from "../../db";
import { employees } from "../../db/schema/employees.schema";
import { leaveRequests } from "../../db/schema/leave-requests.schema";
import { LeaveStatus } from "../../db/schema/leave.enums";

import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
} from "@shared/types/src/leave-request/leave-request.types";

import { sendMessage } from "../../utils/api-response";

function validateFutureDates(fromDate: string, toDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (from < today) {
    throw new Error("From date must be today or a future date");
  }

  if (to < from) {
    throw new Error("To date cannot be before from date");
  }
}

export async function createLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const body = request.body as CreateLeaveRequestDto;

  validateFutureDates(body.fromDate, body.toDate);

  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    return reply.code(404).send({ message: "Employee not found" });
  }

  await db.insert(leaveRequests).values({
    employeeId: employee.id,
    fromDate: body.fromDate,
    toDate: body.toDate,
    type: body.type,
    dayType: body.dayType,
    reason: body.reason,
    file: body.file,
    status: LeaveStatus.Pending,
  });

  return sendMessage(reply, "Leave request created successfully", 201);
}

export async function getMyLeaveRequestsHandler(request: FastifyRequest) {
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

  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    throw new Error("Employee not found");
  }

  const conditions = [eq(leaveRequests.employeeId, employee.id)];

  if (query?.search) {
    conditions.push(ilike(leaveRequests.reason, `%${query.search}%`));
  }

  if (query?.status) {
    conditions.push(eq(leaveRequests.status, query.status));
  }

  if (query?.type) {
    conditions.push(eq(leaveRequests.type, query.type as any));
  }

  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(50, Number(query?.limit) || 10);
  const offset = (page - 1) * limit;

  const sortColumn =
    query?.sortBy === "fromDate"
      ? leaveRequests.fromDate
      : leaveRequests.createdAt;

  const order = query?.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const data = await db
    .select()
    .from(leaveRequests)
    .where(and(...conditions))
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(and(...conditions));

  return {
    data,
    meta: {
      page,
      limit,
      total: Number(count),
    },
  };
}

export async function getAllLeaveRequestsHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    status?: (typeof LeaveStatus)[keyof typeof LeaveStatus];
    type?: string;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "fromDate";
    sortOrder?: "asc" | "desc";
  };

  const conditions = [];

  if (query?.search) {
    conditions.push(ilike(leaveRequests.reason, `%${query.search}%`));
  }

  if (query?.status) {
    conditions.push(eq(leaveRequests.status, query.status));
  }

  if (query?.type) {
    conditions.push(eq(leaveRequests.type, query.type as any));
  }

  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(50, Number(query?.limit) || 10);
  const offset = (page - 1) * limit;

  const sortColumn =
    query?.sortBy === "fromDate"
      ? leaveRequests.fromDate
      : leaveRequests.createdAt;

  const order = query?.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const data = await db
    .select()
    .from(leaveRequests)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(conditions.length ? and(...conditions) : undefined);

  return {
    data,
    meta: {
      page,
      limit,
      total: Number(count),
    },
  };
}

export async function getLeaveRequestByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    return reply.code(404).send({ message: "Employee not found" });
  }

  const [leave] = await db
    .select()
    .from(leaveRequests)
    .where(
      and(eq(leaveRequests.id, id), eq(leaveRequests.employeeId, employee.id)),
    );

  if (!leave) {
    return reply.code(404).send({ message: "Leave request not found" });
  }

  return { data: leave };
}

export async function updateLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = request.body as UpdateLeaveRequestDto;

  if (body.fromDate && body.toDate) {
    validateFutureDates(body.fromDate, body.toDate);
  }

  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    return reply.code(404).send({ message: "Employee not found" });
  }

  const [updated] = await db
    .update(leaveRequests)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.employeeId, employee.id),
        eq(leaveRequests.status, LeaveStatus.Pending),
      ),
    )
    .returning();

  if (!updated) {
    return reply
      .code(404)
      .send({ message: "Leave not found or cannot be updated" });
  }

  return sendMessage(reply, "Leave request updated successfully");
}

export async function deleteLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    return reply.code(404).send({ message: "Employee not found" });
  }

  const [deleted] = await db
    .delete(leaveRequests)
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.employeeId, employee.id),
        eq(leaveRequests.status, LeaveStatus.Pending),
      ),
    )
    .returning({ id: leaveRequests.id });

  if (!deleted) {
    return reply
      .code(404)
      .send({ message: "Leave not found or cannot be deleted" });
  }

  return sendMessage(reply, "Leave request deleted successfully");
}
