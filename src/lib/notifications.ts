import { prisma } from "@/lib/db";

export async function notifyUsers(args: {
  userIds: string[];
  type:
    | "OFFER_SUBMITTED"
    | "OFFER_APPROVED"
    | "OFFER_REJECTED"
    | "OFFER_ACCEPTED"
    | "OFFER_DECLINED"
    | "OFFER_MESSAGE"
    | "MEDIA_SUBMITTED"
    | "MEDIA_APPROVED"
    | "MEDIA_DENIED"
    | "PROFILE_SUBMITTED"
    | "PROFILE_APPROVED"
    | "PROFILE_REJECTED";
  title: string;
  body?: string | null;
  data?: any;
}) {
  const ids = Array.from(new Set(args.userIds.filter(Boolean)));
  if (!ids.length) return;

  await prisma.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      type: args.type,
      title: args.title,
      body: args.body ?? null,
      ...(args.data === undefined ? {} : { data: args.data }),
    })),
  });
}
