import type { FastifyInstance } from "fastify";
import { PayrollService } from "./payroll.service";
import type { ProcessPayrollDto } from "@shared/types/src/payroll/payroll.dto";

export async function payrollRoutes(app: FastifyInstance) {
  app.post<{ Body: ProcessPayrollDto }>(
    "/payrolls/process",
    async (req, reply) => {
      try {
        const processedBy = "06eefc3a-fdeb-4e6b-8443-604a384aff5d";

        const data = await PayrollService.process(req.body, processedBy);
        return reply.code(201).send(data);
      } catch (error: any) {
        if (error.message === "Cannot process payroll for a future month") {
          return reply.badRequest(error.message);
        }

        if (error.message === "Payroll already processed for this month") {
          return reply.conflict(error.message);
        }

        if (error.message === "Salary structure not found for employee") {
          return reply.notFound(error.message);
        }

        throw error;
      }
    }
  );

  app.get("/payrolls", async (req) => {
    const { month, year, employeeId } = req.query as {
      month?: string;
      year?: string;
      employeeId?: string;
    };

    return PayrollService.getAll({
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      employeeId,
    });
  });

  app.get<{ Params: { id: string } }>("/payrolls/:id", async (req, reply) => {
    try {
      return await PayrollService.getById(req.params.id);
    } catch (error: any) {
      if (error.message === "Payroll not found") {
        return reply.notFound(error.message);
      }
      throw error;
    }
  });

  app.get("/payrolls/summary", async (req, reply) => {
    const { month, year } = req.query as {
      month?: string;
      year?: string;
    };

    if (!month || !year) {
      return reply.badRequest("month and year are required");
    }

    return PayrollService.getSummary(Number(month), Number(year));
  });
}
