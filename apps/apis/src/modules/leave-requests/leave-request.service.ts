import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, desc, asc, and, ilike, sql } from "drizzle-orm";
import { db } from "../../db";
import { employees } from "../../db/schema/employees.schema";
import { leaveRequests } from "../../db/schema/leave-requests.schema";
import { positions } from "../../db/schema/positions.schema";
import { LeaveStatus } from "../../db/schema/leave.enums";
import { userRoles } from "../../db/schema/user-roles.schema";
import { roles } from "../../db/schema/roles.schema";
import { alias } from "drizzle-orm/pg-core";
const approverEmployee = alias(employees, "approverEmployee");
const rejecterEmployee = alias(employees, "rejecterEmployee");
const createdByEmployee = alias(employees, "createdByEmployee");

import {
  CreateLeaveRequestDto,
  UpdateLeaveRequestDto,
  CreateManualLeaveRequestDto,
} from "@shared/types/src/leave-request/leave-request.types";

import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";
import { hasAnyRole, hasRole } from "../../utils/role.utils";
import { calculateLeaveTotalsSimple } from "./utils/leave-calculation";
import { validatePastDatesOnly } from "./utils/past-date-validation";

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

  const { totalHours, totalDays } = calculateLeaveTotalsSimple({
    fromDate: body.fromDate,
    toDate: body.toDate,
    dayType: body.dayType,
    fromHour: body.fromHour,
    toHour: body.toHour,
  });

  await db.insert(leaveRequests).values({
    employeeId: employee.id,
    createdBy: userId,
    fromDate: body.fromDate,
    toDate: body.toDate,
    type: body.type,
    dayType: body.dayType,

    fromHour: body.fromHour,
    toHour: body.toHour,

    totalHours,
    totalDays: totalDays.toString(),

    reason: body.reason,
    file: body.file,
    status: LeaveStatus.Pending,
  });

  return sendMessage(reply, "Leave request created successfully", 201);
}

export async function getAllLeaveRequestsHandler(request: FastifyRequest) {
  const userId = request.user!.id;

  const query = request.query as {
    search?: string;
    status?: (typeof LeaveStatus)[keyof typeof LeaveStatus];
    type?: string;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "fromDate";
    sortOrder?: "asc" | "desc";
    createdByType?: "all" | "manual" | "self";
  };

  const conditions = [];

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isHRorAdmin = hasAnyRole(roleNames, ["HR", "ADMIN"]);

  const [employee] = await db
    .select({ id: employees.id, userId: employees.userId })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!isHRorAdmin) {
    if (!employee) {
      return {
        data: [],
        meta: { page: 1, limit: null, total: 0 },
      };
    }
    conditions.push(eq(leaveRequests.employeeId, employee.id));
  }

  if (isHRorAdmin && query.createdByType) {
    if (query.createdByType === "manual") {
      conditions.push(eq(leaveRequests.createdBy, userId));
    }

    if (query.createdByType === "self" && employee) {
      conditions.push(
        and(
          eq(leaveRequests.createdBy, userId),
          eq(leaveRequests.employeeId, employee.id),
        ),
      );
    }
  }

  if (query?.search) {
    conditions.push(ilike(leaveRequests.reason, `%${query.search}%`));
  }

  if (query?.status) {
    conditions.push(eq(leaveRequests.status, query.status));
  }

  if (query?.type) {
    conditions.push(eq(leaveRequests.type, query.type as any));
  }

  const { page, limit, offset } = getPagination(query);

  const orderByClauses = [];

  if (!query?.sortBy) {
    orderByClauses.push(desc(leaveRequests.updatedAt));
  } else {
    orderByClauses.push(
      query.sortOrder === "asc"
        ? asc(leaveRequests[query.sortBy])
        : desc(leaveRequests[query.sortBy]),
    );
  }

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(conditions.length ? and(...conditions) : undefined);

  let queryBuilder = db
    .select({
      leave: leaveRequests,
      employee: {
        id: employees.id,
        userId: employees.userId,
        firstName: employees.firstName,
        lastName: employees.lastName,
      },
      createdByEmployee: {
        id: createdByEmployee.id,
        userId: createdByEmployee.userId,
        firstName: createdByEmployee.firstName,
        lastName: createdByEmployee.lastName,
      },
      approvedByUser: {
        id: approverEmployee.id,
        firstName: approverEmployee.firstName,
        lastName: approverEmployee.lastName,
      },
      rejectedByUser: {
        id: rejecterEmployee.id,
        firstName: rejecterEmployee.firstName,
        lastName: rejecterEmployee.lastName,
      },
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .leftJoin(
      approverEmployee,
      eq(leaveRequests.approvedBy, approverEmployee.userId),
    )
    .leftJoin(
      rejecterEmployee,
      eq(leaveRequests.rejectedBy, rejecterEmployee.userId),
    )
    .leftJoin(
      createdByEmployee,
      eq(leaveRequests.createdBy, createdByEmployee.userId),
    )

    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderByClauses)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  return {
    data,
    meta: {
      page,
      limit: limit ?? null,
      total: countResult?.count ?? 0,
    },
  };
}

