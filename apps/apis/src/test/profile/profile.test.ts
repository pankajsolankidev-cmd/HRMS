vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.PORT = "0";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn(),
    query: {
      organization: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("../../utils/socket", () => ({
  getIO: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  })),
  registerSocket: vi.fn(),
}));

vi.mock("../../lib/redis", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    on: vi.fn(),
    defineCommand: vi.fn(),
  },
}));

let mockUser: any;

vi.mock("../../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any) => {
    req.user = mockUser;
  },
}));

vi.mock("../../middlewares/authorize.middleware", () => ({
  authorize: () => (req: any, res: any, next: any) => next(),
}));

const createMockQuery = (resolvedValue: any) => {
  const chain: any = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    then: vi.fn((onFulfilled) =>
      Promise.resolve(resolvedValue).then(onFulfilled),
    ),
    catch: vi.fn((onRejected) =>
      Promise.resolve(resolvedValue).catch(onRejected),
    ),
  };
  return chain;
};

const mockUserId = "4192bff0-e1e0-43ce-a4db-912808c32493";
const mockEmployeeId = "11111111-1111-1111-1111-111111111111";

const validBaseRow = {
  id: mockEmployeeId,
  firstName: "Test",
  lastName: "User",
  email: "test@techne.com",
  joiningDate: "2024-01-01",
  userId: mockUserId,
  welcome: { welcomewithWhatsapp: true },
  documents: { generateOfferLetter: true },
  position: null,
  department: null,
  manager: null,
  system: null,
};

describe("Profile Module", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = { id: mockUserId };
    (db.select as any).mockReturnValue(createMockQuery([]));
    (db.query.organization.findFirst as any).mockResolvedValue({
      id: "org1",
      name: "Techne",
      workingStartTime: "09:00",
      workingEndTime: "18:00",
      weekOff: ["Sunday"],
    });
  });

  it("should fetch full profile successfully (multiple components)", async () => {
    const mockRows = [
      {
        ...validBaseRow,
        position: { id: "pos1", name: "Dev" },
        department: { id: "dept1", name: "Engineering" },
        manager: {
          id: "mgr1",
          firstName: "Boss",
          lastName: "Man",
          email: "boss@techne.com",
        },
        system: {
          id: "sys1",
          name: "Laptop",
          componentId: "comp1",
          componentName: "Keyboard",
          componentCode: "KB-01",
          componentDescription: "USB Keyboard",
        },
      },
      {
        ...validBaseRow,
        position: { id: "pos1", name: "Dev" },
        department: { id: "dept1", name: "Engineering" },
        manager: {
          id: "mgr1",
          firstName: "Boss",
          lastName: "Man",
          email: "boss@techne.com",
        },
        system: {
          id: "sys1",
          name: "Laptop",
          componentId: "comp2",
          componentName: "Mouse",
          componentCode: "MS-01",
          componentDescription: "Opt Mouse",
        },
      },
    ];

    (db.select as any).mockReturnValueOnce(createMockQuery(mockRows));

    const res = await (app.inject({
      method: "GET",
      url: "/profile",
    }) as any);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.organization).toBeDefined();
    expect(body.profile.employee.id).toBe(mockEmployeeId);
    expect(body.profile.employee.system.components).toHaveLength(2);
  });

  it("should fetch minimal profile successfully (null joins)", async () => {
    (db.select as any).mockReturnValueOnce(createMockQuery([validBaseRow]));

    const res = await (app.inject({
      method: "GET",
      url: "/profile",
    }) as any);

    expect(res.statusCode).toBe(200);
  });

  it("should return 404 if profile not found", async () => {
    (db.select as any).mockReturnValueOnce(createMockQuery([]));

    const res = await (app.inject({
      method: "GET",
      url: "/profile",
    }) as any);

    expect(res.statusCode).toBe(404);
  });

  it("should use null if organization missing", async () => {
    (db.query.organization.findFirst as any).mockResolvedValue(null);
    (db.select as any).mockReturnValueOnce(createMockQuery([validBaseRow]));

    const res = await (app.inject({
      method: "GET",
      url: "/profile",
    }) as any);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).organization).toBeNull();
  });

  it("should return 500 on db error", async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error("DB Error");
    });

    const res = await (app.inject({
      method: "GET",
      url: "/profile",
    }) as any);

    expect(res.statusCode).toBe(500);
  });

  it("should skip rows without id", async () => {
    const mockRows = [
      { ...validBaseRow, id: null, firstName: "Ghost" },
      { ...validBaseRow, firstName: "Real" },
    ];

    (db.select as any).mockReturnValueOnce(createMockQuery(mockRows));

    const res = await (app.inject({
      method: "GET",
      url: "/profile",
    }) as any);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).profile.employee.firstName).toBe("Real");
  });
});
