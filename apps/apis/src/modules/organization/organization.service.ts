import type { FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { organization } from "../../db/schema/organization.schema";
import type { CreateOrganizationDto } from "@shared/types/src/organization/create-organization.dto";
import { sendMessage } from "../../utils/api-response";

export async function getOrganizationHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const [org] = await db.select().from(organization);

  if (!org) {
    return reply.status(404).send({ message: "Organization not found" });
  }
  return org;
}

export async function upsertOrganizationHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateOrganizationDto;

  const { name, workingHours, weekOff } = body;

  if (workingHours.start >= workingHours.end) {
    return reply
      .status(400)
      .send({ message: "Working hours start time must be before end time" });
  }

  const [existingOrg] = await db.select().from(organization);

  if (!existingOrg) {
    await db.insert(organization).values({
      name,
      workingStartTime: workingHours.start,
      workingEndTime: workingHours.end,
      weekOff,
    });

    return sendMessage(reply, "Organization created successfully", 201);
  }

  await db
    .update(organization)
    .set({
      name,
      workingStartTime: workingHours.start,
      workingEndTime: workingHours.end,
      weekOff,
    })
    .where(eq(organization.id, existingOrg.id));

  return sendMessage(reply, "Organization updated successfully");
}
