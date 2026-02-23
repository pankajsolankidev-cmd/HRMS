import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql, or } from "drizzle-orm";
import { db } from "../../db";
import { sendMessage } from "../../utils/api-response";
import { expenses } from "../../db/schema/expenses";
import type { CreateExpenseDto } from "@shared/types/src/expense/create-expense.dto";
import type { UpdateExpenseDto } from "@shared/types/src/expense/update-expense.dto";
import { ExpenseStatus } from "../../db/schema/expense.enums";
import { getPagination } from "../../utils/pagination";
import { employees, roles, userRoles } from "../../db/schema";
import { PERMISSIONS } from "../../db/schema/permissions.enums";
import { notifications } from "../../db/schema/notifications.schema";
import { getIO } from "../../utils/socket";

interface AuthUser {
  id: string;
  email: string;
  iat: number;
  exp: number;
  permissions?: string[];
}

export async function createExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateExpenseDto;
  const userId = request.user!.id;

  request.log.info(
    {
      action: "CREATE_EXPENSE",
      expenseType: body.expenseType,
      amount: body.amount,
    },
    "Create expense request received",
  );

  try {
    const expenseDate = new Date(body.expenseDate);

    if (isNaN(expenseDate.getTime())) {
      request.log.warn(
        {
          action: "CREATE_EXPENSE",
          expenseDate: body.expenseDate,
        },
        "Invalid expense date format",
      );

      return sendMessage(
        reply,
        "Invalid expenseDate. Use format yyyy-mm-dd",
        400,
      );
    }

    expenseDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (expenseDate > today) {
      request.log.warn(
        {
          action: "CREATE_EXPENSE",
          expenseDate: body.expenseDate,
        },
        "Expense date is in the future",
      );

      return sendMessage(reply, "expenseDate cannot be in the future", 400);
    }

    const [employee] = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
      })
      .from(employees)
      .where(eq(employees.userId, userId));

    if (!employee) {
      request.log.warn(
        {
          action: "CREATE_EXPENSE",
          userId,
        },
        "Employee profile not found",
      );

      return sendMessage(reply, "Employee profile not found", 400);
    }

    await db.insert(expenses).values({
      employeeId: employee.id,
      expenseType: body.expenseType,
      amount: String(body.amount),
      expenseDate: body.expenseDate,
      description: body.description ?? null,
      file: body.file ?? null,
    });

    const fullName = `${employee.firstName} ${employee.lastName}`;
    const message = `New expense submitted by ${fullName}`;

    const adminUsers = await db
      .select({
        userId: userRoles.userId,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(or(eq(roles.name, "ADMIN"), eq(roles.name, "HR")));

    for (const admin of adminUsers) {
      await db.insert(notifications).values({
        userId: admin.userId,
        message,
      });
    }

    const io = getIO();

    io.to("admin_room").emit("new_notification", {
      message,
    });

    request.log.info(
      {
        action: "CREATE_EXPENSE",
        employeeId: employee.id,
        amount: body.amount,
      },
      "Expense created successfully",
    );

    return sendMessage(reply, "Expense created successfully", 201);
  } catch (err) {
    request.log.error(
      {
        action: "CREATE_EXPENSE",
        err,
        userId,
      },
      "Failed to create expense",
    );

    return sendMessage(reply, "Failed to create expense", 500);
  }
}

