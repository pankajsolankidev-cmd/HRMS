import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { departments } from "../../db/schema/department.schema";
import { sendMessage } from "../../utils/api-response";
import { getPagination } from "../../utils/pagination";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from "@shared/types/src/Department/department.dto";
import { employees } from "../../db/schema";

export async function createDepartmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateDepartmentDto;

  request.log.info(
    {
      action: "CREATE_DEPARTMENT",
      name: body.name,
    },
    "Create department request received",
  );

  try {
    await db.insert(departments).values(body);

    request.log.info(
      {
        action: "CREATE_DEPARTMENT",
        name: body.name,
      },
      "Department created successfully",
    );

    return sendMessage(reply, "Department created successfully", 201);
  } catch (err) {
    request.log.error(
      {
        action: "CREATE_DEPARTMENT",
        err,
      },
      "Failed to create department",
    );
    throw err;
  }
}

export async function getDepartmentsHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  request.log.info(
    {
      action: "GET_DEPARTMENTS",
      search: query.search,
      page: query.page,
      limit: query.limit,
    },
    "Get departments request received",
  );

  try {
    const conditions = [];

    if (query?.search) {
      conditions.push(ilike(departments.name, `%${query.search}%`));
    }

    const { page, limit, offset } = getPagination(query);

    const orderByClauses = [];

    if (!query?.sortBy) {
      orderByClauses.push(desc(departments.updatedAt));
    } else {
      orderByClauses.push(
        query.sortOrder === "asc"
          ? asc(departments[query.sortBy])
          : desc(departments[query.sortBy]),
      );
    }

    let queryBuilder = db
      .select()
      .from(departments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...orderByClauses)
      .$dynamic();

    if (limit !== undefined && offset !== undefined) {
      queryBuilder = queryBuilder.limit(limit).offset(offset);
    }

    const data = await queryBuilder;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(departments)
      .where(conditions.length ? and(...conditions) : undefined);

    request.log.info(
      {
        action: "GET_DEPARTMENTS",
        resultCount: data.length,
        total: Number(count),
      },
      "Departments fetched successfully",
    );

    return {
      data,
      meta: {
        page,
        limit: limit ?? null,
        total: Number(count),
      },
    };
  } catch (err) {
    request.log.error(
      {
        action: "GET_DEPARTMENTS",
        err,
      },
      "Failed to fetch departments",
    );
    throw err;
  }
}

export async function getDepartmentByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "GET_DEPARTMENT_BY_ID",
      departmentId: id,
    },
    "Get department by id request received",
  );

  try {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id));

    if (!department) {
      request.log.warn(
        {
          action: "GET_DEPARTMENT_BY_ID",
          departmentId: id,
        },
        "Department not found",
      );

      return reply.status(404).send({ message: "Department not found" });
    }

    request.log.info(
      {
        action: "GET_DEPARTMENT_BY_ID",
        departmentId: id,
      },
      "Department fetched successfully",
    );

    return department;
  } catch (err) {
    request.log.error(
      {
        action: "GET_DEPARTMENT_BY_ID",
        departmentId: id,
        err,
      },
      "Failed to fetch department",
    );
    throw err;
  }
}

export async function updateDepartmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateDepartmentDto;

  request.log.info(
    {
      action: "UPDATE_DEPARTMENT",
      departmentId: id,
      fields: Object.keys(body),
    },
    "Update department request received",
  );

  try {
    const [updated] = await db
      .update(departments)
      .set({ ...body })
      .where(eq(departments.id, id))
      .returning();

    if (!updated) {
      request.log.warn(
        {
          action: "UPDATE_DEPARTMENT",
          departmentId: id,
        },
        "Department not found for update",
      );

      return reply.status(404).send({ message: "Department not found" });
    }

    request.log.info(
      {
        action: "UPDATE_DEPARTMENT",
        departmentId: id,
      },
      "Department updated successfully",
    );

    return sendMessage(reply, "Department updated successfully");
  } catch (err) {
    request.log.error(
      {
        action: "UPDATE_DEPARTMENT",
        departmentId: id,
        err,
      },
      "Failed to update department",
    );
    throw err;
  }
}

export async function deleteDepartmentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  request.log.info(
    {
      action: "DELETE_DEPARTMENT",
      departmentId: id,
    },
    "Delete department request received",
  );

  try {
    const [department] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, id));

    if (!department) {
      request.log.warn(
        {
          action: "DELETE_DEPARTMENT",
          departmentId: id,
        },
        "Department not found",
      );

      return reply.status(404).send({
        message: "Department not found",
      });
    }

    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.departmentId, id))
      .limit(1);

    if (employee) {
      request.log.warn(
        {
          action: "DELETE_DEPARTMENT",
          departmentId: id,
        },
        "Department has assigned employees",
      );

      return reply.status(400).send({
        message:
          "Department cannot be deleted because employees are assigned to it",
      });
    }

    await db.delete(departments).where(eq(departments.id, id));

    request.log.info(
      {
        action: "DELETE_DEPARTMENT",
        departmentId: id,
      },
      "Department deleted successfully",
    );

    return sendMessage(reply, "Department deleted successfully");
  } catch (err) {
    request.log.error(
      {
        action: "DELETE_DEPARTMENT",
        departmentId: id,
        err,
      },
      "Failed to delete department",
    );

    return reply.status(500).send({
      message: "Unable to delete department",
    });
  }
}
