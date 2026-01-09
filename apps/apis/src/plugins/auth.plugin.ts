import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not defined");
const JWT_SECRET_STR: string = JWT_SECRET;

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({ error: "Authorization missing" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return reply.status(401).send({ error: "Invalid auth format" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET_STR);
    if (
      typeof payload === "object" &&
      payload !== null &&
      "id" in payload &&
      "email" in payload &&
      "iat" in payload &&
      "exp" in payload
    ) {
      request.user = payload as AuthUser;
    } else {
      return reply.status(401).send({ error: "Invalid token payload" });
    }
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}

export default fp(async (app: FastifyInstance) => {
  app.decorateRequest<AuthUser | null>("user", null);
});
