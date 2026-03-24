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
    set: vi.fn(() => chain),
    values: vi.fn(() => chain),
    execute: vi.fn().mockResolvedValue(resolvedValue),
    then: (resolve: any) => resolve(resolvedValue),
  };
  return chain;
};

const mockOrgId = "11111111-1111-1111-1111-111111111111";

describe("Organization Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = {
      id: "user-id",
      role: ROLES.ADMIN,
      permissions: [
        PERMISSIONS.ORGANIZATION_VIEW,
        PERMISSIONS.ORGANIZATION_UPDATE,
      ],
    };
  });

  describe("GET /organization", () => {
    it("should fetch organization successfully", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([
          {
            id: mockOrgId,
            name: "Test Org",
            workingStartTime: "09:00",
            workingEndTime: "18:00",
            weekOff: ["SUNDAY"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      );

      const res = await app.inject({
        method: "GET",
        url: "/organization",
      });

      if (res.statusCode !== 200) console.log("GET ORG FAIL:", res.payload);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).name).toBe("Test Org");
    });

    it("should return 404 if organization not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));

      const res = await app.inject({
        method: "GET",
        url: "/organization",
      });

      expect(res.statusCode).toBe(404);
    });

    it("should return 500 on database failure", async () => {
      (db.select as any).mockImplementationOnce(() => {
        const chain: any = {
          from: vi.fn(() => chain),
          then: vi.fn((resolve, reject) => reject(new Error("DB Error"))),
        };
        return chain;
      });

      const res = await app.inject({
        method: "GET",
        url: "/organization",
      });

      expect(res.statusCode).toBe(500);
    });
  });

  describe("POST /organization", () => {
    const validPayload = {
      name: "New Name",
      workingHours: { start: "09:00", end: "18:00" },
      weekOff: ["SUNDAY"],
    };

    it("should fail if working start time is after end time", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/organization",
        payload: {
          ...validPayload,
          workingHours: { start: "18:00", end: "09:00" },
        },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toContain(
        "Working hours start time must be before end time",
      );
    });

    it("should create organization if it doesn't exist", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.insert as any).mockReturnValueOnce(
        createMockQuery([{ id: mockOrgId }]),
      );

      const res = await app.inject({
        method: "POST",
        url: "/organization",
        payload: validPayload,
      });

      if (res.statusCode !== 201) console.log("CREATE ORG FAIL:", res.payload);
      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.body).message).toBe(
        "Organization created successfully",
      );
    });

    it("should fail if weekOff has duplicates during update", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockOrgId }]),
      );

      const res = await app.inject({
        method: "POST",
        url: "/organization",
        payload: {
          ...validPayload,
          weekOff: ["SUNDAY", "SUNDAY"],
        },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).message).toBe(
        "Duplicate weekOff days are not allowed",
      );
    });

    it("should update organization if it exists", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockOrgId }]),
      );
      (db.update as any).mockReturnValueOnce(
        createMockQuery([{ id: mockOrgId }]),
      );

      const res = await app.inject({
        method: "POST",
        url: "/organization",
        payload: validPayload,
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).message).toBe(
        "Organization updated successfully",
      );
    });

    it("should return 500 on database failure during upsert", async () => {
      (db.select as any).mockImplementationOnce(() => {
        const chain: any = {
          from: vi.fn(() => chain),
          then: vi.fn((resolve, reject) => reject(new Error("DB Error"))),
        };
        return chain;
      });

      const res = await app.inject({
        method: "POST",
        url: "/organization",
        payload: validPayload,
      });

      expect(res.statusCode).toBe(500);
    });
  });
});
