vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.PORT = "0";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";
import { ROLES } from "../../db/schema/roles.enums";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

vi.mock("../../lib/redis", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

let mockUser: any;

vi.mock("../../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any) => {
    if (!mockUser) throw new Error("Unauthorized");
    req.user = mockUser;
  },
}));

vi.mock("../../middlewares/authorize.middleware", () => ({
  authorize: () => (req: any, res: any, next: any) => next(),
}));

const createMockQuery = (resolvedValue: any) => {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    returning: vi.fn().mockResolvedValue(resolvedValue),
    execute: vi.fn().mockResolvedValue(resolvedValue),
    then: (resolve: any) => resolve(resolvedValue),
  };
  return chain;
};

const mockUserId = "11111111-1111-1111-1111-111111111111";
const mockNotificationId = "22222222-2222-2222-2222-222222222222";

describe("Notifications Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = {
      id: mockUserId,
      role: ROLES.ADMIN,
      permissions: [PERMISSIONS.LEAVE_VIEW_ALL],
    };
  });

  describe("GET /notifications", () => {
    it("should fetch my notifications successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            id: mockNotificationId,
            userId: mockUserId,
            message: "Test",
            isRead: false,
            type: "leave",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      );
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await app.inject({
        method: "GET",
        url: "/notifications",
      });

      if (res.statusCode !== 200)
        console.log("GET NOTIFICATIONS FAIL:", res.payload);
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toHaveLength(1);
      expect(body.meta.total).toBe(1);
    });

    it("should return 500 on database failure", async () => {
      (db.select as any).mockImplementationOnce(() => {
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          orderBy: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          offset: vi.fn(() => chain),
          then: vi.fn((resolve, reject) => reject(new Error("DB Error"))),
        };
        return chain;
      });

      const res = await app.inject({
        method: "GET",
        url: "/notifications",
      });

      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /notifications/unread-count", () => {
    it("should return unread notification count", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 5 }]));

      const res = await app.inject({
        method: "GET",
        url: "/notifications/unread-count",
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).count).toBe(5);
    });

    it("should return 500 on database failure", async () => {
      (db.select as any).mockImplementationOnce(() => {
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          then: vi.fn((resolve, reject) => reject(new Error("DB Error"))),
        };
        return chain;
      });

      const res = await app.inject({
        method: "GET",
        url: "/notifications/unread-count",
      });

      expect(res.statusCode).toBe(500);
    });
  });

  describe("PATCH /notifications/:id/read", () => {
    it("should mark notification as read", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockNotificationId }]),
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/notifications/${mockNotificationId}/read`,
      });

      expect(res.statusCode).toBe(200);
    });

    it("should return 404 if notification not found", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/notifications/${mockNotificationId}/read`,
      });

      expect(res.statusCode).toBe(404);
    });

    it("should return 500 on database failure in patch", async () => {
      (db.update as any).mockImplementationOnce(() => {
        const chain: any = {
          set: vi.fn(() => chain),
          where: vi.fn(() => chain),
          returning: vi.fn().mockRejectedValue(new Error("DB Error")),
        };
        return chain;
      });

      const res = await app.inject({
        method: "PATCH",
        url: `/notifications/${mockNotificationId}/read`,
      });

      expect(res.statusCode).toBe(500);
    });
  });

  describe("PATCH /notifications/read-all", () => {
    it("should mark all notifications as read", async () => {
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(),
      });

      const res = await app.inject({
        method: "PATCH",
        url: "/notifications/read-all",
      });

      expect(res.statusCode).toBe(200);
    });

    it("should return 500 on database failure in mark all read", async () => {
      (db.update as any).mockImplementationOnce(() => {
        const chain: any = {
          set: vi.fn(() => chain),
          where: vi.fn(() => chain),
          then: vi.fn((resolve, reject) => reject(new Error("DB Error"))),
        };
        return chain;
      });

      const res = await app.inject({
        method: "PATCH",
        url: "/notifications/read-all",
      });

      expect(res.statusCode).toBe(500);
    });
  });
});