export async function getExpensesHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: "expenseDate" | "createdAt" | "amount";
    sortOrder?: "asc" | "desc";
  };

  const userId = request.user!.id;

  request.log.info(
    {
      action: "GET_EXPENSES",
      userId,
      search: query.search,
      status: query.status,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    "Get expenses request received",
  );

  try {
    const conditions = [];

    const userRolesRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const roleNames = userRolesRows
      .map((r) => r.roleName?.toUpperCase())
      .filter(Boolean);

    const isHRorAdmin = roleNames.includes("HR") || roleNames.includes("ADMIN");

    request.log.debug(
      {
        action: "GET_EXPENSES",
        userId,
        roles: roleNames,
        isHRorAdmin,
      },
      "User role evaluation completed",
    );

    if (!isHRorAdmin) {
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, userId));

      if (!employee) {
        request.log.warn(
          {
            action: "GET_EXPENSES",
            userId,
          },
          "Employee profile not found for user",
        );

        return {
          data: [],
          meta: { page: 1, limit: 10, total: 0 },
        };
      }

      conditions.push(eq(expenses.employeeId, employee.id));
    }

    if (query.search) {
      conditions.push(ilike(expenses.expenseType, `%${query.search}%`));
    }

    if (query.status) {
      conditions.push(eq(expenses.status, query.status as any));
    }

    const { page, limit, offset } = getPagination(query);

    const orderByClauses = [];

    if (!query?.sortBy) {
      orderByClauses.push(desc(expenses.updatedAt));
    } else {
      orderByClauses.push(
        query.sortOrder === "asc"
          ? asc(expenses[query.sortBy])
          : desc(expenses[query.sortBy]),
      );
    }

    let queryBuilder = db
      .select()
      .from(expenses)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...orderByClauses)
      .$dynamic();

    if (limit !== undefined && offset !== undefined) {
      queryBuilder = queryBuilder.limit(limit).offset(offset);
    }

    const data = await queryBuilder;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(conditions.length ? and(...conditions) : undefined);

    request.log.info(
      {
        action: "GET_EXPENSES",
        userId,
        resultCount: data.length,
        total: Number(count),
        page,
        limit,
      },
      "Expenses fetched successfully",
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
        action: "GET_EXPENSES",
        userId,
        err,
      },
      "Failed to fetch expenses",
    );

    return {
      data: [],
      meta: { page: 1, limit: 10, total: 0 },
    };
  }
}

export async function getExpenseByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const userId = request.user!.id;

  const canViewAll = (request.user as AuthUser)?.permissions?.includes(
    PERMISSIONS.EXPENSE_VIEW_ALL,
  );

  request.log.info(
    {
      action: "GET_EXPENSE_BY_ID",
      expenseId: id,
      userId,
      canViewAll,
    },
    "Get expense by id request received",
  );

  try {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));

    if (!expense) {
      request.log.warn(
        {
          action: "GET_EXPENSE_BY_ID",
          expenseId: id,
          userId,
        },
        "Expense not found",
      );

      return reply.status(404).send({ message: "Expense not found" });
    }

    if (!canViewAll) {
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, userId));

      if (!employee || expense.employeeId !== employee.id) {
        request.log.warn(
          {
            action: "GET_EXPENSE_BY_ID",
            expenseId: id,
            userId,
          },
          "Unauthorized expense access attempt",
        );

        return reply.status(403).send({
          message: "You are not authorized to view this expense",
        });
      }
    }

    request.log.info(
      {
        action: "GET_EXPENSE_BY_ID",
        expenseId: id,
        userId,
      },
      "Expense fetched successfully",
    );

    return expense;
  } catch (err) {
    request.log.error(
      {
        action: "GET_EXPENSE_BY_ID",
        expenseId: id,
        userId,
        err,
      },
      "Failed to fetch expense",
    );

    return reply.status(500).send({
      message: "Failed to fetch expense",
    });
  }
}
export async function updateExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateExpenseDto;
  const userId = request.user!.id;

  request.log.info(
    {
      action: "UPDATE_EXPENSE",
      expenseId: id,
      userId,
      fields: Object.keys(body),
    },
    "Update expense request received",
  );

  try {
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));

    if (!existing) {
      request.log.warn(
        {
          action: "UPDATE_EXPENSE",
          expenseId: id,
          userId,
        },
        "Expense not found",
      );

      return reply.status(404).send({ message: "Expense not found" });
    }

    if (existing.status !== "DRAFT") {
      request.log.warn(
        {
          action: "UPDATE_EXPENSE",
          expenseId: id,
          status: existing.status,
        },
        "Expense update not allowed for current status",
      );

      return reply
        .status(400)
        .send({ message: "Only DRAFT expenses can be updated" });
    }

    if (body.expenseDate) {
      const expenseDate = new Date(body.expenseDate);

      if (isNaN(expenseDate.getTime())) {
        request.log.warn(
          {
            action: "UPDATE_EXPENSE",
            expenseId: id,
            expenseDate: body.expenseDate,
          },
          "Invalid expense date format",
        );

        return reply.status(400).send({
          message: "Invalid expenseDate. Use format yyyy-mm-dd",
        });
      }

      expenseDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (expenseDate > today) {
        request.log.warn(
          {
            action: "UPDATE_EXPENSE",
            expenseId: id,
            expenseDate: body.expenseDate,
          },
          "Expense date is in the future",
        );

        return reply.status(400).send({
          message: "expenseDate cannot be in the future",
        });
      }
    }

    await db
      .update(expenses)
      .set({
        expenseType: body.expenseType,
        description: body.description,
        file: body.file,
        amount: body.amount !== undefined ? body.amount.toString() : undefined,
        expenseDate: body.expenseDate,
      })
      .where(eq(expenses.id, id));

    request.log.info(
      {
        action: "UPDATE_EXPENSE",
        expenseId: id,
        userId,
      },
      "Expense updated successfully",
    );

    return sendMessage(reply, "Expense updated successfully");
  } catch (err) {
    request.log.error(
      {
        action: "UPDATE_EXPENSE",
        expenseId: id,
        userId,
        err,
      },
      "Failed to update expense",
    );

    return reply.status(500).send({
      message: "Failed to update expense",
    });
  }
}

