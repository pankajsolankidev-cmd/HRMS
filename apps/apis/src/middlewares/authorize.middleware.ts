import { FastifyReply, FastifyRequest } from "fastify";
import { ROLES } from "../db/schema/roles.enums";
import type { PermissionName } from "../db/schema/permissions.enums";

export function authorize(requiredPermission: PermissionName) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { roles, permissions } = user;

    if (roles.includes(ROLES.ADMIN)) {
      return;
    }

    if (!permissions.includes(requiredPermission)) {
      return reply.code(403).send({
        message: "Forbidden: insufficient permissions",
      });
    }
  };
}
