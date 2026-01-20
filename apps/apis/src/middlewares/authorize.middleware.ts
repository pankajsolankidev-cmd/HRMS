import { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { userRoles, roles, rolePermissions, permissions } from "../db/schema";

import type { PermissionName } from "../db/schema/permissions.enums";

export function authorize(requiredPermission: PermissionName) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const rows = await db
      .select({
        permission: permissions.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    const permissionList = rows.map((r) => r.permission);

    if (!permissionList.includes(requiredPermission)) {
      return reply.code(403).send({
        message: "Forbidden: insufficient permissions",
      });
    }
  };
}
