import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { notifications } from "../../db/schema/notifications.schema";
import { FastifyReply, FastifyRequest } from "fastify";

export async function getMyNotificationsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;

  const { page = 1, limit = 10 } = request.query as {
    page?: number;
    limit?: number;
  };

  const offset = (Number(page) - 1) * Number(limit);

  try {
    const data = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(Number(limit))
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    return reply.send({
      data,
      pagination: {
        total: Number(countResult.count),
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    request.log.error(
      {
        action: "GET_MY_NOTIFICATIONS",
        userId,
        error,
      },
      "Failed to fetch notifications",
    );

    return reply.status(500).send({
      message: "Failed to fetch notifications",
    });
  }
}

export async function getUnreadNotificationCountHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;

  try {
    const [result] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return reply.send({
      count: Number(result.count),
    });
  } catch (error) {
    request.log.error(
      {
        action: "GET_UNREAD_NOTIFICATION_COUNT",
        userId,
        error,
      },
      "Failed to fetch unread notification count",
    );

    return reply.status(500).send({
      message: "Failed to fetch unread notification count",
    });
  }
}

export async function markNotificationAsReadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;
  const { id } = request.params as { id: string };

  try {
    const [updated] = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    if (!updated) {
      return reply.status(404).send({
        message: "Notification not found",
      });
    }

    return reply.send({
      message: "Notification marked as read",
    });
  } catch (error) {
    request.log.error(
      {
        action: "MARK_NOTIFICATION_AS_READ",
        userId,
        notificationId: id,
        error,
      },
      "Failed to mark notification as read",
    );

    return reply.status(500).send({
      message: "Failed to mark notification as read",
    });
  }
}
export async function markAllNotificationsAsReadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user!.id;

  try {
    await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return reply.send({
      message: "All notifications marked as read",
    });
  } catch (error) {
    request.log.error(
      {
        action: "MARK_ALL_NOTIFICATIONS_AS_READ",
        userId,
        error,
      },
      "Failed to mark all notifications as read",
    );

    return reply.status(500).send({
      message: "Failed to mark all notifications as read",
    });
  }
}
