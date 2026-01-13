import type { FastifyInstance } from "fastify";
import { SalaryService } from "./salary.service";

import {
  createSalarySchema,
  getAllSalarySchema,
  getSalaryByIdSchema,
  getSalaryByEmployeeSchema,
  updateSalarySchema,
  deleteSalarySchema,
} from "./salary.schema";

import type {
  CreateSalaryDto,
  UpdateSalaryDto,
} from "@shared/types/src/payroll/salary.dto";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { sendMessage } from "../../utils/api-response";

export default async function salaryRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Salary"],
    },
  };

  app.post(
    "/salary",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...createSalarySchema,
      },
    },
    async (req, reply) => {
      const body = req.body as CreateSalaryDto;

      await SalaryService.create(body);
      return sendMessage(reply, "Salary structure created successfully", 201);
    }
  );

  app.get(
    "/salary",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getAllSalarySchema,
      },
    },
    async (req) => {
      return SalaryService.getAll(req.query as any);
    }
  );

  app.get(
    "/salary/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getSalaryByIdSchema,
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      try {
        return await SalaryService.getById(id);
      } catch (error: any) {
        if (error.message === "Salary structure not found") {
          return reply.code(404).send({ message: error.message });
        }
        throw error;
      }
    }
  );

  app.get(
    "/salary/employee/:employeeId",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getSalaryByEmployeeSchema,
      },
    },
    async (req, reply) => {
      const { employeeId } = req.params as { employeeId: string };

      try {
        return await SalaryService.getByEmployee(employeeId);
      } catch (error: any) {
        if (error.message === "Salary structure not found for this employee") {
          return reply.code(404).send({ message: error.message });
        }
        throw error;
      }
    }
  );

  app.put(
    "/salary/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...updateSalarySchema,
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = req.body as UpdateSalaryDto;

      try {
        await SalaryService.update(id, body);
        return sendMessage(reply, "Salary structure updated successfully");
      } catch (error: any) {
        if (error.message === "Salary structure not found") {
          return reply.code(404).send({ message: error.message });
        }
        throw error;
      }
    }
  );

  app.delete(
    "/salary/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...deleteSalarySchema,
      },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      try {
        await SalaryService.delete(id);
        return sendMessage(reply, "Salary structure deleted successfully");
      } catch (error: any) {
        if (error.message === "Salary structure not found") {
          return reply.code(404).send({ message: error.message });
        }
        throw error;
      }
    }
  );
}
