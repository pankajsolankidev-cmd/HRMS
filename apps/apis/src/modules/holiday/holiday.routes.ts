import type { FastifyInstance } from "fastify";
import {
  createHolidayHandler,
  getHolidaysHandler,
  getHolidayByIdHandler,
  updateHolidayHandler,
  deleteHolidayHandler,
  checkHolidayExcelHandler,
  confirmHolidayUploadHandler,
  downloadHolidayTemplateHandler,
  exportHolidaysPdfHandler,
} from "./holiday.service";

import {
  createHolidaySchema,
  updateHolidaySchema,
  getHolidayByIdSchema,
  getHolidaysSchema,
} from "./holiday.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function holidayRoutes(app: FastifyInstance) {
  const secured = {
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Holidays"],
    },
  };

  app.post(
    "/holidays",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_CREATE)],
      schema: { ...secured.schema, ...createHolidaySchema },
    },
    createHolidayHandler,
  );

  app.get(
    "/holidays",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_VIEW)],
      schema: { ...secured.schema, ...getHolidaysSchema },
    },
    getHolidaysHandler,
  );

  app.get(
    "/holidays/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_VIEW)],
      schema: { ...secured.schema, ...getHolidayByIdSchema },
    },
    getHolidayByIdHandler,
  );

  app.put(
    "/holidays/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_UPDATE)],
      schema: { ...secured.schema, ...updateHolidaySchema },
    },
    updateHolidayHandler,
  );

  app.delete(
    "/holidays/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_DELETE)],
    },
    deleteHolidayHandler,
  );

  app.post(
    "/holidays/upload/check",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_CREATE)],
    },
    checkHolidayExcelHandler,
  );

  app.post(
    "/holidays/upload/confirm",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_CREATE)],
    },
    confirmHolidayUploadHandler,
  );

  app.get(
    "/holidays/upload/template",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_EXPORT)],
    },
    downloadHolidayTemplateHandler,
  );

  app.get(
    "/holidays/export/pdf",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.HOLIDAY_EXPORT)],
    },
    exportHolidaysPdfHandler,
  );
}
