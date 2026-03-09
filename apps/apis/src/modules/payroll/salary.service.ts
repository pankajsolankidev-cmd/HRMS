import type { FastifyRequest, FastifyReply } from "fastify";
import { and, or, eq, ilike, gte, lte, asc, desc, sql, SQL } from "drizzle-orm";

import { db } from "../../db";
import { employees, salary } from "../../db/schema";
import { getPagination } from "../../utils/pagination";
import { calculateNetSalary } from "./utils/salary.utils";

import type {
  CreateSalaryDto,
  UpdateSalaryDto,
} from "@shared/types/src/payroll/salary.dto";

import { sendMessage } from "../../utils/api-response";

export async function createSalaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const payload = request.body as CreateSalaryDto;

  request.log.info(
    {
      action: "CREATE_SALARY",
      employeeId: payload.employeeId,
    },
    "Create salary request received",
  );

  const [existing] = await db
    .select()
    .from(salary)
    .where(eq(salary.employeeId, payload.employeeId));

  if (existing) {
    request.log.warn(
      {
        action: "CREATE_SALARY",
        employeeId: payload.employeeId,
      },
      "Salary structure already exists for employee",
    );

    return reply
      .code(409)
      .send({ message: "Salary structure already exists for this employee" });
  }

  const basicSalary = Number(payload.basicSalary);
  const tax = payload.tax !== undefined ? Number(payload.tax) : 0;
  const pf = payload.pf !== undefined ? Number(payload.pf) : 0;

  const netSalary = calculateNetSalary({
    basicSalary,
    tax,
    pf,
  });

  await db.insert(salary).values({
    employeeId: payload.employeeId,
    basicSalary: basicSalary.toFixed(2),
    tax: tax.toFixed(2),
    pf: pf.toFixed(2),
    netSalary: netSalary.toFixed(2),
    description: payload.description,
    appraisalDate: payload.appraisalDate
      ? new Date(payload.appraisalDate)
      : undefined,
  });

  request.log.info(
    {
      action: "CREATE_SALARY",
      employeeId: payload.employeeId,
      netSalary,
    },
    "Salary structure created successfully",
  );

  return sendMessage(reply, "Salary structure created successfully", 201);
}

export async function getSalariesHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    employeeId?: string;
    minSalary?: number;
    maxSalary?: number;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "basicSalary";
    sortOrder?: "asc" | "desc";
  };

  request.log.info(
    {
      action: "GET_SALARIES",
      employeeId: query.employeeId,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    "Get salaries request received",
  );

  const conditions: SQL[] = [eq(employees.isActive, true)];

  if (query?.search) {
    const searchCondition = or(
      ilike(employees.firstName, `%${query.search}%`),
      ilike(employees.lastName, `%${query.search}%`),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (query?.employeeId) {
    conditions.push(eq(salary.employeeId, query.employeeId));
  }

  if (query?.minSalary !== undefined) {
    conditions.push(gte(salary.basicSalary, query.minSalary.toString()));
  }

  if (query?.maxSalary !== undefined) {
    conditions.push(lte(salary.basicSalary, query.maxSalary.toString()));
  }

  const { page, limit, offset } = getPagination(query ?? {});
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orderByClauses = [];

  if (!query?.sortBy) {
    orderByClauses.push(desc(salary.updatedAt));
  } else {
    orderByClauses.push(
      query.sortOrder === "asc"
        ? asc(salary[query.sortBy])
        : desc(salary[query.sortBy]),
    );
  }

  let queryBuilder = db
    .select({
      salary,
      employee: {
        firstName: employees.firstName,
        lastName: employees.lastName,
      },
    })
    .from(salary)
    .innerJoin(employees, eq(salary.employeeId, employees.id))
    .where(and(...conditions))
    .orderBy(...orderByClauses)
    .$dynamic();

  if (limit !== undefined && offset !== undefined) {
    queryBuilder = queryBuilder.limit(limit).offset(offset);
  }

  const data = await queryBuilder;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(salary)
    .innerJoin(employees, eq(salary.employeeId, employees.id))
    .where(and(...conditions));

  request.log.info(
    {
      action: "GET_SALARIES",
      resultCount: data.length,
      total: Number(count),
      page,
      limit,
    },
    "Salaries fetched successfully",
  );

  return {
    data,
    meta: {
      page,
      limit: limit ?? null,
      total: Number(count),
    },
  };
}

export async function getSalaryByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "GET_SALARY_BY_ID",
      salaryId: id,
    },
    "Get salary by id request received",
  );

  const [salaryStructure] = await db
    .select()
    .from(salary)
    .where(eq(salary.id, id));

  if (!salaryStructure) {
    request.log.warn(
      {
        action: "GET_SALARY_BY_ID",
        salaryId: id,
      },
      "Salary structure not found",
    );

    return reply.code(404).send({ message: "Salary structure not found" });
  }

  request.log.info(
    {
      action: "GET_SALARY_BY_ID",
      salaryId: id,
    },
    "Salary structure fetched successfully",
  );

  return salaryStructure;
}

