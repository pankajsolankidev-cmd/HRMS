import type { FastifyInstance } from "fastify";
import { getProfileHandler } from "./profile.service";
import { getProfileSchema } from "./profile.schema";
import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export default async function profileRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.get(
    "/profile",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getProfileSchema,
      },
    },
    getProfileHandler,
  );
}
