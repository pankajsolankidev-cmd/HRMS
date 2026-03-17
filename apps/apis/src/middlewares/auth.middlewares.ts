import { FastifyRequest, FastifyReply } from "fastify";
import jwt, { JwtPayload } from "jsonwebtoken";
import redis from "../lib/redis";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      roles: string[];
      permissions: string[];
      iat: number;
      exp: number;
    };
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not configured");
  }
  return secret;
}

function isValidJwtPayload(
  payload: string | JwtPayload,
): payload is JwtPayload & { id: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.id === "string"
  );
}

export async function verifyAccessToken(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({
      error: "Authorization header missing",
    });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return reply.status(401).send({
      error: "Invalid authorization format",
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (!isValidJwtPayload(decoded)) {
      return reply.status(401).send({
        error: "Invalid token payload",
      });
    }

    const cached = await redis.get(`rbac:${decoded.id}`);

    let roles: string[] = [];
    let permissions: string[] = [];

    if (cached) {
      const data = JSON.parse(cached);
      roles = data.roles ?? [];
      permissions = data.permissions ?? [];
    }

    request.user = {
      id: decoded.id,
      roles,
      permissions,
      iat: decoded.iat ?? 0,
      exp: decoded.exp ?? 0,
    };

    return;
  } catch {
    return reply.status(401).send({
      error: "Invalid or expired token",
    });
  }
}