export async function deleteExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const userId = request.user!.id;

  request.log.info(
    {
      action: "DELETE_EXPENSE",
      expenseId: id,
      userId,
    },
    "Delete expense request received",
  );

  try {
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));

    if (!existing) {
      request.log.warn(
        {
          action: "DELETE_EXPENSE",
          expenseId: id,
          userId,
        },
        "Expense not found",
      );

      return reply.status(404).send({ message: "Expense not found" });
    }

    if (existing.status !== "DRAFT") {
      request.log.warn(
        {
          action: "DELETE_EXPENSE",
          expenseId: id,
          status: existing.status,
        },
        "Expense delete not allowed for current status",
      );

      return reply
        .status(400)
        .send({ message: "Only DRAFT expenses can be deleted" });
    }

    await db.delete(expenses).where(eq(expenses.id, id));

    request.log.info(
      {
        action: "DELETE_EXPENSE",
        expenseId: id,
        userId,
      },
      "Expense deleted successfully",
    );

    return sendMessage(reply, "Expense deleted successfully");
  } catch (err) {
    request.log.error(
      {
        action: "DELETE_EXPENSE",
        expenseId: id,
        userId,
        err,
      },
      "Failed to delete expense",
    );

    return reply.status(500).send({
      message: "Failed to delete expense",
    });
  }
}

