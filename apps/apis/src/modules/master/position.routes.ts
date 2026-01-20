import type { FastifyInstance } from "fastify";
import { db } from "../../db";
import { asc } from "drizzle-orm";
import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { positions } from "../../db/schema/positions.schema";

export default async function positionRoutes(app: FastifyInstance) {
  app.get(
    "/positions",
    {
      preHandler: verifyAccessToken,
      schema: {
        tags: ["Positions"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
              required: ["id", "name"],
            },
          },
        },
      },
    },
    async () => {
      return db
        .select({
          id: positions.id,
          name: positions.name,
        })
        .from(positions)
        .orderBy(asc(positions.name));
    },
  );
}
