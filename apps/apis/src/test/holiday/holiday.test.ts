vi.hoisted(() => {
  process.env.DEFAULT_EMPLOYEE_PASSWORD = "test123";
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";
  process.env.PORT = "0";
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../..";
import { db } from "../../db";
import { PERMISSIONS } from "../../db/schema/permissions.enums";
import { ROLES } from "../../db/schema/roles.enums";

import * as XLSX from "xlsx";

vi.mock("xlsx", () => ({
  read: vi.fn(),
  write: vi.fn(() => Buffer.from("mock-excel")),
  utils: {
    sheet_to_json: vi.fn(),
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
  },
  SSF: {
    parse_date_code: vi.fn((val) => {
      if (val === 45292) return { y: 2024, m: 1, d: 1 };
      return null;
    }),
  },
}));

vi.mock("pdfkit", () => {
  class PDFDocumentMock {
    _stream: any = null;
    page = { width: 600, height: 800 };
    pipe = vi.fn().mockImplementation((s) => {
      this._stream = s;
      return s;
    });
    rect = vi.fn().mockReturnThis();
    fillOpacity = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
    circle = vi.fn().mockReturnThis();
    fillColor = vi.fn().mockReturnThis();
    font = vi.fn().mockReturnThis();
    fontSize = vi.fn().mockReturnThis();
    text = vi.fn().mockReturnThis();
    roundedRect = vi.fn().mockReturnThis();
    end = vi.fn().mockImplementation(() => {
      if (this._stream) {
        this._stream.push(null);
      }
    });
  }
  return { default: PDFDocumentMock };
});

vi.mock("../../lib/redis", () => ({
  default: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("../../db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn((cb) =>
      cb({
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(true),
      }),
    ),
  },
}));

let mockUser: any;

vi.mock("../../middlewares/auth.middlewares", () => ({
  verifyAccessToken: async (req: any, reply: any) => {
    if (!mockUser) {
      reply.code(401).send({ message: "Unauthorized" });
      return;
    }
    req.user = mockUser;
  },
}));

vi.mock("../../middlewares/authorize.middleware", () => ({
  authorize: (permission: string) => async (req: any, reply: any) => {
    if (!mockUser?.permissions?.includes(permission)) {
      reply.code(403).send({ message: "Forbidden" });
      return;
    }
  },
}));

vi.mock("../../utils/socket", () => ({
  getIO: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  })),
  registerSocket: vi.fn(),
}));

let useMockFile = false;
app.addHook("preHandler", async (request: any) => {
  if (useMockFile) {
    request.file = vi.fn().mockResolvedValue({
      toBuffer: vi.fn().mockResolvedValue(Buffer.from("fake-excel")),
    });
  }
});

const createMockQuery = (resolvedValue: any) => {
  const chain: any = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    $dynamic: vi.fn(() => chain),
    returning: vi.fn(() => resolveAs(resolvedValue)),
    then: (resolve: any) => resolve(resolvedValue),
  };
  const resolveAs = (val: any) => {
    const p = Promise.resolve(val);
    (p as any).from = chain.from;
    (p as any).innerJoin = chain.innerJoin;
    (p as any).leftJoin = chain.leftJoin;
    (p as any).where = chain.where;
    (p as any).orderBy = chain.orderBy;
    (p as any).limit = chain.limit;
    (p as any).offset = chain.offset;
    (p as any).returning = chain.returning;
    return p;
  };
  return chain;
};

const mockHolidayId = "111e4567-e89b-12d3-a456-426614174011";

