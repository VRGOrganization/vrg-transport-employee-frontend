"use client";

import { ChevronDown, ChevronUp, History, X } from "lucide-react";
import { useEffect, useState } from "react";
import { normalizeMediaSource } from "@/lib/cardUtils";
import { http } from "@/services/http";
import type { ImageHistoryRecord, PhotoType } from "@/types/cards.types";
import { PHOTO_TYPE_LABELS } from "@/types/cards.types";

interface ImageHistoryDrawerProps {
  studentId: string | null; // null = fechado
  studentName: string;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR");
}

function groupByPhotoType(
  records: ImageHistoryRecord[],
): Map<PhotoType, ImageHistoryRecord[]> {
  const map = new Map<PhotoType, ImageHistoryRecord[]>();
  for (const rec of records) {
    const existing = map.get(rec.photoType) ?? [];
    existing.push(rec);
    map.set(rec.photoType, existing);
  }
  return map;
}

export function ImageHistoryDrawer({
  studentId,
  studentName,
  onClose,
}: ImageHistoryDrawerProps) {
  const [records, setRecords] = useState<ImageHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedType, setExpandedType] = useState<PhotoType | null>(null);

  useEffect(() => {
    if (!studentId) {
      setRecords([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    http
      .get<ImageHistoryRecord[]>(`/image/history/student/${studentId}`)
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.replacedAt).getTime() - new Date(a.replacedAt).getTime(),
        );
        setRecords(sorted);
      })
      .catch(() => setError("Não foi possível carregar o histórico."))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  const grouped = groupByPhotoType(records);
  const types = Array.from(grouped.keys());

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface-container-lowest shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-on-surface">
                Histórico de Documentos
              </p>
              <p className="text-xs text-on-surface-variant">{studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && (
            <p className="text-sm text-on-surface-variant text-center py-8">
              Carregando histórico…
            </p>
          )}

          {error && (
            <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="size-8 text-outline-variant mb-3" />
              <p className="text-sm font-medium text-on-surface">Sem histórico</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Nenhuma versão arquivada encontrada para este aluno.
              </p>
            </div>
          )}

          {!loading &&
            types.map((photoType) => {
              const typeRecords = grouped.get(photoType) ?? [];
              const isExpanded = expandedType === photoType;
              const label = PHOTO_TYPE_LABELS[photoType] ?? photoType;

              return (
                <div
                  key={photoType}
                  className="rounded-xl border border-outline-variant overflow-hidden"
                >
                  {/* Cabeçalho do grupo */}
                  <button
                    onClick={() =>
                      setExpandedType(isExpanded ? null : photoType)
                    }
                    className="flex w-full items-center justify-between px-4 py-3 bg-surface-container-low hover:bg-surface-container-high transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {label}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {typeRecords.length} versã
                        {typeRecords.length > 1 ? "ões" : "o"} arquivada
                        {typeRecords.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-on-surface-variant" />
                    ) : (
                      <ChevronDown className="size-4 text-on-surface-variant" />
                    )}
                  </button>

                  {/* Versões arquivadas */}
                  {isExpanded && (
                    <div className="divide-y divide-outline-variant/30 bg-surface">
                      {typeRecords.map((rec) => {
                        const dataUrl =
                          photoType === "ProfilePhoto"
                            ? normalizeMediaSource(rec.photo3x4)
                            : normalizeMediaSource(rec.documentImage);

                        return (
                          <div key={rec._id} className="px-4 py-3 space-y-2">
                            <p className="text-xs text-on-surface-variant">
                              Substituído em:{" "}
                              <span className="font-medium text-on-surface">
                                {formatDate(rec.replacedAt)}
                              </span>
                            </p>
                            {dataUrl ? (
                              <div className="overflow-hidden rounded-lg border border-outline-variant">
                                <img
                                  src={dataUrl}
                                  alt={`${label} arquivada`}
                                  className="w-full object-contain max-h-48 bg-surface-container-high"
                                />
                              </div>
                            ) : (
                              <div className="rounded-lg border border-outline-variant bg-surface-container-high h-16 flex items-center justify-center">
                                <p className="text-xs text-on-surface-variant">
                                  Sem imagem
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </aside>
    </>
  );
}
