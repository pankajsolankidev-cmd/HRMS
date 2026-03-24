vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "..";
import { db } from "../db";
import redis from "../lib/redis";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

vi.mock("../db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../lib/redis", () => ({
  default: {
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn(),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-token"),
    verify: vi.fn(),
  },
}));

vi.mock("../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any) => {
    req.user = { id: "u1", roles: ["Admin"] };
  },
}));

describe("AUTH ROUTES", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /signin", () => {
    it("should return 200 for valid credentials", async () => {
      const mockUserWhere = vi.fn().mockResolvedValueOnce([
        {
          id: "u1",
          email: "test@example.com",
          username: "tester",
          password: "hashed",
          isActive: true,
        },
      ]);

      const mockRolesWhere = vi
        .fn()
        .mockResolvedValueOnce([
          { roleName: "Admin", permissionName: "read:users" },
        ]);

      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({ where: mockUserWhere }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnThis(),
            where: mockRolesWhere,
          }),
        });

      (bcrypt.compare as any).mockResolvedValueOnce(true);

      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { email: "test@example.com", password: "123" },
      });

      expect(res.statusCode).toBe(200);
    });
    it("should handle empty roles and permissions", async () => {
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValueOnce([
              {
                id: "u1",
                email: "test@test.com",
                password: "hashed",
                isActive: true,
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValueOnce([]),
          }),
        });

      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { email: "test@test.com", password: "123" },
      });

      expect(res.statusCode).toBe(200);
    });

    it("should return 400 if password missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { email: "test@test.com" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 401 if password wrong", async () => {
      const mockWhere = vi
        .fn()
        .mockResolvedValueOnce([{ id: "u1", password: "hashed" }]);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({ where: mockWhere }),
      });

      (bcrypt.compare as any).mockResolvedValueOnce(false);

      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { email: "test@example.com", password: "wrong" },
      });

      expect(res.statusCode).toBe(401);
    });

    it("should return 400 if DB throws error", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("DB fail");
      });

      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { email: "test@test.com", password: "123" },
      });

      expect(res.statusCode).toBe(400);
    });
    it("should return 400 if email missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { password: "123" },
      });

      expect(res.statusCode).toBe(400);
    });
    it("should return 400 if bcrypt throws error", async () => {
      const mockWhere = vi.fn().mockResolvedValueOnce([
        {
          id: "u1",
          password: "hashed",
          isActive: true,
        },
      ]);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({ where: mockWhere }),
      });

      (bcrypt.compare as any).mockRejectedValueOnce(new Error("fail"));

      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { email: "test@test.com", password: "123" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 401 if user not found", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { email: "test@test.com", password: "123" },
      });

      expect(res.statusCode).toBe(401);
    });
    it("should handle null roles and permissions safely", async () => {
      (db.select as any)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValueOnce([
              {
                id: "u1",
                email: "test@test.com",
                password: "hashed",
                isActive: true,
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnThis(),
            where: vi
              .fn()
              .mockResolvedValueOnce([
                { roleName: null, permissionName: null },
              ]),
          }),
        });

      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await app.inject({
        method: "POST",
        url: "/signin",
        payload: { email: "test@test.com", password: "123" },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("GET /auth/session", () => {
    it("should return session data", async () => {
      const mockWhere = vi
        .fn()
        .mockResolvedValueOnce([
          { id: "u1", email: "test@example.com", username: "tester" },
        ]);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({ where: mockWhere }),
      });

      (redis.get as any).mockResolvedValue(JSON.stringify(["read:users"]));

      const res = await app.inject({
        method: "GET",
        url: "/auth/session",
        headers: {
          authorization: "Bearer valid",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.permissions).toContain("read:users");
    });
    it("should return 401 when authUser.id missing", async () => {
      vi.resetModules();

      vi.doMock("../middlewares/auth.middlewares", () => ({
        verifyAccessToken: async (req: any) => {
          req.user = {};
        },
      }));

      const freshApp = (await import("..")).default;

      const res = await freshApp.inject({
        method: "GET",
        url: "/auth/session",
        headers: { authorization: "Bearer token" },
      });

      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if user not found", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      const res = await app.inject({
        method: "GET",
        url: "/auth/session",
        headers: { authorization: "Bearer token" },
      });

      expect(res.statusCode).toBe(401);
    });
    it("should handle empty redis permissions", async () => {
      const mockWhere = vi
        .fn()
        .mockResolvedValueOnce([
          { id: "u1", email: "test@test.com", username: "tester" },
        ]);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({ where: mockWhere }),
      });

      (redis.get as any).mockResolvedValue(null);

      const res = await app.inject({
        method: "GET",
        url: "/auth/session",
        headers: { authorization: "Bearer token" },
      });

      expect(res.statusCode).toBe(200);
    });
    it("should return 400 if session fails", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("fail");
      });

      const res = await app.inject({
        method: "GET",
        url: "/auth/session",
        headers: { authorization: "Bearer token" },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh token", async () => {
      (jwt.verify as any).mockReturnValue({ id: "u1" });

      const mockWhere = vi.fn().mockResolvedValueOnce([{ roleName: "Admin" }]);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: mockWhere,
        }),
      });

      (redis.get as any).mockResolvedValue(JSON.stringify(["read:users"]));

      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
        payload: { refreshToken: "valid" },
      });

      expect(res.statusCode).toBe(200);
    });
    it("should handle refresh with empty permissions", async () => {
      (jwt.verify as any).mockReturnValue({ id: "u1" });

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      (redis.get as any).mockResolvedValue(null);

      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
        payload: { refreshToken: "valid" },
      });

      expect(res.statusCode).toBe(200);
    });

    it("should fail if invalid token", async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error();
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
        payload: { refreshToken: "bad" },
      });

      expect(res.statusCode).toBe(401);
    });
    it("should return 401 if refresh fails internally", async () => {
      (jwt.verify as any).mockReturnValue({ id: "u1" });

      (db.select as any).mockImplementation(() => {
        throw new Error("fail");
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
        payload: { refreshToken: "valid" },
      });

      expect(res.statusCode).toBe(401);
    });

    it("should return 401 if refresh token missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
        payload: {},
      });

      expect(res.statusCode).toBe(401);
    });
    it("should handle roles without permissions in redis", async () => {
      (jwt.verify as any).mockReturnValue({ id: "u1" });

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValueOnce([{ roleName: "Admin" }]),
        }),
      });

      (redis.get as any).mockResolvedValue(null);

      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
        payload: { refreshToken: "valid" },
      });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("should return message even if user not found", async () => {
      const mockWhere = vi.fn().mockResolvedValueOnce([]);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({ where: mockWhere }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/forgot-password",
        payload: { email: "ghost@test.com" },
      });

      expect(res.statusCode).toBe(200);
    });

    it("should insert reset token if user exists", async () => {
      const insertMock = vi.fn();

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValueOnce([{ id: "u1" }]),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: insertMock,
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/forgot-password",
        payload: { email: "test@test.com" },
      });

      expect(res.statusCode).toBe(200);
      expect(insertMock).toHaveBeenCalled();
    });
    it("should insert correct reset token data", async () => {
      const insertMock = vi.fn();

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValueOnce([{ id: "u1" }]),
        }),
      });

      (db.insert as any).mockReturnValue({
        values: insertMock,
      });

      await app.inject({
        method: "POST",
        url: "/auth/forgot-password",
        payload: { email: "test@test.com" },
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u1",
        }),
      );
    });
  });

  describe("POST /auth/reset-password", () => {
    it("should reset password successfully", async () => {
      const mockWhere = vi.fn().mockResolvedValueOnce([
        {
          id: "r1",
          userId: "u1",
          isAccepted: false,
          expiresAt: new Date(Date.now() + 10000),
        },
      ]);

      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({ where: mockWhere }),
      });

      (bcrypt.hash as any).mockResolvedValue("hashed");

      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn(),
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/reset-password",
        payload: { key: "valid", newPassword: "123456" },
      });

      expect(res.statusCode).toBe(200);
    });
    it("should return 400 if key missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/reset-password",
        payload: { newPassword: "123" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if password missing", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/reset-password",
        payload: { key: "abc" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if reset-password throws error", async () => {
      (db.select as any).mockImplementation(() => {
        throw new Error("unexpected");
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/reset-password",
        payload: { key: "valid", newPassword: "123" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should fail if reset token invalid", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/reset-password",
        payload: { key: "bad", newPassword: "123" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("should fail if token expired", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValueOnce([
            {
              isAccepted: false,
              expiresAt: new Date(Date.now() - 1000),
            },
          ]),
        }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/reset-password",
        payload: { key: "valid", newPassword: "123" },
      });

      expect(res.statusCode).toBe(400);
    });
    it("should fail if token already accepted", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValueOnce([
            {
              isAccepted: true,
              expiresAt: new Date(Date.now() + 10000),
            },
          ]),
        }),
      });

      const res = await app.inject({
        method: "POST",
        url: "/auth/reset-password",
        payload: { key: "valid", newPassword: "123" },
      });

      expect(res.statusCode).toBe(400);
    });
  });
});
