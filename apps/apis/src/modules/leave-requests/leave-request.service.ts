import type { FastifyRequest, FastifyReply } from "fastify";
import {
  eq,
  desc,
  asc,
  and,
  ilike,
  sql,
  or,
  lte,
  gte,
  not,
  SQL,
} from "drizzle-orm";
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
import { hasContainedRole, hasRole } from "../../utils/role.utils";
import { calculateLeaveTotalsSimple } from "./utils/leave-calculation";
import { validatePastDatesOnly } from "./utils/past-date-validation";
import { notifications } from "../../db/schema/notifications.schema";
import { getIO } from "../../utils/socket";
import { users } from "../../db/schema";
import fs from "fs";
import path from "path";
import mime from "mime-types";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function downloadLeaveFileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "DOWNLOAD_LEAVE_FILE",
      userId,
      leaveRequestId: id,
    },
    "Download leave file request received",
  );

  try {
    const [leave] = await db
      .select({
        file: leaveRequests.file,
        employeeId: leaveRequests.employeeId,
      })
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id));

    if (!leave || !leave.file) {
      return reply.code(404).send({ message: "File not found" });
    }

    const userRolesRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const roleNames = userRolesRows
      .map((r) => r.roleName)
      .filter((r): r is string => r !== null);

    const isHRorAdmin = hasContainedRole(roleNames, ["HR", "ADMIN"]);

    if (!isHRorAdmin) {
      const [employee] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.userId, userId));

      if (!employee || employee.id !== leave.employeeId) {
        return reply.code(403).send({ message: "Unauthorized" });
      }
    }

    const filePath = path.join(UPLOAD_DIR, leave.file);

    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({ message: "File missing on server" });
    }

    const contentType = mime.lookup(filePath) || "application/octet-stream";

    reply.header("Content-Type", contentType);
    reply.header("Content-Disposition", `attachment; filename="${leave.file}"`);

    return reply.send(fs.createReadStream(filePath));
  } catch (err: any) {
    request.log.error(
      {
        action: "DOWNLOAD_LEAVE_FILE",
        err,
        userId,
      },
      "Error while downloading file",
    );

    return reply.code(400).send({ message: "Unable to download file" });
  }
}

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

  request.log.info(
    {
      action: "CREATE_LEAVE_REQUEST",
      userId,
      fromDate: body.fromDate,
      toDate: body.toDate,
      type: body.type,
    },
    "Create leave request received",
  );

  validateFutureDates(body.fromDate, body.toDate);

  const [employee] = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(employees)
    .where(eq(employees.userId, userId));

  if (!employee) {
    request.log.warn(
      {
        action: "CREATE_LEAVE_REQUEST",
        userId,
      },
      "Employee not found for leave request",
    );

    return reply.code(404).send({ message: "Employee not found" });
  }

  const { totalHours, totalDays } = calculateLeaveTotalsSimple({
    fromDate: body.fromDate,
    toDate: body.toDate,
    dayType: body.dayType,
    fromHour: body.fromHour,
    toHour: body.toHour,
  });

  const overlappingLeave = await db
    .select({
      id: leaveRequests.id,
    })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, employee.id),

        not(eq(leaveRequests.status, LeaveStatus.Rejected)),

        lte(leaveRequests.fromDate, body.toDate),
        gte(leaveRequests.toDate, body.fromDate),
      ),
    )
    .limit(1);

  if (overlappingLeave.length > 0) {
    request.log.warn(
      {
        action: "CREATE_LEAVE_REQUEST",
        userId,
        employeeId: employee.id,
        fromDate: body.fromDate,
        toDate: body.toDate,
      },
      "Overlapping leave request detected",
    );

    return reply.code(400).send({
      message: "Leave request overlaps with existing leave",
    });
  }
  const fileName = body.file && body.file.trim() !== "" ? body.file : null;

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
    file: fileName,
    status: LeaveStatus.Pending,
  });

  const fullName = `${employee.firstName} ${employee.lastName}`;

  const message = `New leave request submitted by ${fullName}`;

  const adminUsers = await db
    .select({
      userId: userRoles.userId,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(or(eq(roles.name, "ADMIN"), eq(roles.name, "HR")));

  for (const admin of adminUsers) {
    await db.insert(notifications).values({
      userId: admin.userId,
      type: "leave",
      message,
    });
  }

  const io = getIO();

  io.to("admin_room").emit("new_notification", {
    message,
  });

  request.log.info(
    {
      action: "CREATE_LEAVE_REQUEST",
      userId,
      employeeId: employee.id,
      totalDays,
      totalHours,
    },
    "Leave request created successfully",
  );

  return sendMessage(reply, "Leave request created successfully", 201);
}

export async function getAllLeaveRequestsHandler(request: FastifyRequest) {
  const userId = request.user!.id;

  const query = request.query as {
    search?: string;
    status?: (typeof LeaveStatus)[keyof typeof LeaveStatus];
    type?: string;
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "fromDate";
    sortOrder?: "asc" | "desc";
    createdByType?: "all" | "manual" | "self";
  };

  request.log.info(
    {
      action: "GET_ALL_LEAVE_REQUESTS",
      userId,
      query,
    },
    "Get leave requests received",
  );

  const conditions: SQL[] = [eq(employees.isActive, true)];

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isHRorAdmin = hasContainedRole(roleNames, ["HR", "ADMIN"]);

  if (!isHRorAdmin && query.employeeId) {
    request.log.warn(
      {
        action: "GET_ALL_LEAVE_REQUESTS",
        userId,
        employeeId: query.employeeId,
      },
      "Non HR/Admin attempted to filter other employee leave requests",
    );

    return {
      data: [],
      meta: { page: 1, limit: null, total: 0 },
    };
  }

  let resolvedEmployeeId: string | undefined;

  const [employee] = await db
    .select({ id: employees.id, userId: employees.userId })
    .from(employees)
    .where(and(eq(employees.userId, userId), eq(employees.isActive, true)));

  if (!isHRorAdmin) {
    if (!employee) {
      request.log.warn(
        {
          action: "GET_ALL_LEAVE_REQUESTS",
          userId,
        },
        "Employee not found for leave list",
      );

      return {
        data: [],
        meta: { page: 1, limit: null, total: 0 },
      };
    }

    resolvedEmployeeId = employee.id;
  } else if (query.employeeId) {
    resolvedEmployeeId = query.employeeId;
  }

  if (resolvedEmployeeId) {
    conditions.push(eq(leaveRequests.employeeId, resolvedEmployeeId));
  }

  if (isHRorAdmin && query.createdByType) {
    if (query.createdByType === "manual") {
      conditions.push(eq(leaveRequests.createdBy, userId));
    }

    if (query.createdByType === "self" && employee) {
      conditions.push(eq(leaveRequests.createdBy, userId));
      conditions.push(eq(leaveRequests.employeeId, employee.id));
    }
  }

  if (query.search) {
    const searchCondition = or(
      ilike(leaveRequests.reason, `%${query.search}%`),
      ilike(employees.firstName, `%${query.search}%`),
      ilike(employees.lastName, `%${query.search}%`),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (query.status) {
    conditions.push(eq(leaveRequests.status, query.status));
  }

  if (query.type) {
    conditions.push(eq(leaveRequests.type, query.type as any));
  }

  if (query.fromDate) {
    conditions.push(sql`${leaveRequests.fromDate} >= ${query.fromDate}`);
  }

  if (query.toDate) {
    conditions.push(sql`${leaveRequests.toDate} <= ${query.toDate}`);
  }

  const { page, limit, offset } = getPagination(query);

  const orderByClauses = [];

  if (!query.sortBy) {
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

  request.log.info(
    {
      action: "GET_ALL_LEAVE_REQUESTS",
      userId,
      page,
      limit,
      resultCount: data.length,
      total: countResult?.count ?? 0,
    },
    "Leave requests fetched successfully",
  );

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

  request.log.info(
    {
      action: "GET_LEAVE_REQUEST_BY_ID",
      userId,
      leaveRequestId: id,
    },
    "Get leave request by id received",
  );

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isHRorAdmin = hasContainedRole(roleNames, ["HR", "ADMIN"]);

  const conditions = [eq(leaveRequests.id, id)];

  if (!isHRorAdmin) {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, userId));

    if (!employee) {
      request.log.warn(
        {
          action: "GET_LEAVE_REQUEST_BY_ID",
          userId,
          leaveRequestId: id,
        },
        "Employee not found for leave request access",
      );

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
    request.log.warn(
      {
        action: "GET_LEAVE_REQUEST_BY_ID",
        userId,
        leaveRequestId: id,
      },
      "Leave request not found",
    );

    return reply.code(404).send({ message: "Leave request not found" });
  }

  request.log.info(
    {
      action: "GET_LEAVE_REQUEST_BY_ID",
      userId,
      leaveRequestId: id,
    },
    "Leave request fetched successfully",
  );

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

  request.log.info(
    {
      action: "UPDATE_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
      fields: Object.keys(body),
    },
    "Update leave request received",
  );

  const [employeeWithPosition] = await db
    .select({
      employeeId: employees.id,
      positionName: positions.name,
    })
    .from(employees)
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(eq(employees.userId, userId));

  if (!employeeWithPosition) {
    request.log.warn(
      {
        action: "UPDATE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Employee not found for leave update",
    );

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

  const isHRorAdmin = hasContainedRole(roleNames, ["HR", "ADMIN"]);

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
    request.log.warn(
      {
        action: "UPDATE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Leave not found, unauthorized, or not pending",
    );

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

  const overlappingLeave = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, existingLeave.employeeId),
        not(eq(leaveRequests.id, id)),
        not(eq(leaveRequests.status, LeaveStatus.Rejected)),
        lte(leaveRequests.fromDate, finalToDate),
        gte(leaveRequests.toDate, finalFromDate),
      ),
    )
    .limit(1);

  if (overlappingLeave.length > 0) {
    return reply.code(400).send({
      message: "Updated dates overlap with existing leave",
    });
  }

  const fileName =
    body.file !== undefined
      ? body.file.trim() !== ""
        ? body.file
        : null
      : undefined;

  const updateData: any = {
    ...body,
    fromDate: finalFromDate,
    toDate: finalToDate,
    dayType: finalDayType,
    fromHour: finalFromHour,
    toHour: finalToHour,
    totalHours,
    totalDays: totalDays.toString(),
    file: fileName,
  };

  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key],
  );

  const [updated] = await db
    .update(leaveRequests)
    .set(updateData)
    .where(and(...conditions))
    .returning();

  if (!updated) {
    request.log.warn(
      {
        action: "UPDATE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Leave update failed due to invalid state or authorization",
    );

    return reply.code(404).send({
      message: "Leave not found, not authorized, or status is not Pending",
    });
  }

  request.log.info(
    {
      action: "UPDATE_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
      totalDays,
      totalHours,
    },
    "Leave request updated successfully",
  );

  return sendMessage(reply, "Leave request updated successfully");
}
export async function deleteLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "DELETE_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
    },
    "Delete leave request received",
  );

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

  const isHRorAdmin = hasContainedRole(roleNames, ["HR", "ADMIN"]);

  const conditions = [
    eq(leaveRequests.id, id),
    eq(leaveRequests.status, LeaveStatus.Pending),
  ];

  if (!isHRorAdmin) {
    if (!employeeWithPosition?.employeeId) {
      request.log.warn(
        {
          action: "DELETE_LEAVE_REQUEST",
          userId,
          leaveRequestId: id,
        },
        "Employee record not found for leave delete",
      );

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
    request.log.warn(
      {
        action: "DELETE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Leave not found, unauthorized, or not pending",
    );

    return reply.code(404).send({
      message: "Leave not found, not authorized, or status is not Pending",
    });
  }

  request.log.info(
    {
      action: "DELETE_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
    },
    "Leave request deleted successfully",
  );

  return sendMessage(reply, "Leave request deleted successfully");
}

export async function approveLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "APPROVE_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
    },
    "Approve leave request received",
  );

  const approverRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const approverRoleNames = approverRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isApproverAdmin = hasRole(approverRoleNames, "ADMIN");
  const isApproverHR = hasRole(approverRoleNames, "HR");

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
    request.log.warn(
      {
        action: "APPROVE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Leave request not found",
    );

    return reply.code(404).send({ message: "Leave request not found" });
  }

  if (leaveRow.targetUserId === userId) {
    request.log.warn(
      {
        action: "APPROVE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Self approval attempt blocked",
    );

    return reply.code(403).send({
      message: "You cannot approve your own leave request",
    });
  }

  if (!leaveRow.targetUserId) {
    request.log.error(
      {
        action: "APPROVE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Invalid leave request target user",
    );

    return reply.code(500).send({
      message: "Invalid leave request: target user not found",
    });
  }

  const targetRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, leaveRow.targetUserId));

  const targetRoleNames = targetRolesRows
    .map((r) => r.roleName)
    .filter((role): role is string => role !== null);

  const isTargetHR = targetRoleNames.includes("HR");

  if (isTargetHR && !isApproverAdmin) {
    request.log.warn(
      {
        action: "APPROVE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Non-admin attempted to approve HR leave",
    );

    return reply.code(403).send({
      message: "HR leave can only be approved by Admin",
    });
  }

  if (!isApproverAdmin && !isApproverHR) {
    request.log.warn(
      {
        action: "APPROVE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Unauthorized leave approval attempt",
    );

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
    request.log.warn(
      {
        action: "APPROVE_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Leave not found or already processed",
    );

    return reply.code(404).send({
      message: "Leave not found or already processed",
    });
  }

  const [approver] = await db
    .select({
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(employees)
    .where(eq(employees.userId, userId));

  const approverName = approver
    ? `${approver.firstName} ${approver.lastName}`
    : "HR/Admin";

  const message = `Your leave request has been approved by ${approverName}`;

  await db.insert(notifications).values({
    userId: leaveRow.targetUserId,
    type: "leave",
    message,
  });

  const io = getIO();

  io.to(`user_${leaveRow.targetUserId}`).emit("new_notification", {
    message,
  });

  request.log.info(
    {
      action: "APPROVE_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
    },
    "Leave request approved successfully",
  );

  return sendMessage(reply, "Leave request approved successfully");
}
export async function rejectLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = request.body as { rejectionReason?: string };

  request.log.info(
    {
      action: "REJECT_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
    },
    "Reject leave request received",
  );

  const approverRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const approverRoleNames = approverRolesRows
    .map((r) => r.roleName?.toUpperCase())
    .filter((role): role is string => role !== null);

  const isApproverAdmin = hasRole(approverRoleNames, "ADMIN");
  const isApproverHR = hasRole(approverRoleNames, "HR");

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
    request.log.warn(
      {
        action: "REJECT_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Leave request not found",
    );

    return reply.code(404).send({ message: "Leave request not found" });
  }

  if (!leaveRow.targetUserId) {
    request.log.error(
      {
        action: "REJECT_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Invalid leave request target user",
    );

    return reply.code(500).send({
      message: "Invalid leave request: target user not found",
    });
  }

  if (leaveRow.targetUserId === userId) {
    request.log.warn(
      {
        action: "REJECT_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Self rejection attempt blocked",
    );

    return reply.code(403).send({
      message: "You cannot reject your own leave request",
    });
  }

  const targetRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, leaveRow.targetUserId));

  const targetRoleNames = targetRolesRows
    .map((r) => r.roleName?.toUpperCase())
    .filter((role): role is string => role !== null);

  const isTargetHR = hasRole(targetRoleNames, "HR");

  if (isTargetHR && !isApproverAdmin) {
    request.log.warn(
      {
        action: "REJECT_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Non-admin attempted to reject HR leave",
    );

    return reply.code(403).send({
      message: "HR leave can only be rejected by Admin",
    });
  }

  if (!isApproverAdmin && !isApproverHR) {
    request.log.warn(
      {
        action: "REJECT_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Unauthorized leave rejection attempt",
    );

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
    })
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.status, LeaveStatus.Pending),
      ),
    )
    .returning();

  if (!updated) {
    request.log.warn(
      {
        action: "REJECT_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Leave not found or already processed",
    );

    return reply.code(404).send({
      message: "Leave not found or already processed",
    });
  }

  const [approver] = await db
    .select({
      firstName: employees.firstName,
      lastName: employees.lastName,
    })
    .from(employees)
    .where(eq(employees.userId, userId));

  const approverName = approver
    ? `${approver.firstName} ${approver.lastName}`
    : "HR/Admin";

  const message = body.rejectionReason
    ? `Your leave request was rejected by ${approverName}. Reason: ${body.rejectionReason}`
    : `Your leave request was rejected by ${approverName}`;

  await db.insert(notifications).values({
    userId: leaveRow.targetUserId,
    type: "leave",
    message,
  });

  const io = getIO();

  io.to(`user_${leaveRow.targetUserId}`).emit("new_notification", {
    message,
  });

  request.log.info(
    {
      action: "REJECT_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
    },
    "Leave request rejected successfully",
  );

  return sendMessage(reply, "Leave request rejected successfully");
}

export async function createManualLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const body = request.body as CreateManualLeaveRequestDto;

  request.log.info(
    {
      action: "CREATE_MANUAL_LEAVE_REQUEST",
      userId,
      employeeId: body.employeeId,
      fromDate: body.fromDate,
      toDate: body.toDate,
      type: body.type,
    },
    "Create manual leave request received",
  );

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((r): r is string => r !== null);

  if (!hasContainedRole(roleNames, ["HR", "ADMIN"])) {
    request.log.warn(
      {
        action: "CREATE_MANUAL_LEAVE_REQUEST",
        userId,
      },
      "Unauthorized manual leave creation attempt",
    );

    return sendMessage(reply, "Only HR or Admin allowed", 403);
  }

  const validation = validatePastDatesOnly(body.fromDate, body.toDate);

  if (!validation.valid) {
    request.log.warn(
      {
        action: "CREATE_MANUAL_LEAVE_REQUEST",
        userId,
        fromDate: body.fromDate,
        toDate: body.toDate,
      },
      "Invalid leave date range for manual leave",
    );

    return sendMessage(reply, validation.message!, 400);
  }

  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.id, body.employeeId));

  if (!employee) {
    request.log.warn(
      {
        action: "CREATE_MANUAL_LEAVE_REQUEST",
        userId,
        employeeId: body.employeeId,
      },
      "Target employee not found for manual leave",
    );

    return sendMessage(reply, "Target employee not found", 404);
  }

  const { totalHours, totalDays } = calculateLeaveTotalsSimple({
    fromDate: body.fromDate,
    toDate: body.toDate,
    dayType: body.dayType,
    fromHour: body.fromHour,
    toHour: body.toHour,
  });

  const overlappingLeave = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, employee.id),

        not(eq(leaveRequests.status, LeaveStatus.Rejected)),

        lte(leaveRequests.fromDate, body.toDate),
        gte(leaveRequests.toDate, body.fromDate),
      ),
    )
    .limit(1);

  if (overlappingLeave.length > 0) {
    request.log.warn(
      {
        action: "CREATE_MANUAL_LEAVE_REQUEST",
        userId,
        employeeId: employee.id,
        fromDate: body.fromDate,
        toDate: body.toDate,
      },
      "Overlapping manual leave detected",
    );

    return sendMessage(reply, "Leave dates overlap with existing leave", 400);
  }

  const fileName = body.file && body.file.trim() !== "" ? body.file : null;

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
    file: fileName,
    status: LeaveStatus.Approved,
    approvedBy: userId,
    approvedAt: new Date(),
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  });

  request.log.info(
    {
      action: "CREATE_MANUAL_LEAVE_REQUEST",
      userId,
      employeeId: employee.id,
      totalDays,
      totalHours,
    },
    "Manual leave created successfully",
  );

  return sendMessage(reply, "Manual leave created successfully", 201);
}
export async function updateManualLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };
  const body = request.body as Partial<CreateManualLeaveRequestDto>;

  request.log.info(
    {
      action: "UPDATE_MANUAL_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
      fields: Object.keys(body),
    },
    "Update manual leave request received",
  );

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((r): r is string => r !== null);

  if (!hasContainedRole(roleNames, ["HR", "ADMIN"])) {
    request.log.warn(
      {
        action: "UPDATE_MANUAL_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Unauthorized manual leave update attempt",
    );

    return sendMessage(reply, "Only HR or Admin allowed", 403);
  }

  const [row] = await db
    .select({
      leave: leaveRequests,
      employeeUserId: employees.userId,
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(eq(leaveRequests.id, id));

  if (!row || row.leave.createdBy === row.employeeUserId) {
    request.log.warn(
      {
        action: "UPDATE_MANUAL_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Manual leave not found",
    );

    return sendMessage(reply, "Manual leave not found", 404);
  }

  const existingLeave = row.leave;
  let finalEmployeeId = existingLeave.employeeId;

  if (body.employeeId) {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, body.employeeId));

    if (!employee) {
      request.log.warn(
        {
          action: "UPDATE_MANUAL_LEAVE_REQUEST",
          userId,
          leaveRequestId: id,
          employeeId: body.employeeId,
        },
        "Target employee not found for manual leave update",
      );

      return sendMessage(reply, "Target employee not found", 404);
    }

    finalEmployeeId = body.employeeId;
  }

  const finalFromDate = body.fromDate ?? existingLeave.fromDate;
  const finalToDate = body.toDate ?? existingLeave.toDate;

  const validation = validatePastDatesOnly(finalFromDate, finalToDate);

  if (!validation.valid) {
    request.log.warn(
      {
        action: "UPDATE_MANUAL_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
        fromDate: finalFromDate,
        toDate: finalToDate,
      },
      "Invalid date range for manual leave update",
    );

    return sendMessage(reply, validation.message!, 400);
  }

  const finalDayType = body.dayType ?? existingLeave.dayType;
  const finalFromHour = body.fromHour ?? existingLeave.fromHour;
  const finalToHour = body.toHour ?? existingLeave.toHour;

  const { totalHours, totalDays } = calculateLeaveTotalsSimple({
    fromDate: finalFromDate,
    toDate: finalToDate,
    dayType: finalDayType,
    fromHour: finalFromHour,
    toHour: finalToHour,
  });

  const overlappingLeave = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.employeeId, finalEmployeeId),
        not(eq(leaveRequests.id, id)),
        not(eq(leaveRequests.status, LeaveStatus.Rejected)),
        lte(leaveRequests.fromDate, finalToDate),
        gte(leaveRequests.toDate, finalFromDate),
      ),
    )
    .limit(1);

  if (overlappingLeave.length > 0) {
    request.log.warn(
      {
        action: "UPDATE_MANUAL_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
        employeeId: finalEmployeeId,
        fromDate: finalFromDate,
        toDate: finalToDate,
      },
      "Overlapping manual leave detected",
    );

    return sendMessage(reply, "Updated dates overlap with existing leave", 400);
  }

  let finalFile = existingLeave.file;
  if (body.file !== undefined) {
    finalFile = body.file.trim() !== "" ? body.file : null;
  }

  await db
    .update(leaveRequests)
    .set({
      employeeId: finalEmployeeId,
      fromDate: finalFromDate,
      toDate: finalToDate,
      type: body.type ?? existingLeave.type,
      dayType: finalDayType,
      fromHour: finalFromHour,
      toHour: finalToHour,
      totalHours,
      totalDays: totalDays.toString(),
      reason: body.reason ?? existingLeave.reason,
      file: finalFile,
      updatedAt: new Date(),
    })
    .where(eq(leaveRequests.id, id));

  request.log.info(
    {
      action: "UPDATE_MANUAL_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
      totalDays,
      totalHours,
    },
    "Manual leave updated successfully",
  );

  return sendMessage(reply, "Manual leave updated successfully");
}

