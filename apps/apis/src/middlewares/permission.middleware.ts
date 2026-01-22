import { FastifyReply, FastifyRequest } from "fastify";
import { eq, inArray } from "drizzle-orm";

import { db } from "../db";
import { userRoles, rolePermissions, permissions } from "../db/schema";

export function requirePermission(permissionName: string) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const roles = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    if (roles.length === 0) {
      return reply.code(403).send({ message: "No role assigned" });
    }

    const roleIds = roles.map((r) => r.roleId);

    const permission = await db
      .select({ id: permissions.id })
      .from(permissions)
      .innerJoin(
        rolePermissions,
        eq(rolePermissions.permissionId, permissions.id),
      )
      .where(
        eq(permissions.name, permissionName) &&
          inArray(rolePermissions.roleId, roleIds),
      );

    if (permission.length === 0) {
      return reply.code(403).send({
        message: "Access denied",
      });
    }
  };
}