export async function getLeaveRequestByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  const userRolesRows = await db
    .select({
      roleName: roles.name,
    })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isHRorAdmin = hasAnyRole(roleNames, ["HR", "ADMIN"]);

  const conditions = [eq(leaveRequests.id, id)];

  if (!isHRorAdmin) {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, userId));

    if (!employee) {
      return {
        data: [],
        meta: { page: 1, limit: 10, total: 0 },
      };
    }

    conditions.push(eq(leaveRequests.employeeId, employee.id));
  }

  const [row] = await db
    .select({
      leave: leaveRequests,
      employee: {
        id: employees.id,
        userId: employees.userId,
        firstName: employees.firstName,
        lastName: employees.lastName,
      },
      createdByEmployee: {
        id: createdByEmployee.id,
        userId: createdByEmployee.userId,
        firstName: createdByEmployee.firstName,
        lastName: createdByEmployee.lastName,
      },

      approvedByUser: {
        id: approverEmployee.id,
        firstName: approverEmployee.firstName,
        lastName: approverEmployee.lastName,
      },

      rejectedByUser: {
        id: rejecterEmployee.id,
        firstName: rejecterEmployee.firstName,
        lastName: rejecterEmployee.lastName,
      },
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .leftJoin(
      approverEmployee,
      eq(leaveRequests.approvedBy, approverEmployee.userId),
    )
    .leftJoin(
      rejecterEmployee,
      eq(leaveRequests.rejectedBy, rejecterEmployee.userId),
    )
    .leftJoin(
      createdByEmployee,
      eq(leaveRequests.createdBy, createdByEmployee.userId),
    )

    .where(and(...conditions));

  if (!row) {
    return reply.code(404).send({ message: "Leave request not found" });
  }

  return {
    data: row,
  };
}

export async function updateLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = request.body as UpdateLeaveRequestDto;

  const [employeeWithPosition] = await db
    .select({
      employeeId: employees.id,
      positionName: positions.name,
    })
    .from(employees)
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(eq(employees.userId, userId));

  if (!employeeWithPosition) {
    return reply.code(403).send({ message: "Employee not found" });
  }

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isHRorAdmin = hasAnyRole(roleNames, ["HR", "ADMIN"]);

  const conditions = [
    eq(leaveRequests.id, id),
    eq(leaveRequests.status, LeaveStatus.Pending),
  ];

  if (!isHRorAdmin) {
    conditions.push(
      eq(leaveRequests.employeeId, employeeWithPosition.employeeId),
    );
  }

  const [existingLeave] = await db
    .select()
    .from(leaveRequests)
    .where(and(...conditions));

  if (!existingLeave) {
    return reply.code(404).send({
      message: "Leave not found, not authorized, or not Pending",
    });
  }

  const finalFromDate = body.fromDate ?? existingLeave.fromDate;
  const finalToDate = body.toDate ?? existingLeave.toDate;
  const finalDayType = body.dayType ?? existingLeave.dayType;
  const finalFromHour = body.fromHour ?? existingLeave.fromHour;
  const finalToHour = body.toHour ?? existingLeave.toHour;

  if (body.fromDate || body.toDate) {
    validateFutureDates(finalFromDate, finalToDate);
  }

  const { totalHours, totalDays } = calculateLeaveTotalsSimple({
    fromDate: finalFromDate,
    toDate: finalToDate,
    dayType: finalDayType,
    fromHour: finalFromHour,
    toHour: finalToHour,
  });

  const [updated] = await db
    .update(leaveRequests)
    .set({
      ...body,

      fromDate: finalFromDate,
      toDate: finalToDate,
      dayType: finalDayType,
      fromHour: finalFromHour,
      toHour: finalToHour,

      totalHours,
      totalDays: totalDays.toString(),
    })
    .where(and(...conditions))
    .returning();

  if (!updated) {
    return reply.code(404).send({
      message: "Leave not found, not authorized, or status is not Pending",
    });
  }

  return sendMessage(reply, "Leave request updated successfully");
}

