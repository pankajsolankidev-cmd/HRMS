import type { FastifyReply } from "fastify";

export function sendMessage(
  reply: FastifyReply,
  message: string,
  statusCode = 200
) {
  return reply.code(statusCode).send({ message });
}