export async function getSalaryByEmployeeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { employeeId } = request.params as { employeeId: string };

  request.log.info(
    {
      action: "GET_SALARY_BY_EMPLOYEE",
      employeeId,
    },
    "Get salary by employee request received",
  );

  const [salaryStructure] = await db
    .select()
    .from(salary)
    .where(eq(salary.employeeId, employeeId));

  if (!salaryStructure) {
    request.log.warn(
      {
        action: "GET_SALARY_BY_EMPLOYEE",
        employeeId,
      },
      "Salary structure not found for employee",
    );

    return reply
      .code(404)
      .send({ message: "Salary structure not found for this employee" });
  }

  request.log.info(
    {
      action: "GET_SALARY_BY_EMPLOYEE",
      employeeId,
    },
    "Salary structure fetched successfully",
  );

  return salaryStructure;
}

export async function updateSalaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const payload = request.body as UpdateSalaryDto;

  request.log.info(
    {
      action: "UPDATE_SALARY",
      salaryId: id,
      fields: Object.keys(payload),
    },
    "Update salary request received",
  );

  const [existing] = await db.select().from(salary).where(eq(salary.id, id));

  if (!existing) {
    request.log.warn(
      {
        action: "UPDATE_SALARY",
        salaryId: id,
      },
      "Salary structure not found for update",
    );

    return reply.code(404).send({ message: "Salary structure not found" });
  }

  const basicSalary =
    payload.basicSalary !== undefined
      ? Number(payload.basicSalary)
      : Number(existing.basicSalary);

  const tax = payload.tax !== undefined ? payload.tax : Number(existing.tax);
  const pf = payload.pf !== undefined ? payload.pf : Number(existing.pf);

  const netSalary = calculateNetSalary({
    basicSalary,
    tax,
    pf,
  });

  await db
    .update(salary)
    .set({
      basicSalary: basicSalary.toFixed(2),
      tax: tax.toFixed(2),
      pf: pf.toFixed(2),
      netSalary: netSalary.toFixed(2),
      description: payload.description ?? existing.description,
      appraisalDate: payload.appraisalDate
        ? new Date(payload.appraisalDate)
        : existing.appraisalDate,
    })
    .where(eq(salary.id, id))
    .returning();

  request.log.info(
    {
      action: "UPDATE_SALARY",
      salaryId: id,
      netSalary,
    },
    "Salary structure updated successfully",
  );

  return sendMessage(reply, "Salary structure updated successfully");
}

export async function deleteSalaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "DELETE_SALARY",
      salaryId: id,
    },
    "Delete salary request received",
  );

  const [deleted] = await db
    .delete(salary)
    .where(eq(salary.id, id))
    .returning();

  if (!deleted) {
    request.log.warn(
      {
        action: "DELETE_SALARY",
        salaryId: id,
      },
      "Salary structure not found for delete",
    );

    return reply.code(404).send({ message: "Salary structure not found" });
  }

  request.log.info(
    {
      action: "DELETE_SALARY",
      salaryId: id,
    },
    "Salary structure deleted successfully",
  );

  return sendMessage(reply, "Salary structure deleted successfully");
}
