"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { http } from "@/services/http";
import { transportUsageService } from "@/services/transportUsageService";
import type { ImageRecord, PhotoType } from "@/types/cards.types";
import { PHOTO_TYPE_LABELS } from "@/types/cards.types";
import { isPdfDataUrl, normalizeMediaSource } from "@/lib/cardUtils";
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
  SecondaryEnrollmentProof:     "school",
  SecondaryCourseSchedule:      "calendar_today",
  SecondaryAcademicPeriodProof: "event_note",
};

const DOC_ORDER: PhotoType[] = [
  "ProfilePhoto",
  "GovernmentId",
  "ProofOfResidence",
  "EnrollmentProof",
  "CourseSchedule",
  "AcademicPeriodProof",
  "SecondaryEnrollmentProof",
  "SecondaryCourseSchedule",
  "SecondaryAcademicPeriodProof",
  "TransportCardProof",
  "DisabilityProof",
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
  const [selectedDoc, setSelectedDoc] = useState<ImageRecord | null>(null);

  useEffect(() => {
    // Sincronização com API externa (fetch on mount/dependency change) — o
    // extra render de "loading=true" é o custo aceito desse padrão.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      http.get<ImageRecord[]>(`/image/student/${studentId}`),
      transportUsageService.getByStudent(studentId).catch(() => null),
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
    <>
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
          <Spinner size="lg" className="size-9 text-primary" />
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

      {/* Documents list */}
      {!loading && !error && docs.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {docs.map((doc) => {
            const imgUrl = getImageUrl(doc);
            if (!imgUrl) return null;

            const label = PHOTO_TYPE_LABELS[doc.photoType] ?? doc.photoType;
            const icon = DOC_ICON[doc.photoType] ?? "description";

            return (
              <button
                key={doc._id}
                type="button"
                onClick={() => setSelectedDoc(doc)}
                className="flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm hover:shadow-md hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
              >
                <span className="size-6 rounded-full bg-primary/12 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: "14px" }}>
                    {icon}
                  </span>
                </span>
                <span className="text-sm font-medium text-on-surface">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>

    {selectedDoc && (
      <Modal
        open
        onClose={() => setSelectedDoc(null)}
        title={PHOTO_TYPE_LABELS[selectedDoc.photoType] ?? selectedDoc.photoType}
        size="xl"
        closeOnBackdrop={false}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-outline-variant/40 text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        }
      >
        {isPdfDataUrl(getImageUrl(selectedDoc)) ? (
          <iframe
            src={getImageUrl(selectedDoc) ?? ""}
            title={PHOTO_TYPE_LABELS[selectedDoc.photoType] ?? selectedDoc.photoType}
            className="w-full h-[70vh] rounded-xl shadow-sm bg-white"
          />
        ) : (
          <img
            src={getImageUrl(selectedDoc) ?? ""}
            alt={PHOTO_TYPE_LABELS[selectedDoc.photoType] ?? selectedDoc.photoType}
            className="w-full object-contain rounded-xl max-h-[70vh]"
          />
        )}
      </Modal>
    )}
    </>
  );
}
