import type { FastifyInstance } from "fastify";
import {
  createHolidayHandler,
  getHolidaysHandler,
  getHolidayByIdHandler,
  updateHolidayHandler,
  deleteHolidayHandler,
} from "./holiday.service";

import {
  createHolidaySchema,
  updateHolidaySchema,
  getHolidayByIdSchema,
  getHolidaysSchema,
} from "./holiday.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export default async function holidayRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/holidays",
    { ...secured, schema: { ...secured.schema, ...createHolidaySchema } },
    createHolidayHandler,
  );

  app.get(
    "/holidays",
    { ...secured, schema: { ...secured.schema, ...getHolidaysSchema } },
    getHolidaysHandler,
  );

  app.get(
    "/holidays/:id",
    { ...secured, schema: { ...secured.schema, ...getHolidayByIdSchema } },
    getHolidayByIdHandler,
  );

  app.put(
    "/holidays/:id",
    { ...secured, schema: { ...secured.schema, ...updateHolidaySchema } },
    updateHolidayHandler,
  );

  app.delete("/holidays/:id", { ...secured }, deleteHolidayHandler);
}
