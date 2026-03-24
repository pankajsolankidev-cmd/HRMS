import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";
import {
  CreateHolidayDto,
  UpdateHolidayDto,
} from "@shared/types/src/Holiday/holiday.dto";
import { holidays } from "../../db/schema/holidays.schema";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { organization } from "../../db/schema";
import {
  ensureStorageDir,
  FILE_NAME,
  FILE_PATH,
  fileExists,
} from "../../utils/pdf-storage";
import fs from "fs";
import { deleteFileIfExists } from "../../utils/pdf-storage";

function parseExcelDate(value: any): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return null;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;

    const jsDate = new Date(parsed.y, parsed.m - 1, parsed.d);
    return jsDate.toISOString().split("T")[0];
  }

  return null;
}

function isDateRangeOverlap(
  existingFrom: string,
  existingTo: string,
  newFrom: string,
  newTo: string,
) {
  return existingFrom <= newTo && existingTo >= newFrom;
}

export async function createHolidayHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateHolidayDto;

  request.log.info(
    {
      action: "CREATE_HOLIDAY",
      title: body.title,
      fromDate: body.fromDate,
      toDate: body.toDate,
    },
    "Create holiday request received",
  );

  try {
    const fromDate = new Date(body.fromDate);
    const toDate = new Date(body.toDate);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return reply.code(400).send({
        message: "Invalid date format. Use yyyy-mm-dd",
      });
    }

    if (fromDate > toDate) {
      return reply.code(400).send({
        message: "fromDate cannot be greater than toDate",
      });
    }

    const overlapping = await db
      .select({ id: holidays.id })
      .from(holidays)
      .where(
        and(
          sql`${holidays.fromDate} <= ${body.toDate}`,
          sql`${holidays.toDate} >= ${body.fromDate}`,
        ),
      );

    if (overlapping.length) {
      request.log.warn(
        {
          action: "CREATE_HOLIDAY",
          fromDate: body.fromDate,
          toDate: body.toDate,
        },
        "Holiday overlap detected",
      );

      return reply.code(409).send({
        message: "Holiday dates overlap with existing holiday",
      });
    }

    await db.insert(holidays).values({
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      fromDate: body.fromDate,
      toDate: body.toDate,
    });

    deleteFileIfExists();

    request.log.info(
      {
        action: "CREATE_HOLIDAY",
        title: body.title,
      },
      "Holiday created successfully",
    );

    return sendMessage(reply, "Holiday created successfully", 201);
  } catch (err: any) {
    request.log.error(
      {
        action: "CREATE_HOLIDAY",
        err,
      },
      "Failed to create holiday",
    );

    const errorCode = err?.code || err?.cause?.code;

    if (errorCode === "23505") {
      return reply.code(409).send({
        message: "Holiday already exists for these dates",
      });
    }

    return reply.code(400).send({
      message: "Unable to create holiday",
    });
  }
}

export async function getHolidaysHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "title" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  try {
    const conditions = [];

    if (query?.search) {
      conditions.push(ilike(holidays.title, `%${query.search}%`));
    }

    const { page, limit, offset } = getPagination(query);

    const orderByClauses = [];

    if (!query?.sortBy) {
      orderByClauses.push(desc(holidays.updatedAt));
    } else {
      orderByClauses.push(
        query.sortOrder === "asc"
          ? asc(holidays[query.sortBy])
          : desc(holidays[query.sortBy]),
      );
    }

    let queryBuilder = db
      .select()
      .from(holidays)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...orderByClauses)
      .$dynamic();

    if (limit !== undefined && offset !== undefined) {
      queryBuilder = queryBuilder.limit(limit).offset(offset);
    }

    const data = await queryBuilder;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(holidays)
      .where(conditions.length ? and(...conditions) : undefined);

    return {
      data,
      meta: {
        page,
        limit: limit ?? null,
        total: Number(count),
      },
    };
  } catch (err) {
    request.log.error({ action: "GET_HOLIDAYS", err });
    return {
      data: [],
      meta: { page: 1, limit: null, total: 0 },
    };
  }
}

export async function getHolidayByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  try {
    const [holiday] = await db
      .select()
      .from(holidays)
      .where(eq(holidays.id, id));

    if (!holiday) {
      return reply.status(404).send({ message: "Holiday not found" });
    }

    return holiday;
  } catch (err) {
    request.log.error({ action: "GET_HOLIDAY_BY_ID", err });
    return reply.status(500).send({ message: "Failed to fetch holiday" });
  }
}

export async function updateHolidayHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateHolidayDto;

  try {
    if (body.fromDate && body.toDate) {
      const fromDate = new Date(body.fromDate);
      const toDate = new Date(body.toDate);

      if (fromDate > toDate) {
        return reply
          .status(400)
          .send({ message: "fromDate cannot be greater than toDate" });
      }

      const overlapping = await db
        .select()
        .from(holidays)
        .where(
          and(
            sql`${holidays.fromDate} <= ${body.toDate}`,
            sql`${holidays.toDate} >= ${body.fromDate}`,
            sql`${holidays.id} <> ${id}`,
          ),
        );

      if (overlapping.length) {
        return reply
          .status(400)
          .send({ message: "Holiday dates overlap with existing holiday" });
      }
    }

    const [updated] = await db
      .update(holidays)
      .set({ ...body })
      .where(eq(holidays.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ message: "Holiday not found" });
    }
    deleteFileIfExists();

    return sendMessage(reply, "Holiday updated successfully");
  } catch (err) {
    request.log.error({ action: "UPDATE_HOLIDAY", err });
    return reply.status(500).send({ message: "Failed to update holiday" });
  }
}

