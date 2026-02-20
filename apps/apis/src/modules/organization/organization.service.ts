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
  request.log.info(
    { action: "GET_ORGANIZATION" },
    "Get organization request received",
  );

  try {
    const [org] = await db.select().from(organization);

    if (!org) {
      request.log.warn(
        { action: "GET_ORGANIZATION" },
        "Organization not found",
      );
      return reply.status(404).send({ message: "Organization not found" });
    }

    request.log.info(
      { action: "GET_ORGANIZATION" },
      "Organization fetched successfully",
    );

    return org;
  } catch (err) {
    request.log.error(
      { action: "GET_ORGANIZATION", err },
      "Failed to fetch organization",
    );
    return reply.status(500).send({ message: "Internal Server Error" });
  }
}

export async function upsertOrganizationHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateOrganizationDto;
  const { name, workingHours, weekOff } = body;

  request.log.info(
    {
      action: "UPSERT_ORGANIZATION",
      name,
    },
    "Upsert organization request received",
  );

  if (workingHours.start >= workingHours.end) {
    request.log.warn(
      {
        action: "UPSERT_ORGANIZATION",
        start: workingHours.start,
        end: workingHours.end,
      },
      "Invalid working hours",
    );

    return reply
      .status(400)
      .send({ message: "Working hours start time must be before end time" });
  }

  try {
    const [existingOrg] = await db.select().from(organization);

    if (!existingOrg) {
      await db.insert(organization).values({
        name,
        workingStartTime: workingHours.start,
        workingEndTime: workingHours.end,
        weekOff,
      });

      request.log.info(
        { action: "CREATE_ORGANIZATION", name },
        "Organization created successfully",
      );

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

    request.log.info(
      { action: "UPDATE_ORGANIZATION", organizationId: existingOrg.id },
      "Organization updated successfully",
    );

    return sendMessage(reply, "Organization updated successfully");
  } catch (err) {
    request.log.error(
      { action: "UPSERT_ORGANIZATION", err },
      "Failed to upsert organization",
    );

    return reply.status(500).send({ message: "Internal Server Error" });
  }
}
