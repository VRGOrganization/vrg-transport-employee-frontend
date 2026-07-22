import { PageHeader } from "@/components/layout/PageHeader";

interface StudentFormLayoutProps {
  title: string;
  subtitle: string;
  backHref: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function StudentFormLayout({
  title,
  subtitle,
  backHref,
  children,
  wide = false,
}: StudentFormLayoutProps) {
  return (
    <div className={wide ? "max-w-4xl mx-auto" : "max-w-lg mx-auto"}>
      <PageHeader back={backHref} title={title} subtitle={subtitle} />

      {/* Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}