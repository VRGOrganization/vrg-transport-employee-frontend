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
      <div className="flex flex-col gap-3">
        <div className="flex items-center">
          <div className="flex rounded-xl border border-outline-variant bg-surface-container-low p-1 text-sm">
            <FilterButton
              active={filter === "pending"}
              onClick={() => onFilterChange("pending")}
            >
              Pendentes
            </FilterButton>
            <FilterButton
              active={filter === "waitlisted"}
              onClick={() => onFilterChange("waitlisted")}
            >
              Na fila
            </FilterButton>
            <FilterButton
              active={filter === "with-card"}
              onClick={() => onFilterChange("with-card")}
            >
              Aprovados
            </FilterButton>
            <FilterButton
              active={filter === "all"}
              onClick={() => onFilterChange("all")}
            >
              Todos
            </FilterButton>
          </div>
        </div>

        {(filter === "all" || filter === "with-card") && (
          <div
            className={`relative flex items-center h-10 w-full rounded-xl border border-outline 
              bg-surface-container-lowest shadow-(--shadow-card) transition-all duration-200
              focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25
              `}
          >
            <Search
              className=" pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              id="student-search"
              aria-label="Buscar por nome, e-mail ou instituição"
              aria-describedby="student-search-help"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nome, e-mail ou instituição"
              data-testid="student-search-input"
              className={`h-full w-full bg-transparent ml-2 pl-9 pr-3 text-sm text-on-surface 
                placeholder:text-on-surface-muted outline-none
              `}
            />
          </div>
        )}
      </div>

      {filter === "with-card" && (
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
      )}
    </div>
  );
}
