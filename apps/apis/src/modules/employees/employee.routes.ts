import type { FastifyInstance } from "fastify";

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "./employee.service";

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
    secured,

    async (request, reply) => {
      const body = request.body as CreateEmployeeDto;

      try {
        const result = await createEmployee(body);

        return reply.status(201).send({
          message: "Employee created successfully",
          employeeId: result.employeeId,
        });
      } catch (err: any) {
        if (err?.code === "23505") {
          return reply.status(409).send({
            error: "Employee with this email already exists",
          });
        }

        console.error("Create employee error:", err);
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );

  app.get("/employees", secured, async (_request, reply) => {
    const data = await getEmployees();
    return reply.send(data);
  });

  app.get("/employees/:id", secured, async (request, reply) => {
    const { id } = request.params as { id: string };

    const employee = await getEmployeeById(id);

    if (!employee) {
      return reply.status(404).send({ error: "Employee not found" });
    }

    return reply.send(employee);
  });

  app.put("/employees/:id", secured, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateEmployeeDto;

    const updated = await updateEmployee(id, body);

    if (!updated) {
      return reply.status(404).send({ error: "Employee not found" });
    }

    return reply.send({
      message: "Employee updated successfully",
    });
  });

  app.delete("/employees/:id", secured, async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await deleteEmployee(id);

    if (!deleted) {
      return reply.status(404).send({ error: "Employee not found" });
    }

    return reply.send({
      message: "Employee deleted successfully",
    });
  });
}
