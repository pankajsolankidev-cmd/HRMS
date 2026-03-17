import { and, eq, is } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { users } from "../db/schema/users.schema";
import { passwordResetTokens } from "../db/schema/password-reset-tokens.schema";
import { db } from "../db";
import { generateResetKey } from "./password-reset.service";
import { userRoles } from "../db/schema/user-roles.schema";
import { roles } from "../db/schema/roles.schema";
import { rolePermissions } from "../db/schema/role-permissions.schema";
import { permissions } from "../db/schema/permissions.schema";

import {
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema";

import type { AuthSignInDto } from "@shared/types/src/auth/auth.dto";
import { verifyAccessToken } from "../middlewares/auth.middlewares";
import redis from "../lib/redis";

const JWT_SECRET = process.env.JWT_SECRET!;

function generateAccessToken(payload: {
  id: string;
  email?: string;
  username?: string;
  roles: string[];
}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1m" });
}

function generateRefreshToken(payload: { id: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export default async function authRoutes(app: FastifyInstance) {
  app.post("/signin", { schema: signInSchema }, async (request, reply) => {
    try {
      const { email, password } = request.body as AuthSignInDto;

      if (!email || !password) {
        return reply
          .status(400)
          .send({ error: "Email and password are required" });
      }

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          password: users.password,
          isActive: users.isActive,
        })
        .from(users)
        .where(and(eq(users.email, email), eq(users.isActive, true)));

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

      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
        roles: rolesArr,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
      });

      for (const role of rolesArr) {
        const roleKey = `role_permission_${role.toLowerCase()}`;

        const rolePermissions = rows
          .filter((r) => r.roleName === role)
          .map((r) => r.permissionName);

        await redis.set(roleKey, JSON.stringify(rolePermissions));
      }

      return reply.send({
        id: user.id,
        email: user.email,
        username: user.username,
        accessToken,
        refreshToken,
        roles: rolesArr,
        permissions: permissionsArr,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({ error: "Signin failed" });
    }
  });

  app.get(
    "/auth/session",
    { preHandler: [verifyAccessToken] },
    async (request, reply) => {
      try {
        const authUser = request.user;

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

        const roles: string[] = authUser.roles || [];
        const permissionSet = new Set<string>();
        for (const role of roles) {
          const key = `role_permission_${role.toLowerCase()}`;

          const data = await redis.get(key);
          if (!data) continue;

          const permissions: string[] = JSON.parse(data);

          for (const p of permissions) {
            permissionSet.add(p);
          }
        }

        const permissions = Array.from(permissionSet);

        return reply.send({
          id: user.id,
          email: user.email,
          username: user.username,
          roles,
          permissions,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ error: "Failed to fetch session" });
      }
    },
  );

  app.post("/auth/refresh", async (request, reply) => {
    try {
      const { refreshToken } = request.body as {
        refreshToken: string;
      };

      if (!refreshToken) {
        return reply.status(401).send({ error: "Missing refresh token" });
      }

      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string };

      const rows = await db
        .select({
          roleName: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, decoded.id));

      const roleSet = new Set<string>();

      for (const row of rows) {
        if (row.roleName) roleSet.add(row.roleName);
      }

      const rolesArr = Array.from(roleSet);

      const permissionSet = new Set<string>();

      for (const role of rolesArr) {
        const key = `role_permission_${role.toLowerCase()}`;

        const data = await redis.get(key);
        if (!data) continue;

        const permissions: string[] = JSON.parse(data);

        for (const p of permissions) {
          permissionSet.add(p);
        }
      }

      const permissionsArr = Array.from(permissionSet);

      const newAccessToken = generateAccessToken({
        id: decoded.id,
        roles: rolesArr,
      });

      return reply.send({
        accessToken: newAccessToken,
        roles: rolesArr,
        permissions: permissionsArr,
      });
    } catch (error) {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }
  });

  app.post(
    "/auth/logout",
    { preHandler: [verifyAccessToken] },
    async (request, reply) => {
      try {
        const user = request.user;

        if (!user?.id) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        return reply.send({ message: "Logged out successfully" });
      } catch (error) {
        request.log.error(error);
        return reply.status(400).send({ error: "Logout failed" });
      }
    },
  );

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
