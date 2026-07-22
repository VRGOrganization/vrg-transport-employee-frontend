"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { http } from "@/services/http";
import type { ImageRecord, PhotoType } from "@/types/cards.types";
import { PHOTO_TYPE_LABELS } from "@/types/cards.types";
import { normalizeMediaSource } from "@/lib/cardUtils";
import { resolveDisplayName } from "@/lib/utils/string";

interface Props {
  studentId: string;
  studentName: string;
  studentSocialName?: string | null;
  hasDisability?: boolean;
  onClose: () => void;
}

function getImageUrl(doc: ImageRecord): string | null {
  if (doc.photoType === "ProfilePhoto") return normalizeMediaSource(doc.photo3x4);
  if (doc.photoType === "LicenseImage")  return normalizeMediaSource(doc.studentCard);
  return normalizeMediaSource(doc.documentImage);
}

const DOC_ICON: Record<PhotoType, string> = {
  ProfilePhoto:        "person",
  EnrollmentProof:     "school",
  CourseSchedule:      "calendar_today",
  AcademicPeriodProof: "event_note",
  LicenseImage:        "badge",
  GovernmentId:        "credit_card",
  ProofOfResidence:    "home",
  TransportCardProof:  "directions_bus",
  DisabilityProof:     "medical_information",
};

const DOC_ORDER: PhotoType[] = [
  "ProfilePhoto",
  "GovernmentId",
  "ProofOfResidence",
  "EnrollmentProof",
  "CourseSchedule",
  "AcademicPeriodProof",
  "LicenseImage",
];

export function StudentDocumentsModal({
  studentId,
  studentName,
  studentSocialName,
  hasDisability = false,
  onClose,
}: Props) {
  const [docs, setDocs] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Sincronização com API externa (fetch on mount/dependency change) — o
    // extra render de "loading=true" é o custo aceito desse padrão.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      http.get<ImageRecord[]>(`/image/student/${studentId}`),
      http
        .get<{ studentId: string; alreadyUsesTransport: boolean }>(
          `/transport-usage/student/${studentId}`,
        )
        .catch(() => null),
    ])
      .then(([data, transportUsage]) => {
        const alreadyUsesTransport = transportUsage?.alreadyUsesTransport ?? false;
        const visible = data.filter((doc) => {
          if (doc.photoType === "TransportCardProof") return alreadyUsesTransport;
          if (doc.photoType === "DisabilityProof") return hasDisability;
          return true;
        });
        const sorted = [...visible].sort(
          (a, b) => DOC_ORDER.indexOf(a.photoType) - DOC_ORDER.indexOf(b.photoType),
        );
        setDocs(sorted);
      })
      .catch(() => setError("Não foi possível carregar os documentos."))
      .finally(() => setLoading(false));
  }, [studentId, hasDisability]);

  return (
    <Modal open onClose={onClose} title="Documentos do Aluno" size="lg">
      <p className={`text-sm text-on-surface-variant -mt-2 ${studentSocialName?.trim() ? "mb-1" : "mb-5"}`}>
        {resolveDisplayName({ name: studentName, socialName: studentSocialName })}
      </p>
      {studentSocialName?.trim() && (
        <p className="text-xs text-on-surface-variant mb-5">Nome de registro: {studentName}</p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full size-9 border-b-2 border-primary" />
          <span className="text-sm text-on-surface-variant">Carregando documentos…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="size-14 rounded-full bg-error/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-error">error</span>
          </div>
          <p className="text-sm text-error max-w-xs">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && docs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="size-16 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">folder_open</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">Nenhum documento encontrado</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Este aluno ainda não enviou documentos ao sistema.
            </p>
          </div>
        </div>
      )}

      {/* Documents grid */}
      {!loading && !error && docs.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {docs.map((doc) => {
            const imgUrl = getImageUrl(doc);
            const label = PHOTO_TYPE_LABELS[doc.photoType] ?? doc.photoType;
            const icon = DOC_ICON[doc.photoType] ?? "description";

            return (
              <div
                key={doc._id}
                className="rounded-2xl border border-outline-variant/30 overflow-hidden bg-surface-container-lowest flex flex-col shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-linear-to-r from-primary/8 to-transparent border-b border-outline-variant/20">
                  <div className="size-8 rounded-full bg-primary/12 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "17px" }}>
                      {icon}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface truncate">{label}</p>
                </div>

                {/* Image area */}
                {imgUrl ? (
                  <div className="flex-1 bg-surface-container p-3">
                    <img
                      src={imgUrl}
                      alt={label}
                      className="w-full object-contain rounded-xl max-h-52 shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2 bg-surface-container-low/50">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/25">
                      hide_image
                    </span>
                    <p className="text-xs text-on-surface-variant/50 font-medium">Sem imagem</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