export async function deleteLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  const [employeeWithPosition] = await db
    .select({
      employeeId: employees.id,
      positionName: positions.name,
    })
    .from(employees)
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(eq(employees.userId, userId));

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isHRorAdmin = hasAnyRole(roleNames, ["HR", "ADMIN"]);

  const conditions = [
    eq(leaveRequests.id, id),
    eq(leaveRequests.status, LeaveStatus.Pending),
  ];

  if (!isHRorAdmin) {
    if (!employeeWithPosition?.employeeId) {
      return reply.code(403).send({
        message: "Employee record not found for this user",
      });
    }

    conditions.push(
      eq(leaveRequests.employeeId, employeeWithPosition.employeeId),
    );
  }

  const [deleted] = await db
    .delete(leaveRequests)
    .where(and(...conditions))
    .returning({ id: leaveRequests.id });

  if (!deleted) {
    return reply.code(404).send({
      message: "Leave not found, not authorized, or status is not Pending",
    });
  }

  return sendMessage(reply, "Leave request deleted successfully");
}

export async function approveLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  const approverRolesRows = await db
    .select({
      roleName: roles.name,
    })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const approverRoleNames = approverRolesRows.map((r) => r.roleName);

  const cleanedApproverRoles = approverRoleNames.filter(
    (role): role is string => role !== null,
  );

  const isApproverAdmin = hasRole(cleanedApproverRoles, "ADMIN");
  const isApproverHR = hasRole(cleanedApproverRoles, "HR");

  const leaveRows = await db
    .select({
      leaveId: leaveRequests.id,
      leaveStatus: leaveRequests.status,
      targetEmployeeId: employees.id,
      targetUserId: employees.userId,
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(eq(leaveRequests.id, id));

  const leaveRow = leaveRows[0];
  if (leaveRow.targetUserId === userId) {
    return reply.code(403).send({
      message: "You cannot approve your own leave request",
    });
  }

  if (!leaveRow) {
    return reply.code(404).send({ message: "Leave request not found" });
  }

  if (!leaveRow.targetUserId) {
    return reply.code(500).send({
      message: "Invalid leave request: target user not found",
    });
  }

  const targetRolesRows = await db
    .select({
      roleName: roles.name,
    })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, leaveRow.targetUserId));

  const targetRoleNames = targetRolesRows.map((r) => r.roleName);

  const isTargetHR = targetRoleNames.includes("HR");

  if (isTargetHR && !isApproverAdmin) {
    return reply.code(403).send({
      message: "HR leave can only be approved by Admin",
    });
  }

  if (!isApproverAdmin && !isApproverHR) {
    return reply.code(403).send({
      message: "Only HR or Admin can approve leave requests",
    });
  }

  const [updated] = await db
    .update(leaveRequests)
    .set({
      status: LeaveStatus.Approved,
      approvedBy: userId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.status, LeaveStatus.Pending),
      ),
    )
    .returning();

  if (!updated) {
    return reply.code(404).send({
      message: "Leave not found or already processed",
    });
  }

  return sendMessage(reply, "Leave request approved successfully");
}

export async function rejectLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = request.body as { rejectionReason?: string };

  const approverRolesRows = await db
    .select({
      roleName: roles.name,
    })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const approverRoleNames = approverRolesRows.map((r) =>
    r.roleName?.toUpperCase(),
  );

  const cleanedApproverRoles = approverRoleNames.filter(
    (role): role is string => role !== null,
  );

  const isApproverAdmin = hasRole(cleanedApproverRoles, "ADMIN");
  const isApproverHR = hasRole(cleanedApproverRoles, "HR");

  const leaveRows = await db
    .select({
      leaveId: leaveRequests.id,
      leaveStatus: leaveRequests.status,
      targetEmployeeId: employees.id,
      targetUserId: employees.userId,
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(eq(leaveRequests.id, id));

  const leaveRow = leaveRows[0];

  if (!leaveRow) {
    return reply.code(404).send({ message: "Leave request not found" });
  }

  if (!leaveRow.targetUserId) {
    return reply.code(500).send({
      message: "Invalid leave request: target user not found",
    });
  }

  if (leaveRow.targetUserId === userId) {
    return reply.code(403).send({
      message: "You cannot reject your own leave request",
    });
  }

  const targetRolesRows = await db
    .select({
      roleName: roles.name,
    })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, leaveRow.targetUserId));

  const targetRoleNames = targetRolesRows.map((r) => r.roleName?.toUpperCase());

  const cleanedTargetRoles = targetRoleNames.filter(
    (role): role is string => role !== null,
  );

  const isTargetHR = hasRole(cleanedTargetRoles, "HR");

  if (isTargetHR && !isApproverAdmin) {
    return reply.code(403).send({
      message: "HR leave can only be rejected by Admin",
    });
  }

  if (!isApproverAdmin && !isApproverHR) {
    return reply.code(403).send({
      message: "Only HR or Admin can reject leave requests",
    });
  }

  const [updated] = await db
    .update(leaveRequests)
    .set({
      status: LeaveStatus.Rejected,
      rejectedBy: userId,
      rejectedAt: new Date(),
      rejectionReason: body.rejectionReason ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.status, LeaveStatus.Pending),
      ),
    )
    .returning();

  if (!updated) {
    return reply.code(404).send({
      message: "Leave not found or already processed",
    });
  }

  return sendMessage(reply, "Leave request rejected successfully");
}

