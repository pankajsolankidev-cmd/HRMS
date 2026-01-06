import { eq, desc, and } from "drizzle-orm";
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

export async function getMyLeaveRequests(userId: string) {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    throw new Error("Employee not found for this user");
  }

  return db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.employeeId, employee.id))
    .orderBy(desc(leaveRequests.createdAt));
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
