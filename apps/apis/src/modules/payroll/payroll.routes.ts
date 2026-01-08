import type { FastifyInstance } from "fastify";
import { PayrollService } from "./payroll.service";
import type { ProcessPayrollDto } from "@shared/types/src/payroll/payroll.dto";

export async function payrollRoutes(app: FastifyInstance) {

  app.post<{ Body: ProcessPayrollDto }>(
    "/payrolls/process",
    async (req, reply) => {
      const processedBy = "06eefc3a-fdeb-4e6b-8443-604a384aff5d"; 

      const data = await PayrollService.process(req.body, processedBy);
      return reply.code(201).send(data);
    }
  );

  app.get("/payrolls", async () => {
    return PayrollService.getAll();
  });

  app.get<{ Params: { id: string } }>(
    "/payrolls/:id",
    async (req) => {
      return PayrollService.getById(req.params.id);
    }
  );
}
