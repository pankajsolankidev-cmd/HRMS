import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { baseColumns } from "../base-columns";

export const passwordResetTokens = pgTable("password_reset_tokens", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  key: text("key").notNull(),

  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  isAccepted: boolean("is_accepted").default(false).notNull(),
  ...baseColumns,
});
