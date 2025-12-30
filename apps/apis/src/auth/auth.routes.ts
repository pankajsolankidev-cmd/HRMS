import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { users } from "../db/schema/users.schema";
import { refreshTokens } from "../db/schema/refresh-tokens.schema";
import { passwordResetTokens } from "../db/schema/password-reset-tokens.schema";
import { db } from "../db";

import { generateResetToken } from "./password-reset.service";

import type {
  AuthSignUpDto,
  AuthSignInDto,
} from "@shared/types/src/auth/auth.dto";

const JWT_SECRET = process.env.JWT_SECRET!;

function generateAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export default async function authRoutes(app: FastifyInstance) {
  app.post("/signup", async (request, reply) => {
    const { username, email, password } = request.body as AuthSignUpDto;

    if (!username || !email || !password) {
      return reply.status(400).send({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const [user] = await db
        .insert(users)
        .values({ username, email, password: hashedPassword })
        .returning({ id: users.id, email: users.email });

      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
      });

      return reply.status(201).send({ accessToken });
    } catch (err: any) {
      if (err?.code === "23505") {
        return reply.status(409).send({
          error: "User with this email or username already exists",
        });
      }
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  app.post("/signin", async (request, reply) => {
    const { email, password } = request.body as AuthSignInDto;

    if (!email || !password) {
      return reply
        .status(400)
        .send({ error: "Email and password are required" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken();

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return reply.send({
      accessToken,
      refreshToken,
    });
  });

  app.post("/auth/refresh", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(401).send({ error: "Refresh token missing" });
    }

    const [record] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken));

    if (!record || record.expiresAt < new Date()) {
      return reply
        .status(401)
        .send({ error: "Invalid or expired refresh token" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, record.userId));

    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
    });

    return reply.send({ accessToken: newAccessToken });
  });

  app.post("/auth/logout", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (refreshToken) {
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));
    }

    return reply.send({ message: "Logged out" });
  });

  app.post("/auth/forgot-password", async (request, reply) => {
    const { email } = request.body as { email: string };

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return reply.send({
        message: "If the email exists, a reset link will be sent",
      });
    }

    const resetToken = generateResetToken();

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    return reply.send({
      message: "If the email exists, a reset link will be sent",
    });
  });

  app.post("/auth/reset-password", async (request, reply) => {
    const { token, newPassword } = request.body as {
      token: string;
      newPassword: string;
    };

    if (!token || !newPassword) {
      return reply.status(400).send({
        error: "Token and new password are required",
      });
    }

    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    if (!record || record.isAccepted || record.expiresAt < new Date()) {
      return reply.status(400).send({
        error: "Reset token is invalid or expired",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, record.userId));

    await db
      .update(passwordResetTokens)
      .set({
        isAccepted: true,
        acceptedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, record.id));

    return reply.send({ message: "Password reset successful" });
  });
}
