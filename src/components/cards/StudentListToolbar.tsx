import { Printer, Search } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { FilterButton } from "@/components/cards/CardPageComponents";
import type { StudentFilter } from "@/types/cards.types";

interface StudentListToolbarProps {
  search: string;
  filter: StudentFilter;
  selectedForBatchCount: number;
  printingBatch: boolean;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  hasApproved: boolean;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: StudentFilter) => void;
  onPrintBatch: () => void;
  onSelectAll: () => void;
  showReview?: boolean;
}

export function StudentListToolbar({
  search,
  filter,
  selectedForBatchCount,
  printingBatch,
  isAllSelected,
  isSomeSelected,
  hasApproved,
  onSearchChange,
  onFilterChange,
  onPrintBatch,
  onSelectAll,
  showReview = false,
}: StudentListToolbarProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

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
              Em Espera
            </FilterButton>
            <FilterButton
              active={filter === "with-card"}
              onClick={() => onFilterChange("with-card")}
            >
              Aprovados
            </FilterButton>
            {showReview && (
              <FilterButton
                active={filter === "review"}
                onClick={() => onFilterChange("review")}
              >
                Revisão
              </FilterButton>
            )}
          </div>
        </div>

        {filter === "with-card" && (
          <div
            className={`relative flex items-center h-10 w-full rounded-xl border border-on-surface-variant
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
          <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={isAllSelected}
              onChange={onSelectAll}
              disabled={!hasApproved}
              aria-label="Selecionar todos para impressão em lote"
              className="size-4 rounded border-2 border-on-surface-variant accent-primary cursor-pointer disabled:cursor-not-allowed"
            />
            <p className="text-xs text-on-surface-variant">
              Selecionadas para lote:{" "}
              <strong className="text-on-surface">{selectedForBatchCount}</strong>
            </p>
          </label>
          <Button
            variant="outline"
            size="sm"
            icon={<Printer className="size-4" />}
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
