import { FastifyInstance } from "fastify";
import {
  getMyNotificationsHandler,
  getUnreadNotificationCountHandler,
  markAllNotificationsAsReadHandler,
  markNotificationAsReadHandler,
} from "./notifications.service";
import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import {
  getNotificationsSchema,
  getUnreadNotificationCountSchema,
  markAllNotificationsAsReadSchema,
  markNotificationAsReadSchema,
} from "./notifications.schema";

export default async function notificationRoutes(app: FastifyInstance) {
  app.get(
    "/notifications",
    {
      schema: getNotificationsSchema,
      preHandler: [verifyAccessToken],
    },
    getMyNotificationsHandler,
  );

  app.get(
    "/notifications/unread-count",
    {
      schema: getUnreadNotificationCountSchema,
      preHandler: [verifyAccessToken],
    },
    getUnreadNotificationCountHandler,
  );

  app.patch(
    "/notifications/:id/read",
    {
      schema: markNotificationAsReadSchema,
      preHandler: [verifyAccessToken],
    },
    markNotificationAsReadHandler,
  );
  app.patch(
    "/notifications/read-all",
    {
      schema: markAllNotificationsAsReadSchema,
      preHandler: [verifyAccessToken],
    },
    markAllNotificationsAsReadHandler,
  );
}
