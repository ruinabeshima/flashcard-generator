import { prisma } from "../prisma";
import { AuditEvent } from "../../prisma/generated/prisma/enums";

export default async function logAudit(
  userId: string,
  event: AuditEvent,
  description?: string,
  entityType?: string,
  entityId?: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        event,
        description: description ?? null,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
      },
    });
  } catch (error) {
    console.error(`Failed to log audit: ${error}`);
  }
}
