import { ArrowLeft } from "lucide-react";
import type { University } from "@/types/university.types";
import { AutoRefreshSettings } from "./AutoRefreshSettings";
import { BusCapacityBadge } from "./BusCapacityBadge";

interface UniversityPageHeaderProps {
  university: University;
  onBack: () => void;
  isRefreshing: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  approved: number;
  pending: number;
  waitlisted: number;
  review: number;
}

export function UniversityPageHeader({
  university,
  onBack,
  isRefreshing,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  approved,
  pending,
  waitlisted,
  review,
}: UniversityPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para a lista de universidades"
          className="flex size-9 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {university.acronym}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {university.name}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BusCapacityBadge
          approved={approved}
          capacity={null}
          pending={pending}
          waitlisted={waitlisted}
          review={review}
        />
        <AutoRefreshSettings
          isRefreshing={isRefreshing}
          enabled={autoRefreshEnabled}
          intervalSeconds={30}
          onToggle={onToggleAutoRefresh}
        />
      </div>
    </div>
  );
}
