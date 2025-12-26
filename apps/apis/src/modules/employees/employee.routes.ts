import type { FastifyInstance } from "fastify";

import { createEmployee } from "./employee.service";

import type { CreateEmployeeDto } from "@shared/types/src/employee/employee.dto";

export default async function employeeRoutes(app: FastifyInstance) {
  app.post("/employees", async (request, reply) => {
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

      return reply.status(500).send({
        error: "Internal server error",
      });
    }
  });
}