export async function createManualLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const body = request.body as CreateManualLeaveRequestDto;

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((r): r is string => r !== null);

  if (!hasAnyRole(roleNames, ["HR", "ADMIN"])) {
    return sendMessage(reply, "Only HR or Admin allowed", 403);
  }

  const validation = validatePastDatesOnly(body.fromDate, body.toDate);

  if (!validation.valid) {
    return sendMessage(reply, validation.message!, 400);
  }

  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.id, body.employeeId));

  if (!employee) {
    return sendMessage(reply, "Target employee not found", 404);
  }

  const { totalHours, totalDays } = calculateLeaveTotalsSimple({
    fromDate: body.fromDate,
    toDate: body.toDate,
    dayType: body.dayType,
    fromHour: body.fromHour,
    toHour: body.toHour,
  });

  await db.insert(leaveRequests).values({
    employeeId: employee.id,
    createdBy: userId,
    fromDate: body.fromDate,
    toDate: body.toDate,
    type: body.type,
    dayType: body.dayType,
    fromHour: body.fromHour,
    toHour: body.toHour,
    totalHours,
    totalDays: totalDays.toString(),
    reason: body.reason,
    file: body.file,
    status: LeaveStatus.Approved,
    approvedBy: userId,
    approvedAt: new Date(),
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  });

  return sendMessage(reply, "Manual leave created successfully", 201);
}

export async function updateManualLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = request.body as Partial<CreateManualLeaveRequestDto>;

  // Role check
  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((r): r is string => r !== null);

  if (!hasAnyRole(roleNames, ["HR", "ADMIN"])) {
    return sendMessage(reply, "Only HR or Admin allowed", 403);
  }

  // Fetch leave (must be manual & approved)
  const [leave] = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, id));

  if (!leave || !leave.approvedBy) {
    return sendMessage(reply, "Manual leave not found", 404);
  }

  // Past-date validation
  if (body.fromDate || body.toDate) {
    const validation = validatePastDatesOnly(
      body.fromDate ?? leave.fromDate,
      body.toDate ?? leave.toDate,
    );

    if (!validation.valid) {
      return sendMessage(reply, validation.message!, 400);
    }
  }

  // Recalculate
  const { totalHours, totalDays } = calculateLeaveTotalsSimple({
    fromDate: body.fromDate ?? leave.fromDate,
    toDate: body.toDate ?? leave.toDate,
    dayType: body.dayType ?? leave.dayType,
    fromHour: body.fromHour ?? leave.fromHour,
    toHour: body.toHour ?? leave.toHour,
  });

  await db
    .update(leaveRequests)
    .set({
      ...body,
      totalHours,
      totalDays: totalDays.toString(),
      updatedAt: new Date(),
    })
    .where(eq(leaveRequests.id, id));

  return sendMessage(reply, "Manual leave updated successfully");
}

export async function deleteManualLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((r): r is string => r !== null);

  if (!hasAnyRole(roleNames, ["HR", "ADMIN"])) {
    return sendMessage(reply, "Only HR or Admin allowed", 403);
  }

  const [deleted] = await db
    .delete(leaveRequests)
    .where(
      and(
        eq(leaveRequests.id, id),
        sql`${leaveRequests.approvedBy} IS NOT NULL`,
      ),
    )
    .returning({ id: leaveRequests.id });

  if (!deleted) {
    return sendMessage(reply, "Manual leave not found", 404);
  }

  return sendMessage(reply, "Manual leave deleted successfully");
}