describe("HOLIDAY MODULE - PRODUCTION READY TEST SUITE", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUser = {
      id: "user-id",
      roles: [ROLES.ADMIN],
      permissions: Object.values(PERMISSIONS),
    };
  });

  const validPayload = {
    title: "New Year",
    fromDate: "2024-01-01",
    toDate: "2024-01-01",
    description: "New Year Holiday",
  };

  describe("createHolidayHandler", () => {
    it("should handle invalid date format", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/holidays",
        payload: { ...validPayload, fromDate: "invalid" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("should handle fromDate > toDate", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/holidays",
        payload: {
          ...validPayload,
          fromDate: "2024-01-02",
          toDate: "2024-01-01",
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it("should handle holiday overlap", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: "existing" }]),
      );
      const res = await app.inject({
        method: "POST",
        url: "/holidays",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(409);
    });

    it("should handle success", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.insert as any).mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(true),
      });
      const res = await app.inject({
        method: "POST",
        url: "/holidays",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(201);
    });

    it("should handle DB unique violation", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.insert as any).mockImplementationOnce(() => {
        const err: any = new Error("Unique constraint");
        err.code = "23505";
        throw err;
      });
      const res = await app.inject({
        method: "POST",
        url: "/holidays",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(409);
    });

    it("should handle catch block", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      const res = await app.inject({
        method: "POST",
        url: "/holidays",
        payload: validPayload,
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("getHolidaysHandler", () => {
    it("should handle success with filters", async () => {
      const mockData = [{ id: "1", title: "Holiday 1" }];
      (db.select as any).mockReturnValueOnce(createMockQuery(mockData));
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 1 }]));

      const res = await app.inject({
        method: "GET",
        url: "/holidays?search=test&page=1&limit=10&sortBy=title&sortOrder=asc",
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data).toEqual(mockData);
      expect(body.meta.total).toBe(1);
    });

    it("should handle empty results", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.select as any).mockReturnValueOnce(createMockQuery([{ count: 0 }]));

      const res = await app.inject({
        method: "GET",
        url: "/holidays",
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data).toEqual([]);
    });

    it("should handle catch block", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      const res = await app.inject({
        method: "GET",
        url: "/holidays",
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data).toEqual([]);
    });
  });

  describe("getHolidayByIdHandler", () => {
    it("should handle success", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: mockHolidayId }]),
      );
      const res = await app.inject({
        method: "GET",
        url: `/holidays/${mockHolidayId}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it("should handle not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      const res = await app.inject({
        method: "GET",
        url: `/holidays/${mockHolidayId}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it("should handle error", async () => {
      (db.select as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      const res = await app.inject({
        method: "GET",
        url: `/holidays/${mockHolidayId}`,
      });
      expect(res.statusCode).toBe(500);
    });
  });

  describe("updateHolidayHandler", () => {
    it("should handle overlap check and update success", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockHolidayId }]),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/holidays/${mockHolidayId}`,
        payload: {
          title: "Updated Title",
          fromDate: "2024-01-01",
          toDate: "2024-01-02",
        },
      });
      expect(res.statusCode).toBe(200);
    });

    it("should handle fromDate > toDate", async () => {
      const res = await app.inject({
        method: "PUT",
        url: `/holidays/${mockHolidayId}`,
        payload: { fromDate: "2024-01-02", toDate: "2024-01-01" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("should handle overlap detected", async () => {
      (db.select as any).mockReturnValueOnce(
        createMockQuery([{ id: "other" }]),
      );
      const res = await app.inject({
        method: "PUT",
        url: `/holidays/${mockHolidayId}`,
        payload: { fromDate: "2024-01-01", toDate: "2024-01-02" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("should handle not found", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.update as any).mockReturnValueOnce({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });

      const res = await app.inject({
        method: "PUT",
        url: `/holidays/${mockHolidayId}`,
        payload: { title: "Title" },
      });
      expect(res.statusCode).toBe(404);
    });

    it("should handle update DB error", async () => {
      (db.select as any).mockReturnValueOnce(createMockQuery([]));
      (db.update as any).mockImplementationOnce(() => {
        throw new Error("DB Error");
      });
      const res = await app.inject({
        method: "PUT",
        url: `/holidays/${mockHolidayId}`,
        payload: { title: "Title" },
      });
      expect(res.statusCode).toBe(500);
    });
  });

  describe("deleteHolidayHandler", () => {
    it("should handle success", async () => {
      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: mockHolidayId }]),
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/holidays/${mockHolidayId}`,
      });
      expect(res.statusCode).toBe(200);
    });

    it("should handle not found", async () => {
      (db.delete as any).mockReturnValueOnce({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/holidays/${mockHolidayId}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it("should handle error", async () => {
      (db.delete as any).mockImplementationOnce(() => {
        throw new Error("X");
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/holidays/${mockHolidayId}`,
      });
      expect(res.statusCode).toBe(500);
    });
  });

  describe("Excel & PDF Functionality", () => {
    describe("checkHolidayExcelHandler", () => {
      it("should handle missing file", async () => {
        const res = await app.inject({
          method: "POST",
          url: "/holidays/upload/check",
        });

        expect([400, 500]).toContain(res.statusCode);
      });

      it("should handle validation error inside excel loop", async () => {
        useMockFile = true;
        (XLSX.read as any).mockReturnValue({
          SheetNames: ["S1"],
          Sheets: { S1: {} },
        });
        (XLSX.utils.sheet_to_json as any).mockReturnValueOnce([
          { title: "H1", fromDate: "2024-01-01", toDate: "2024-01-01" },
          { title: "", fromDate: "2024-01-01", toDate: "2024-01-01" },
          { title: "H2", fromDate: "2024-01-02", toDate: "2024-01-01" },
          { title: "H1", fromDate: "2024-01-01", toDate: "2024-01-01" },
          { title: "Overlap", fromDate: "2024-01-10", toDate: "2024-01-10" },
        ]);
        (db.select as any).mockReturnValueOnce(
          createMockQuery([{ fromDate: "2024-01-10", toDate: "2024-01-10" }]),
        );

        const res = await app.inject({
          method: "POST",
          url: "/holidays/upload/check",
        });
        useMockFile = false;
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.validCount).toBe(1);
        expect(body.errorCount).toBe(4);
      });

      it("should handle excel numeric dates", async () => {
        useMockFile = true;
        (XLSX.read as any).mockReturnValue({
          SheetNames: ["S1"],
          Sheets: { S1: {} },
        });
        (XLSX.utils.sheet_to_json as any).mockReturnValueOnce([
          { title: "H1", fromDate: 45292, toDate: 45292 },
        ]);
        (db.select as any).mockReturnValueOnce(createMockQuery([]));

        const res = await app.inject({
          method: "POST",
          url: "/holidays/upload/check",
        });
        useMockFile = false;
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.body).validCount).toBe(1);
      });
    });

    describe("confirmHolidayUploadHandler", () => {
      it("should handle empty holidays list", async () => {
        const res = await app.inject({
          method: "POST",
          url: "/holidays/upload/confirm",
          payload: { holidays: [] },
        });
        expect(res.statusCode).toBe(400);
      });

      it("should handle success", async () => {
        const res = await app.inject({
          method: "POST",
          url: "/holidays/upload/confirm",
          payload: { holidays: [validPayload] },
        });
        expect(res.statusCode).toBe(200);
      });

      it("should handle error", async () => {
        (db.transaction as any).mockImplementationOnce(() => {
          throw new Error("X");
        });
        const res = await app.inject({
          method: "POST",
          url: "/holidays/upload/confirm",
          payload: { holidays: [validPayload] },
        });
        expect(res.statusCode).toBe(500);
      });
    });

    describe("downloadHolidayTemplateHandler", () => {
      it("should return excel template", async () => {
        const res = await app.inject({
          method: "GET",
          url: "/holidays/upload/template",
        });
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toContain("spreadsheetml.sheet");
      });
    });

    describe("exportHolidaysPdfHandler", () => {
      it("should return pdf stream", async () => {
        (db.select as any).mockReturnValueOnce(
          createMockQuery([
            { title: "H", fromDate: "2024-01-01", toDate: "2024-01-01" },
          ]),
        );
        (db.select as any).mockReturnValueOnce(
          createMockQuery([{ name: "Org" }]),
        );

        const res = await app.inject({
          method: "GET",
          url: "/holidays/export/pdf",
        });
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toBe("application/pdf");
      });

      it("should handle error", async () => {
        (db.select as any).mockImplementationOnce(() => {
          throw new Error("X");
        });
        const res = await app.inject({
          method: "GET",
          url: "/holidays/export/pdf",
        });
        expect(res.statusCode).toBe(500);
      });
    });
  });
});