export async function getExpenseSummaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { fromDate, toDate } = request.query as {
    fromDate?: string;
    toDate?: string;
  };

  const userId = request.user!.id;

  request.log.info(
    {
      action: "GET_EXPENSE_SUMMARY",
      userId,
      fromDate,
      toDate,
    },
    "Get expense summary request received",
  );

  try {
    if (!fromDate || !toDate) {
      request.log.warn(
        {
          action: "GET_EXPENSE_SUMMARY",
          userId,
        },
        "fromDate or toDate missing",
      );

      return reply.status(400).send({
        message: "fromDate and toDate are required (format: yyyy-mm-dd)",
      });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      request.log.warn(
        {
          action: "GET_EXPENSE_SUMMARY",
          userId,
          fromDate,
          toDate,
        },
        "Invalid date format",
      );

      return reply.status(400).send({
        message: "Invalid date format. Use yyyy-mm-dd",
      });
    }

    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    if (from > to) {
      request.log.warn(
        {
          action: "GET_EXPENSE_SUMMARY",
          userId,
          fromDate,
          toDate,
        },
        "fromDate greater than toDate",
      );

      return reply.status(400).send({
        message: "fromDate must be less than or equal to toDate",
      });
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (to > now || from > now) {
      request.log.warn(
        {
          action: "GET_EXPENSE_SUMMARY",
          userId,
          fromDate,
          toDate,
        },
        "Date range is in the future",
      );

      return reply.status(400).send({
        message: "Dates cannot be in the future",
      });
    }

    const userRolesRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const roleNames = userRolesRows
      .map((r) => r.roleName?.toUpperCase())
      .filter(Boolean);

    const isHRorAdmin = roleNames.includes("HR") || roleNames.includes("ADMIN");

    let whereCondition;

    if (isHRorAdmin) {
      whereCondition = sql`${expenses.expenseDate} BETWEEN ${from} AND ${to}`;
    } else {
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, userId));

      if (!employee) {
        request.log.warn(
          {
            action: "GET_EXPENSE_SUMMARY",
            userId,
          },
          "Employee profile not found",
        );

        return reply.status(400).send({
          message: "Employee profile not found",
        });
      }

      whereCondition = and(
        eq(expenses.employeeId, employee.id),
        sql`${expenses.expenseDate} BETWEEN ${from} AND ${to}`,
      );
    }

    const [summary] = await db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(${expenses.amount}), '0')`,
        totalCount: sql<number>`COUNT(${expenses.id})`,
      })
      .from(expenses)
      .where(whereCondition);

    request.log.info(
      {
        action: "GET_EXPENSE_SUMMARY",
        userId,
        fromDate,
        toDate,
        totalAmount: summary.totalAmount,
        totalExpenses: summary.totalCount,
      },
      "Expense summary fetched successfully",
    );

    return {
      fromDate,
      toDate,
      totalAmount: summary.totalAmount,
      totalExpenses: summary.totalCount,
    };
  } catch (err) {
    request.log.error(
      {
        action: "GET_EXPENSE_SUMMARY",
        userId,
        fromDate,
        toDate,
        err,
      },
      "Failed to fetch expense summary",
    );

    return reply.status(500).send({
      message: "Failed to fetch expense summary",
    });
  }
}

export async function createExpenseRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const userId = request.user!.id;

  request.log.info(
    {
      action: "CREATE_EXPENSE_REQUEST",
      expenseId: id,
      userId,
    },
    "Create expense request received",
  );

  try {
    const [existing] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));

    if (!existing) {
      request.log.warn(
        {
          action: "CREATE_EXPENSE_REQUEST",
          expenseId: id,
          userId,
        },
        "Expense not found",
      );

      return reply.status(404).send({ message: "Expense not found" });
    }

    if (existing.status !== "DRAFT") {
      request.log.warn(
        {
          action: "CREATE_EXPENSE_REQUEST",
          expenseId: id,
          status: existing.status,
        },
        "Expense request creation not allowed for current status",
      );

      return reply.status(400).send({
        message: "Only DRAFT expenses can be created",
      });
    }

    await db
      .update(expenses)
      .set({
        status: "CREATED",
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id));

    request.log.info(
      {
        action: "CREATE_EXPENSE_REQUEST",
        expenseId: id,
        userId,
      },
      "Expense request created successfully",
    );

    return sendMessage(reply, "Expense request created successfully");
  } catch (err) {
    request.log.error(
      {
        action: "CREATE_EXPENSE_REQUEST",
        expenseId: id,
        userId,
        err,
      },
      "Failed to create expense request",
    );

    return reply.status(500).send({
      message: "Failed to create expense request",
    });
  }
}
export async function approveExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const userId = request.user!.id;

  request.log.info(
    {
      action: "APPROVE_EXPENSE",
      expenseId: id,
      userId,
    },
    "Approve expense request received",
  );

  try {
    const [existing] = await db
      .select({
        id: expenses.id,
        status: expenses.status,
        employeeId: expenses.employeeId,
      })
      .from(expenses)
      .where(eq(expenses.id, id));

    if (!existing) {
      request.log.warn(
        {
          action: "APPROVE_EXPENSE",
          expenseId: id,
          userId,
        },
        "Expense not found",
      );

      return reply.status(404).send({ message: "Expense not found" });
    }

    if (existing.status !== "CREATED") {
      request.log.warn(
        {
          action: "APPROVE_EXPENSE",
          expenseId: id,
          status: existing.status,
        },
        "Expense approval not allowed for current status",
      );

      return reply.status(400).send({
        message: "Only CREATED expenses can be approved",
      });
    }

    await db
      .update(expenses)
      .set({
        status: "APPROVED",
        approvedBy: userId,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id));

    const [employee] = await db
      .select({
        userId: employees.userId,
      })
      .from(employees)
      .where(eq(employees.id, existing.employeeId));

    if (employee?.userId) {
      const [approver] = await db
        .select({
          firstName: employees.firstName,
          lastName: employees.lastName,
        })
        .from(employees)
        .where(eq(employees.userId, userId));

      const approverName = approver
        ? `${approver.firstName} ${approver.lastName}`
        : "HR/Admin";

      const message = `Your expense has been approved by ${approverName}`;

      await db.insert(notifications).values({
        userId: employee.userId,
        message,
      });

      const io = getIO();

      io.to(`user_${employee.userId}`).emit("new_notification", {
        message,
      });
    }

    request.log.info(
      {
        action: "APPROVE_EXPENSE",
        expenseId: id,
        approvedBy: userId,
      },
      "Expense approved successfully",
    );

    return sendMessage(reply, "Expense approved successfully");
  } catch (err) {
    request.log.error(
      {
        action: "APPROVE_EXPENSE",
        expenseId: id,
        userId,
        err,
      },
      "Failed to approve expense",
    );

    return reply.status(500).send({
      message: "Failed to approve expense",
    });
  }
}

export async function rejectExpenseHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const { reason } = request.body as { reason?: string };
  const userId = request.user!.id;

  request.log.info(
    {
      action: "REJECT_EXPENSE",
      expenseId: id,
      userId,
    },
    "Reject expense request received",
  );

  try {
    const [existing] = await db
      .select({
        id: expenses.id,
        status: expenses.status,
        employeeId: expenses.employeeId,
      })
      .from(expenses)
      .where(eq(expenses.id, id));

    if (!existing) {
      request.log.warn(
        {
          action: "REJECT_EXPENSE",
          expenseId: id,
          userId,
        },
        "Expense not found",
      );

      return reply.status(404).send({ message: "Expense not found" });
    }

    if (existing.status !== "CREATED") {
      request.log.warn(
        {
          action: "REJECT_EXPENSE",
          expenseId: id,
          status: existing.status,
        },
        "Expense rejection not allowed for current status",
      );

      return reply.status(400).send({
        message: "Only CREATED expenses can be rejected",
      });
    }

    if (!reason || !reason.trim()) {
      request.log.warn(
        {
          action: "REJECT_EXPENSE",
          expenseId: id,
        },
        "Rejection reason missing",
      );

      return reply.status(400).send({
        message: "Rejection reason is required",
      });
    }

    await db
      .update(expenses)
      .set({
        status: "REJECTED",
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        approvedBy: null,
        approvedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id));

    const [employee] = await db
      .select({
        userId: employees.userId,
      })
      .from(employees)
      .where(eq(employees.id, existing.employeeId));

    if (employee?.userId) {
      const [approver] = await db
        .select({
          firstName: employees.firstName,
          lastName: employees.lastName,
        })
        .from(employees)
        .where(eq(employees.userId, userId));

      const approverName = approver
        ? `${approver.firstName} ${approver.lastName}`
        : "HR/Admin";

      const message = `Your expense was rejected by ${approverName}. Reason: ${reason}`;

      await db.insert(notifications).values({
        userId: employee.userId,
        message,
      });

      const io = getIO();

      io.to(`user_${employee.userId}`).emit("new_notification", {
        message,
      });
    }

    request.log.info(
      {
        action: "REJECT_EXPENSE",
        expenseId: id,
        rejectedBy: userId,
      },
      "Expense rejected successfully",
    );

    return sendMessage(reply, "Expense rejected successfully");
  } catch (err) {
    request.log.error(
      {
        action: "REJECT_EXPENSE",
        expenseId: id,
        userId,
        err,
      },
      "Failed to reject expense",
    );

    return reply.status(500).send({
      message: "Failed to reject expense",
    });
  }
}
