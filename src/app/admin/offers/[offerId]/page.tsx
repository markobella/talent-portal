import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { requireRole, resolveAppWorkspace, partnerDisplayName } from "@/lib/session";
import { AdminOfferDetailClient } from "./admin-offer-detail-client";

export default async function AdminOfferDetailPage(props: { params: Promise<{ offerId: string }> }) {
  const session = await requireRole(["ADMIN"]);
  const workspace = await resolveAppWorkspace(session);
  const { offerId } = await props.params;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      title: true,
      status: true,
      projectType: true,
      projectDate: true,
      startTime: true,
      endTime: true,
      amountPhp: true,
      transportAllowance: true,
      compensation: true,
      message: true,
      adminRejectionReason: true,
      adminReviewedAt: true,
      createdAt: true,
      updatedAt: true,
      partner: { select: { id: true, email: true, name: true, displayName: true } },
      talent: { select: { id: true, email: true, name: true, talentProfile: { select: { displayName: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true,
          createdAt: true,
          body: true,
          sender: { select: { id: true, role: true, email: true, name: true } },
        },
      },
    },
  });

  if (!offer) return notFound();

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <AppNav role="ADMIN" workspace={workspace} />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/offers" className="text-sm font-medium text-black/60 hover:text-black">
            ← Back to projects
          </Link>
        </div>

        <AdminOfferDetailClient
          offer={{
            id: offer.id,
            title: offer.title,
            status: offer.status,
            projectType: offer.projectType,
            projectDate: offer.projectDate ? offer.projectDate.toISOString() : null,
            startTime: offer.startTime,
            endTime: offer.endTime,
            amountPhp: offer.amountPhp,
            transportAllowance: offer.transportAllowance,
            compensation: offer.compensation,
            message: offer.message,
            adminRejectionReason: offer.adminRejectionReason,
            adminReviewedAt: offer.adminReviewedAt ? offer.adminReviewedAt.toISOString() : null,
            createdAt: offer.createdAt.toISOString(),
            updatedAt: offer.updatedAt.toISOString(),
          }}
          partner={{
            id: offer.partner.id,
            displayName: partnerDisplayName({
              name: offer.partner.name,
              displayName: offer.partner.displayName,
              email: offer.partner.email,
            }),
            email: offer.partner.email,
          }}
          talent={{
            id: offer.talent.id,
            displayName: offer.talent.talentProfile?.displayName ?? offer.talent.name ?? offer.talent.email,
            email: offer.talent.email,
          }}
          messages={offer.messages.map((m) => ({
            id: m.id,
            createdAt: m.createdAt.toISOString(),
            body: m.body,
            sender: m.sender,
          }))}
        />
      </div>
    </div>
  );
}
