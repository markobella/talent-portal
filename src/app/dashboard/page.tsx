import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.user.role === "TALENT") redirect("/talent/profile");
  if (session.user.role === "PARTNER") redirect("/partner/directory");
  if (session.user.role === "ADMIN") redirect("/admin/offers");

  redirect("/login");
}

