import { Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterButton } from "@/components/cards/CardPageComponents";
import type { StudentFilter } from "@/types/cards.types";

interface StudentListToolbarProps {
  search: string;
  filter: StudentFilter;
  selectedForBatchCount: number;
  printingBatch: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: StudentFilter) => void;
  onPrintBatch: () => void;
}

export function StudentListToolbar({
  search,
  filter,
  selectedForBatchCount,
  printingBatch,
  onSearchChange,
  onFilterChange,
  onPrintBatch,
}: StudentListToolbarProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, e-mail ou instituição"
            className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-9 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <div className="flex rounded-xl border border-outline-variant bg-surface-container-low p-1 text-sm">
          <FilterButton active={filter === "pending"} onClick={() => onFilterChange("pending")}>
            Pendentes
          </FilterButton>
          <FilterButton active={filter === "waitlisted"} onClick={() => onFilterChange("waitlisted")}>
            Na fila
          </FilterButton>
          <FilterButton active={filter === "with-card"} onClick={() => onFilterChange("with-card")}>
            Com carteirinha
          </FilterButton>
          <FilterButton active={filter === "all"} onClick={() => onFilterChange("all")}>
            Todos
          </FilterButton>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant bg-surface p-2">
        <p className="text-xs text-on-surface-variant">
          Selecionadas para lote:{" "}
          <strong className="text-on-surface">{selectedForBatchCount}</strong>
        </p>
        <Button
          variant="outline"
          size="sm"
          icon={<Printer className="h-4 w-4" />}
          disabled={selectedForBatchCount === 0 || printingBatch}
          loading={printingBatch}
          onClick={onPrintBatch}
        >
          Impressão em lote
        </Button>
      </div>
    </div>
  );
}