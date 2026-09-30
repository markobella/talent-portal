import { prisma } from "@/lib/db";

export async function adminAuditLog(args: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: any;
}) {
  await prisma.adminAuditLog.create({
    data: {
      actorId: args.actorId,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId ?? null,
      ...(args.details === undefined ? {} : { details: args.details }),
    },
    select: { id: true },
  });
}
