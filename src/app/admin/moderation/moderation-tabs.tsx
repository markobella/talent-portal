import Link from "next/link";

export function ModerationTabs(props: { active: "pending" | "history" }) {
  return (
    <div className="mt-5">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <Link
          href="/admin/moderation"
          className={[
            "h-10 rounded-[var(--radius-md)] px-4 text-sm font-semibold inline-flex items-center",
            props.active === "pending" ? "bg-brand text-white" : "border-mist bg-surface text-graphite hover:bg-surface-subtle",
          ].join(" ")}
        >
          Pending approvals
        </Link>
        <Link
          href="/admin/moderation/history"
          className={[
            "h-10 rounded-[var(--radius-md)] px-4 text-sm font-semibold inline-flex items-center",
            props.active === "history" ? "bg-brand text-white" : "border-mist bg-surface text-graphite hover:bg-surface-subtle",
          ].join(" ")}
        >
          Approval history
        </Link>
      </div>
    </div>
  );
}
