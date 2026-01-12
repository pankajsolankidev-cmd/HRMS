import type { FastifyInstance } from "fastify";
import { PayrollService } from "./payroll.service";

import type {
  ProcessPayrollDto,
  UpdatePayrollDto,
} from "@shared/types/src/payroll/payroll.dto";

import {
  processPayrollSchema,
  getPayrollsSchema,
  getPayrollByIdSchema,
  payrollSummarySchema,
  updatePayrollSchema,
  deletePayrollSchema,
} from "./payroll.schema";

import type { PayrollMonthType } from "../../db/schema/payroll.enums";

export async function payrollRoutes(app: FastifyInstance) {
  app.post<{ Body: ProcessPayrollDto }>(
    "/payrolls/process",
    { schema: processPayrollSchema },
    async (req, reply) => {
      try {
        if (!req.user) {
          return reply.code(401).send({ message: "Unauthorized" });
        }

        const processedBy = req.user.id;

        const data = await PayrollService.process(req.body, processedBy);
        return reply.code(201).send(data);
      } catch (error: any) {
        if (error.message === "Cannot process payroll for a future month") {
          return reply.code(400).send({ message: error.message });
        }

        if (error.message === "Payroll already processed for this month") {
          return reply.code(409).send({ message: error.message });
        }

        if (error.message === "Salary structure not found for employee") {
          return reply.code(404).send({ message: error.message });
        }

        throw error;
      }
    }
  );

  app.get("/payrolls", { schema: getPayrollsSchema }, async (req) => {
    const { month, year, employeeId, page, limit, sortBy, sortOrder } =
      req.query as {
        month?: PayrollMonthType;
        year?: number;
        employeeId?: string;
        page?: number;
        limit?: number;
        sortBy?: "year" | "netSalary" | "processedAt";
        sortOrder?: "asc" | "desc";
      };

    return PayrollService.getAll({
      month,
      year,
      employeeId,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  });

  app.get<{ Params: { id: string } }>(
    "/payrolls/:id",
    { schema: getPayrollByIdSchema },
    async (req, reply) => {
      try {
        return await PayrollService.getById(req.params.id);
      } catch (error: any) {
        if (error.message === "Payroll not found") {
          return reply.code(404).send({ message: error.message });
        }
        throw error;
      }
    }
  );

  app.patch<{
    Params: { id: string };
    Body: UpdatePayrollDto;
  }>("/payrolls/:id", { schema: updatePayrollSchema }, async (req, reply) => {
    try {
      const data = await PayrollService.update(req.params.id, req.body);
      return reply.send(data);
    } catch (error: any) {
      if (error.message === "Payroll not found") {
        return reply.code(404).send({ message: error.message });
      }
      throw error;
    }
  });

  app.delete<{ Params: { id: string } }>(
    "/payrolls/:id",
    { schema: deletePayrollSchema },
    async (req, reply) => {
      try {
        const data = await PayrollService.delete(req.params.id);
        return reply.send(data);
      } catch (error: any) {
        if (error.message === "Payroll not found") {
          return reply.code(404).send({ message: error.message });
        }
        throw error;
      }
    }
  );

  app.get(
    "/payrolls/summary",
    { schema: payrollSummarySchema },
    async (req) => {
      const { month, year } = req.query as {
        month: PayrollMonthType;
        year: number;
      };

      return PayrollService.getSummary(month, year);
    }
  );
}
