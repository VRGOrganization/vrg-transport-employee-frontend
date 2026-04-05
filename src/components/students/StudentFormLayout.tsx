import Link from "next/link";

interface StudentFormLayoutProps {
  title: string;
  subtitle: string;
  backHref: string;
  children: React.ReactNode;
}

export function StudentFormLayout({
  title,
  subtitle,
  backHref,
  children,
}: StudentFormLayoutProps) {
  return (
    <div className="max-w-lg mx-auto">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={backHref}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          title="Voltar"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">{title}</h1>
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}