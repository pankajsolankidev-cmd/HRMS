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
  getEmployeesSchema,
  getEmployeeByIdSchema,
  updateEmployeeSchema,
  deleteEmployeeSchema,
} from "./employee.schema";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";
import type { UpdateEmployeeDto } from "@shared/types/src/employee/update-employee.dto";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { sendMessage } from "../../utils/api-response";


export default async function employeeRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Employees"],
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
          userId: result.userId,
        });
      } catch (err: any) {
        if (err?.code === "23505") {
          return reply.code(409).send({
            message: "Employee with this email already exists",
          });
        }

        request.log.error(err);
        return reply.code(500).send({
          message: "Internal server error",
        });
      }
    }
  );

  app.get(
    "/employees",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getEmployeesSchema,
      },
    },
    async (request) => {
      const query = request.query as {
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: "firstName" | "createdAt";
        sortOrder?: "asc" | "desc";
      };

      return getEmployees(query);
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
        return reply.code(404).send({
          message: "Employee not found",
        });
      }

      return sendMessage(reply, "Employee updated successfully");
    }
  );

  // ✅ DELETE EMPLOYEE
  app.delete(
    "/employees/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...deleteEmployeeSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const deleted = await deleteEmployee(id);
      if (!deleted) {
        return reply.code(404).send({
          message: "Employee not found",
        });
      }

      return sendMessage(reply, "Employee deleted successfully");
    }
  );
}