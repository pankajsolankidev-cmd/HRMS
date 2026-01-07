import type { FastifyInstance } from "fastify";
import { SalaryStructureService } from "./salary-structure.service";
import type {
  CreateSalaryStructureDto,
  UpdateSalaryStructureDto,
} from "@shared/types/src/payroll/salary-structure.dto";

export async function salaryStructureRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateSalaryStructureDto }>(
    "/salary-structures",
    async (req, reply) => {
      const data = await SalaryStructureService.create(req.body);
      return reply.code(201).send(data);
    }
  );

  app.get("/salary-structures", async () => {
    return SalaryStructureService.getAll();
  });

  app.get<{ Params: { employeeId: string } }>(
    "/salary-structures/employee/:employeeId",
    async (req) => {
      return SalaryStructureService.getByEmployee(req.params.employeeId);
    }
  );

  app.get<{ Params: { id: string } }>("/salary-structures/:id", async (req) => {
    return SalaryStructureService.getById(req.params.id);
  });

  app.patch<{
    Params: { id: string };
    Body: UpdateSalaryStructureDto;
  }>("/salary-structures/:id", async (req) => {
    return SalaryStructureService.update(req.params.id, req.body);
  });

  app.delete<{ Params: { id: string } }>(
    "/salary-structures/:id",
    async (req, reply) => {
      const data = await SalaryStructureService.delete(req.params.id);
      return reply.code(200).send(data);
    }
  );
}
