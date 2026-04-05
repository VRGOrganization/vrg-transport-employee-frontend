import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface SuccessBannerProps {
  title: string;
  description: string;
  backHref: string;
  backLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  resetIcon?: string;
}

export function SuccessBanner({
  title,
  description,
  backHref,
  backLabel = "Voltar",
  onReset,
  resetLabel = "Novo cadastro",
  resetIcon = "person_add",
}: SuccessBannerProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div className="p-4 bg-success/10 rounded-full">
        <span
          className="material-symbols-outlined text-success"
          style={{ fontSize: "40px" }}
        >
          check_circle
        </span>
      </div>
      <div>
        <h2 className="font-headline font-semibold text-lg text-on-surface">{title}</h2>
        <p className="text-sm text-on-surface-variant mt-1">{description}</p>
      </div>
      <div className="flex gap-3 w-full">
        <Button
          variant="outline"
          size="md"
          fullWidth
          icon="arrow_back"
          onClick={() => router.push(backHref)}
        >
          {backLabel}
        </Button>
        {onReset && (
          <Button variant="primary" size="md" fullWidth icon={resetIcon} onClick={onReset}>
            {resetLabel}
          </Button>
        )}
      </div>
    </div>
  );
}