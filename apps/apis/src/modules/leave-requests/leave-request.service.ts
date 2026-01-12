import { eq, desc, asc, and, ilike, sql } from "drizzle-orm";
import { db } from "../../db";
import { employees } from "../../db/schema/employees.schema";
import { leaveRequests } from "../../db/schema/leave-requests.schema";
import { LeaveStatus } from "../../db/schema/leave.enums";

import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
} from "@shared/types/src/leave-request/leave-request.types";

export async function createLeaveRequest(
  userId: string,
  data: CreateLeaveRequestDto
) {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    throw new Error("Employee not found for this user");
  }

  const [leave] = await db
    .insert(leaveRequests)
    .values({
      employeeId: employee.id,
      fromDate: data.fromDate,
      toDate: data.toDate,
      type: data.type,
      dayType: data.dayType,
      reason: data.reason,
      file: data.file,
      status: LeaveStatus.Pending,
    })
    .returning();

  return leave;
}

export async function getMyLeaveRequests(
  userId: string,
  query?: {
    search?: string;
    status?: (typeof LeaveStatus)[keyof typeof LeaveStatus];
    type?: string;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "fromDate";
    sortOrder?: "asc" | "desc";
  }
) {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    throw new Error("Employee not found for this user");
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

export async function getLeaveRequestById(userId: string, leaveId: string) {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    throw new Error("Employee not found");
  }

  const [leave] = await db
    .select()
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.id, leaveId),
        eq(leaveRequests.employeeId, employee.id)
      )
    );

  if (!leave) {
    throw new Error("Leave request not found");
  }

  return leave;
}

export async function updateLeaveRequest(
  userId: string,
  leaveId: string,
  data: UpdateLeaveRequestDto
) {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    throw new Error("Employee not found");
  }

  const [updated] = await db
    .update(leaveRequests)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(leaveRequests.id, leaveId),
        eq(leaveRequests.employeeId, employee.id),
        eq(leaveRequests.status, LeaveStatus.Pending)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Leave not found or cannot be updated");
  }

  return updated;
}

export async function deleteLeaveRequest(userId: string, leaveId: string) {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    throw new Error("Employee not found");
  }

  const [deleted] = await db
    .delete(leaveRequests)
    .where(
      and(
        eq(leaveRequests.id, leaveId),
        eq(leaveRequests.employeeId, employee.id),
        eq(leaveRequests.status, LeaveStatus.Pending)
      )
    )
    .returning({ id: leaveRequests.id });

  if (!deleted) {
    throw new Error("Leave not found or cannot be deleted");
  }

  return deleted;
}
