import Link from "next/link";

interface DashboardCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export function DashboardCard({ icon, title, description, href }: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="p-3 bg-primary/10 rounded-xl">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: "28px" }}
          >
            {icon}
          </span>
        </div>
        <span
          className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors"
          style={{ fontSize: "20px" }}
        >
          arrow_forward
        </span>
      </div>
      <div>
        <h3 className="font-headline font-semibold text-on-surface text-base">{title}</h3>
        <p className="text-sm text-on-surface-variant mt-1">{description}</p>
      </div>
    </Link>
  );
}
