import type { FastifyInstance } from "fastify";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "./employee.service";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeeByIdSchema,
} from "./employee.schema";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";
import type { UpdateEmployeeDto } from "@shared/types/src/employee/update-employee.dto";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export default async function employeeRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/employees",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...createEmployeeSchema,
      },
    },
    async (request, reply) => {
      const body = request.body as CreateEmployeeDto;

      try {
        const result = await createEmployee(body);
        return reply.code(201).send({
          message: "Employee created successfully",
          employeeId: result.employeeId,
        });
      } catch (err: any) {
        if (err?.code === "23505") {
          return reply.code(409).send({
            error: "Employee with this email already exists",
          });
        }
        request.log.error(err);
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  app.get(
    "/employees",
    {
      ...secured,
      schema: {
        ...secured.schema,
        tags: ["Employees"],
      },
    },
    async () => {
      return await getEmployees();
    }
  );

  app.get(
    "/employees/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getEmployeeByIdSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const employee = await getEmployeeById(id);

      if (!employee) {
        return reply.code(404).send({ error: "Employee not found" });
      }

      return employee;
    }
  );

  app.put(
    "/employees/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...updateEmployeeSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateEmployeeDto;

      const updated = await updateEmployee(id, body);
      if (!updated) {
        return reply.code(404).send({ error: "Employee not found" });
      }

      return {
        message: "Employee updated successfully",
      };
    }
  );

  app.delete(
    "/employees/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        tags: ["Employees"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const deleted = await deleteEmployee(id);
      if (!deleted) {
        return reply.code(404).send({ error: "Employee not found" });
      }

      return {
        message: "Employee deleted successfully",
      };
    }
  );
}
