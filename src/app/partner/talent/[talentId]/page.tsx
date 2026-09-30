import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { resolvePartnerTalentProfile } from "../profile-page-content";

export default async function PartnerTalentProfilePage(props: { params: Promise<{ talentId: string }> }) {
  const session = await requireRole(["PARTNER"]);
  const partnerId = session.user.id;
  const { talentId } = await props.params;
  const match = await resolvePartnerTalentProfile(talentId);
  if (!match) return notFound();
  if (match.user.talentProfile.partnerId !== partnerId) return notFound();
  redirect(`/${encodeURIComponent(match.publicUsername)}`);
}
