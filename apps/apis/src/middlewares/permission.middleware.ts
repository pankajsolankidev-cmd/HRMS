import { FastifyReply, FastifyRequest } from "fastify";

export function requirePermission(permissionName: string) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { permissions } = user;

    if (!permissions || !permissions.includes(permissionName)) {
      return reply.code(403).send({
        message: "Access denied",
      });
    }
  };
}