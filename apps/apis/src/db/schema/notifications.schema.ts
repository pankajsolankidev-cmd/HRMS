import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { baseColumns } from "../base-columns";

export const notificationTypeEnum = pgEnum("notification_type", [
  "leave",
  "expenses",
]);

export const notifications = pgTable("notifications", {
  ...baseColumns,
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  type: notificationTypeEnum("type").notNull(),
});
