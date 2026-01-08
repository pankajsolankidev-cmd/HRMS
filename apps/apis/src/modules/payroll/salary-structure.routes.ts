import type { FastifyInstance } from "fastify";
import { SalaryStructureService } from "./salary-structure.service";
import type {
  CreateSalaryStructureDto,
  UpdateSalaryStructureDto,
} from "@shared/types/src/payroll/salary-structure.dto";

import {
  createSalaryStructureSchema,
  getAllSalaryStructuresSchema,
  getSalaryStructureByEmployeeSchema,
  getSalaryStructureByIdSchema,
  updateSalaryStructureSchema,
  deleteSalaryStructureSchema,
} from "./salary-structure.schema";
import { authenticate } from "../../plugins/auth.plugin";

export async function salaryStructureRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateSalaryStructureDto }>(
    "/salary",
    {
      schema: createSalaryStructureSchema,
      preHandler: authenticate,
    },
    async (req, reply) => {
      const data = await SalaryStructureService.create(req.body);
      return reply.code(201).send(data);
    }
  );

  app.get(
    "/salary",
    {
      schema: getAllSalaryStructuresSchema,
      preHandler: authenticate,
    },
    async () => {
      return SalaryStructureService.getAll();
    }
  );

  app.get<{ Params: { employeeId: string } }>(
    "/salary/employee/:employeeId",
    {
      schema: getSalaryStructureByEmployeeSchema,
      preHandler: authenticate,
    },
    async (req) => {
      return SalaryStructureService.getByEmployee(req.params.employeeId);
    }
  );

  app.get<{ Params: { id: string } }>(
    "/salary/:id",
    {
      schema: getSalaryStructureByIdSchema,
      preHandler: authenticate,
    },
    async (req) => {
      return SalaryStructureService.getById(req.params.id);
    }
  );

  app.patch<{
    Params: { id: string };
    Body: UpdateSalaryStructureDto;
  }>(
    "/salary/:id",
    {
      schema: updateSalaryStructureSchema,
      preHandler: authenticate,
    },
    async (req) => {
      return SalaryStructureService.update(req.params.id, req.body);
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/salary/:id",
    {
      schema: deleteSalaryStructureSchema,
      preHandler: authenticate,
    },
    async (req, reply) => {
      const data = await SalaryStructureService.delete(req.params.id);
      return reply.code(200).send(data);
    }
  );
}
