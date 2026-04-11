"use client";

import { Button } from "@/components/ui/Button";
import type { WaitlistEntry } from "@/types/enrollmentPeriod";

interface ReleaseConfirmModalProps {
  open: boolean;
  entries: WaitlistEntry[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function formatDate(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Data inválida";
  return date.toLocaleDateString("pt-BR");
}

export function ReleaseConfirmModal({
  open,
  entries,
  loading,
  error,
  onClose,
  onConfirm,
}: ReleaseConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.currentTarget === event.target && !loading) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Confirmar liberação de vagas</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Os alunos abaixo serão promovidos da fila para pendente e notificados por e-mail.
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Posição</th>
                <th className="px-3 py-2 text-left font-medium">Nome</th>
                <th className="px-3 py-2 text-left font-medium">Instituição</th>
                <th className="px-3 py-2 text-left font-medium">Solicitado em</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.request._id} className="border-t border-outline-variant/40">
                  <td className="px-3 py-2 text-on-surface">#{entry.filaPosition}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-on-surface">{entry.student.name}</p>
                    <p className="text-xs text-on-surface-variant">{entry.student.email}</p>
                  </td>
                  <td className="px-3 py-2 text-on-surface-variant">
                    {entry.student.institution ?? "Não informada"}
                  </td>
                  <td className="px-3 py-2 text-on-surface-variant">
                    {formatDate(entry.request.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" size="sm" loading={loading} onClick={onConfirm}>
            Confirmar e notificar
          </Button>
        </div>
      </div>
    </div>
  );
}
