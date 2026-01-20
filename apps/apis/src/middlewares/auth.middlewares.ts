import { FastifyRequest, FastifyReply } from "fastify";
import jwt, { JwtPayload } from "jsonwebtoken";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      iat: number;
      exp: number;
    };
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("invalid token");
  }
  return secret;
}

function isValidJwtPayload(
  payload: string | JwtPayload
): payload is JwtPayload & { id: string; email: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.id === "string" &&
    typeof payload.email === "string"
  );
}

export async function verifyAccessToken(
  request: FastifyRequest,
  reply: FastifyReply
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
        error: "Invalid token",
      });
    }

    request.user = {
      id: decoded.id,
      email: decoded.email,
      iat: decoded.iat ?? 0,
      exp: decoded.exp ?? 0,
    };
  } catch {
    return reply.status(401).send({
      error: "Invalid or expired token",
    });
  }
}
