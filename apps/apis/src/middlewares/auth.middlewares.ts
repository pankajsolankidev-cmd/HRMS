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

const JWT_SECRET = process.env.JWT_SECRET!;

export async function verifyAccessToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({ error: "Authorization header missing" });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return reply.status(401).send({ error: "Invalid authorization format" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    request.user = {
      id: decoded.id as string,
      email: decoded.email as string,
      iat: decoded.iat ?? 0,
      exp: decoded.exp ?? 0,
    };
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}
