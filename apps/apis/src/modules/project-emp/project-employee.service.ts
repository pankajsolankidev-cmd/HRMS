import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, inArray, and } from "drizzle-orm";
import { db } from "../../db";
import { projects } from "../../db/schema/projects.schema";
import { employees } from "../../db/schema/employees.schema";
import { sendMessage } from "../../utils/api-response";
import { AssignProjectEmployeesDto } from "@shared/types/src/Assign-Project-Employees/assign-project-employees.dto";
import { projectEmployees } from "../../db/schema";

export async function assignEmployeesToProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id: projectId } = request.params as { id: string };
  const body = request.body as AssignProjectEmployeesDto;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return reply.status(404).send({ message: "Project not found" });
  }

  const existingEmployees = await db
    .select({ id: employees.id })
    .from(employees)
    .where(inArray(employees.id, body.employeeIds));

  if (existingEmployees.length !== body.employeeIds.length) {
    return reply.status(400).send({
      message: "One or more employees are invalid",
    });
  }

  await db
    .delete(projectEmployees)
    .where(eq(projectEmployees.projectId, projectId));

  await db.insert(projectEmployees).values(
    body.employeeIds.map((employeeId) => ({
      projectId,
      employeeId,
    })),
  );

  return sendMessage(reply, "Employees assigned to project successfully", 201);
}

export async function getProjectEmployeesHandler(request: FastifyRequest) {
  const { id: projectId } = request.params as { id: string };

  const data = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
    })
    .from(projectEmployees)
    .innerJoin(employees, eq(projectEmployees.employeeId, employees.id))
    .where(eq(projectEmployees.projectId, projectId));

  return { data };
}

export async function removeEmployeeFromProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id: projectId, employeeId } = request.params as {
    id: string;
    employeeId: string;
  };

  const deleted = await db
    .delete(projectEmployees)
    .where(
      and(
        eq(projectEmployees.projectId, projectId),
        eq(projectEmployees.employeeId, employeeId),
      ),
    )
    .returning();

  if (!deleted.length) {
    return reply.status(404).send({
      message: "Employee not assigned to this project",
    });
  }

  return sendMessage(reply, "Employee removed from project successfully");
}
