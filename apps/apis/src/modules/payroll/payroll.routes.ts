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
        if (error.message === "FUTURE_PAYROLL_NOT_ALLOWED") {
          return reply.badRequest("Cannot process payroll for a future month");
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

  app.get("/payrolls", async () => {
    return PayrollService.getAll();
  });

  app.get<{ Params: { id: string } }>("/payrolls/:id", async (req) => {
    return PayrollService.getById(req.params.id);
  });
}
