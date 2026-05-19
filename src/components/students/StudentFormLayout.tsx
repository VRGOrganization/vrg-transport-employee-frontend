import { PageHeader } from "@/components/layout/PageHeader";

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
      <PageHeader back={backHref} title={title} subtitle={subtitle} />

      {/* Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}