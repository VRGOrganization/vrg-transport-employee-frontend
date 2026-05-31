"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ChangeEntry } from "./EmployeeEditForm";

interface Props {
  changes: ChangeEntry[];
  loading: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export function EmployeeEditConfirmView({ changes, loading, onBack, onConfirm }: Props) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-headline font-semibold text-lg text-on-surface flex-1">Confirmar alterações</h3>
      </div>

      <p className="text-sm text-on-surface-variant mb-4">Revise as alterações antes de confirmar:</p>

      <div className="rounded-xl border border-outline-variant overflow-hidden mb-5">
        {changes.map((c, i) => (
          <div key={i} className="px-4 py-3 border-b border-outline-variant last:border-0">
            <p className="text-xs text-on-surface-variant font-medium mb-1">{c.label}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-error line-through">{c.from}</span>
              <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-success font-medium">{c.to}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" fullWidth onClick={onBack} disabled={loading}>
          Voltar
        </Button>
        <Button variant="primary" size="sm" fullWidth loading={loading} icon={<Check className="w-4 h-4" />} onClick={onConfirm}>
          Confirmar
        </Button>
      </div>
    </>
  );
}
