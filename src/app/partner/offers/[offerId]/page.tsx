import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/db";
import { roleBackLinkClass, roleShellClass } from "@/lib/role-ui-theme-shared";
import { getRoleGlassThemeEnabled } from "@/lib/role-ui-theme";
import { requireRole, resolveAppWorkspace } from "@/lib/session";
import { PartnerOfferThreadClient } from "./partner-offer-thread-client";

export default async function PartnerOfferPage(props: { params: Promise<{ offerId: string }> }) {
  const session = await requireRole(["PARTNER"]);
  const workspace = await resolveAppWorkspace(session);
  const glassThemeEnabled = await getRoleGlassThemeEnabled("PARTNER");
  const useSoftGlassSections = glassThemeEnabled;
  const { offerId } = await props.params;

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, partnerId: session.user.id },
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
      createdAt: true,
      updatedAt: true,
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
    <div className={[roleShellClass(glassThemeEnabled), useSoftGlassSections ? "glass-soft-sections" : ""].join(" ")}>
      <AppNav role="PARTNER" workspace={workspace} />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/partner/offers" className={["text-sm font-medium", roleBackLinkClass(glassThemeEnabled)].join(" ")}>
            ← Back to projects
          </Link>
        </div>

        <PartnerOfferThreadClient
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
            createdAt: offer.createdAt.toISOString(),
            updatedAt: offer.updatedAt.toISOString(),
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
          canWrite={false}
        />
      </div>
    </div>
  );
}
