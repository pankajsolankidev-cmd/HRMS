import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { users } from "../db/schema/users.schema";
import { refreshTokens } from "../db/schema/refresh-tokens.schema";
import { passwordResetTokens } from "../db/schema/password-reset-tokens.schema";
import { db } from "../db";
import { generateResetKey } from "./password-reset.service";
import { userRoles } from "../db/schema/user-roles.schema";
import { roles } from "../db/schema/roles.schema";
import { rolePermissions } from "../db/schema/role-permissions.schema";
import { permissions } from "../db/schema/permissions.schema";

import {
  signUpSchema,
  signInSchema,
  refreshTokenSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema";

import type {
  AuthSignUpDto,
  AuthSignInDto,
} from "@shared/types/src/auth/auth.dto";
import { verifyAccessToken } from "../middlewares/auth.middlewares";

const JWT_SECRET = process.env.JWT_SECRET!;

function generateAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

export default async function authRoutes(app: FastifyInstance) {
  app.post("/signin", { schema: signInSchema }, async (request, reply) => {
    const { email, password } = request.body as AuthSignInDto;

    if (!email || !password) {
      return reply
        .status(400)
        .send({ error: "Email or password are required" });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
      })
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const rows = await db
      .select({
        roleName: roles.name,
        permissionName: permissions.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, user.id));

    const roleSet = new Set<string>();
    const permissionSet = new Set<string>();

    for (const row of rows) {
      if (row.roleName) roleSet.add(row.roleName);
      if (row.permissionName) permissionSet.add(row.permissionName);
    }

    const rolesArr = Array.from(roleSet);
    const permissionsArr = Array.from(permissionSet);

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      roles: rolesArr,
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
      roles: rolesArr,
      permissions: permissionsArr,
    });
  });

  app.get(
    "/auth/session",
    { preHandler: [verifyAccessToken] },
    async (request, reply) => {
      const authUser = request.user as {
        id: string;
        email: string;
      };

      if (!authUser?.id) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
        })
        .from(users)
        .where(eq(users.id, authUser.id));

      if (!user) {
        return reply.status(401).send({ error: "User not found" });
      }

      const rows = await db
        .select({
          roleName: roles.name,
          permissionName: permissions.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(eq(userRoles.userId, user.id));

      const roleSet = new Set<string>();
      const permissionSet = new Set<string>();

      for (const row of rows) {
        if (row.roleName) roleSet.add(row.roleName);
        if (row.permissionName) permissionSet.add(row.permissionName);
      }

      return reply.send({
        user,
        roles: Array.from(roleSet),
        permissions: Array.from(permissionSet),
      });
    },
  );

  app.post(
    "/auth/refresh",
    { schema: refreshTokenSchema },
    async (request, reply) => {
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
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, record.userId));

      if (!user) {
        return reply.status(401).send({ error: "User not found" });
      }

      const rows = await db
        .select({
          roleName: roles.name,
          permissionName: permissions.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(eq(userRoles.userId, user.id));

      const roleSet = new Set<string>();
      const permissionSet = new Set<string>();

      for (const row of rows) {
        if (row.roleName) roleSet.add(row.roleName);
        if (row.permissionName) permissionSet.add(row.permissionName);
      }

      const rolesArr = Array.from(roleSet);
      const permissionsArr = Array.from(permissionSet);

      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        roles: rolesArr,
      });

      return reply.send({
        accessToken: newAccessToken,
        roles: rolesArr,
        permissions: permissionsArr,
      });
    },
  );

  app.post("/auth/logout", { schema: logoutSchema }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (refreshToken) {
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));
    }

    return reply.send({ message: "Logged out" });
  });

  app.post(
    "/auth/forgot-password",
    { schema: forgotPasswordSchema },
    async (request, reply) => {
      const { email } = request.body as { email: string };

      const [user] = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return reply.send({
          message: "If the email exists, a reset link will be sent",
        });
      }

      const resetKey = generateResetKey();

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        key: resetKey,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      return reply.send({
        message: "Reset Key is Generated",
        key: resetKey,
      });
    },
  );

  app.post(
    "/auth/reset-password",
    { schema: resetPasswordSchema },
    async (request, reply) => {
      const { key, newPassword } = request.body as {
        key: string;
        newPassword: string;
      };

      if (!key || !newPassword) {
        return reply.status(400).send({
          error: "key and new password are required",
        });
      }

      const [record] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.key, key));

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
    },
  );
}