export async function deleteManualLeaveRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "DELETE_MANUAL_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
    },
    "Delete manual leave request received",
  );

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((r): r is string => r !== null);

  if (!hasContainedRole(roleNames, ["HR", "ADMIN"])) {
    request.log.warn(
      {
        action: "DELETE_MANUAL_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Unauthorized manual leave delete attempt",
    );

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
    request.log.warn(
      {
        action: "DELETE_MANUAL_LEAVE_REQUEST",
        userId,
        leaveRequestId: id,
      },
      "Manual leave not found for delete",
    );

    return sendMessage(reply, "Manual leave not found", 404);
  }

  request.log.info(
    {
      action: "DELETE_MANUAL_LEAVE_REQUEST",
      userId,
      leaveRequestId: id,
    },
    "Manual leave deleted successfully",
  );

  return sendMessage(reply, "Manual leave deleted successfully");
}

export async function getManualLeaveRequestByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "GET_MANUAL_LEAVE_REQUEST_BY_ID",
      userId,
      leaveRequestId: id,
    },
    "Get manual leave request by id received",
  );

  const userRolesRows = await db
    .select({ roleName: roles.name })
    .from(userRoles)
    .leftJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  const roleNames = userRolesRows
    .map((r) => r.roleName)
    .filter((r): r is string => r !== null);

  if (!hasContainedRole(roleNames, ["HR", "ADMIN"])) {
    request.log.warn(
      {
        action: "GET_MANUAL_LEAVE_REQUEST_BY_ID",
        userId,
        leaveRequestId: id,
      },
      "Unauthorized manual leave access attempt",
    );

    return sendMessage(reply, "Only HR or Admin allowed", 403);
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
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .leftJoin(
      createdByEmployee,
      eq(leaveRequests.createdBy, createdByEmployee.userId),
    )
    .where(and(eq(leaveRequests.id, id), eq(employees.isActive, true)));

  if (!row || !row.employee || row.leave.createdBy === row.employee.userId) {
    request.log.warn(
      {
        action: "GET_MANUAL_LEAVE_REQUEST_BY_ID",
        userId,
        leaveRequestId: id,
      },
      "Manual leave not found",
    );

    return sendMessage(reply, "Manual leave not found", 404);
  }

  request.log.info(
    {
      action: "GET_MANUAL_LEAVE_REQUEST_BY_ID",
      userId,
      leaveRequestId: id,
    },
    "Manual leave fetched successfully",
  );

  return { data: row };
}
