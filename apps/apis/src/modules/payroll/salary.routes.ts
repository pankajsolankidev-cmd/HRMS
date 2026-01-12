import type { FastifyInstance } from "fastify";
import { SalaryService } from "./salary.service";
import type {
  CreateSalaryDto,
  UpdateSalaryDto,
} from "@shared/types/src/payroll/salary.dto";

import {
  createSalarySchema,
  getAllSalarySchema,
  getSalaryByEmployeeSchema,
  getSalaryByIdSchema,
  updateSalarySchema,
  deleteSalarySchema,
} from "./salary.schema";

import { authenticate } from "../../plugins/auth.plugin";

export async function salaryStructureRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateSalaryDto }>(
    "/salary",
    {
      schema: createSalarySchema,
      preHandler: authenticate,
    },
    async (req, reply) => {
      const data = await SalaryService.create(req.body);
      return reply.code(201).send(data);
    }
  );

  app.get(
    "/salary",
    {
      schema: getAllSalarySchema,
      preHandler: authenticate,
    },
    async () => {
      return SalaryService.getAll();
    }
  );

  app.get<{ Params: { employeeId: string } }>(
    "/salary/employee/:employeeId",
    {
      schema: getSalaryByEmployeeSchema,
      preHandler: authenticate,
    },
    async (req) => {
      return SalaryService.getByEmployee(req.params.employeeId);
    }
  );

  app.get<{ Params: { id: string } }>(
    "/salary/:id",
    {
      schema: getSalaryByIdSchema,
      preHandler: authenticate,
    },
    async (req) => {
      return SalaryService.getById(req.params.id);
    }
  );

  app.patch<{
    Params: { id: string };
    Body: UpdateSalaryDto;
  }>(
    "/salary/:id",
    {
      schema: updateSalarySchema,
      preHandler: authenticate,
    },
    async (req) => {
      return SalaryService.update(req.params.id, req.body);
    }
  );

  app.delete<{ Params: { id: string } }>(
    "/salary/:id",
    {
      schema: deleteSalarySchema,
      preHandler: authenticate,
    },
    async (req, reply) => {
      const data = await SalaryService.delete(req.params.id);
      return reply.code(200).send(data);
    }
  );
}