export async function deleteHolidayHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  try {
    const deleted = await db
      .delete(holidays)
      .where(eq(holidays.id, id))
      .returning({ id: holidays.id });

    if (!deleted.length) {
      return reply.status(404).send({ message: "Holiday not found" });
    }
    deleteFileIfExists();

    return sendMessage(reply, "Holiday deleted successfully");
  } catch (err) {
    request.log.error({ action: "DELETE_HOLIDAY", err });
    return reply.status(500).send({ message: "Failed to delete holiday" });
  }
}

export async function checkHolidayExcelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({ message: "Excel file is required" });
    }

    const buffer = await file.toBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    if (!rows.length) {
      return reply.status(400).send({ message: "Excel file is empty" });
    }

    const existingHolidays = await db.select().from(holidays);

    const validRows: any[] = [];
    const errorRows: any[] = [];
    const excelRangeSet = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      const title = row.title?.toString().trim();
      const fromDate = parseExcelDate(row.fromDate);
      const toDate = parseExcelDate(row.toDate);
      const description = row.description?.toString().trim();

      if (!title || !fromDate || !toDate) {
        errorRows.push({
          row: rowNumber,
          message: "Missing or invalid fields",
        });
        continue;
      }

      if (fromDate > toDate) {
        errorRows.push({
          row: rowNumber,
          message: "fromDate cannot be greater than toDate",
        });
        continue;
      }

      const rangeKey = `${fromDate}_${toDate}`;

      if (excelRangeSet.has(rangeKey)) {
        errorRows.push({
          row: rowNumber,
          message: "Duplicate holiday inside Excel file",
        });
        continue;
      }

      excelRangeSet.add(rangeKey);

      const overlap = existingHolidays.find((h) =>
        isDateRangeOverlap(h.fromDate, h.toDate, fromDate, toDate),
      );

      if (overlap) {
        errorRows.push({
          row: rowNumber,
          message: "Overlaps with existing holiday",
        });
        continue;
      }

      validRows.push({
        title,
        fromDate,
        toDate,
        description,
      });
    }

    return reply.send({
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errorRows.length,
      validRows,
      errorRows,
    });
  } catch (err) {
    request.log.error({ action: "PREVIEW_HOLIDAY_EXCEL", err });
    return reply.status(500).send({ message: "Preview failed" });
  }
}

export async function confirmHolidayUploadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as {
    holidays: {
      title: string;
      fromDate: string;
      toDate: string;
      description?: string;
    }[];
  };

  if (!body?.holidays?.length) {
    return reply.status(400).send({ message: "No holidays to insert" });
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(holidays).values(body.holidays);
    });

    deleteFileIfExists();

    return sendMessage(reply, "Holidays uploaded successfully");
  } catch (err) {
    request.log.error({ action: "CONFIRM_HOLIDAY_UPLOAD", err });
    return reply
      .status(500)
      .send({ message: "Upload failed, transaction rolled back" });
  }
}

export async function downloadHolidayTemplateHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const sampleData = [
      {
        title: "Sample",
        fromDate: "2026-11-10",
        toDate: "2026-11-12",
        description: "This is a sample holiday entry",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Holidays");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    reply
      .header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      )
      .header(
        "Content-Disposition",
        "attachment; filename=holiday-upload-template.xlsx",
      );

    return reply.send(buffer);
  } catch (err) {
    request.log.error({ action: "DOWNLOAD_HOLIDAY_TEMPLATE", err });
    return reply.status(500).send({ message: "Failed to generate template" });
  }
}

export async function exportHolidaysPdfHandler(request: any, reply: any) {
  try {
    ensureStorageDir();

    
    if (fileExists()) {
      return reply.sendFile(FILE_NAME);
    }

  
    const holidaysData = await db
      .select()
      .from(holidays)
      .orderBy(holidays.fromDate);

    const [org] = await db.select().from(organization);

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const stream = fs.createWriteStream(FILE_PATH);

    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    for (let i = 0; i < pageHeight; i += 20) {
      doc.rect(0, i, pageWidth, 20).fillOpacity(0.02).fill("#FBC4AB");
    }

    doc.fillOpacity(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor("#333")
      .text("Holiday Calendar", 0, 70, { align: "center" });

    doc
      .fontSize(16)
      .fillColor("#555")
      .text(org?.name || "Company Name", 0, 110, { align: "center" });

    let y = 170;

    holidaysData.forEach((h) => {
      doc.roundedRect(60, y, 450, 40, 10).fill("#FFF");

      doc
        .fillColor("#333")
        .fontSize(13)
        .text(h.title, 80, y + 10);

      doc
        .fillColor("#666")
        .fontSize(11)
        .text(`${h.fromDate} to ${h.toDate}`, 350, y + 12);

      y += 45;
    });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on("finish", () => resolve());
      stream.on("error", reject);
    });

    return reply.sendFile(FILE_NAME);
  } catch (err) {
    request.log.error({ action: "EXPORT_HOLIDAYS_PDF", err });
    return reply.status(500).send({ message: "Failed to generate PDF" });
  }
}
