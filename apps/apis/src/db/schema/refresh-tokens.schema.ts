import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "./users.schema";
import { baseColumns } from "../base-columns";

export const refreshTokens = pgTable("refresh_tokens", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  token: text("token").notNull(),

  expiresAt: timestamp("expires_at").notNull(),

  ...baseColumns,
});
