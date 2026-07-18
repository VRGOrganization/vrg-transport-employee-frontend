import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { http } from "@/services/http";
import {
  PHOTO_TYPE_LABELS,
  REVISION_FIELD_LABELS,
  type LicenseRequestRecord,
  type PhotoType,
  type RevisionFieldKey,
} from "@/types/cards.types";

interface RequestRevisionModalProps {
  currentLicenseRequest: LicenseRequestRecord;
  alreadyUsesTransport: boolean;
  hasDisability: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onReload: () => Promise<void>;
}

// Documentos que o aluno pode reenviar numa revisão.
const REVISION_DOCUMENTS: PhotoType[] = [
  "ProfilePhoto",
  "EnrollmentProof",
  "CourseSchedule",
  "AcademicPeriodProof",
  "GovernmentId",
  "ProofOfResidence",
];

const REVISION_FIELD_KEYS: RevisionFieldKey[] = [
  "institution",
  "degree",
  "shift",
  "schedule",
];

export function RequestRevisionModal({
  currentLicenseRequest,
  alreadyUsesTransport,
  hasDisability,
  onClose,
  onSuccess,
  onReload,
}: RequestRevisionModalProps) {
  // O comprovante de uso do transporte e o laudo médico só são revisáveis
  // quando o aluno declarou a condição correspondente (do contrário ele
  // nunca enviou esse documento).
  const revisionDocuments: PhotoType[] = [
    ...REVISION_DOCUMENTS,
    ...(alreadyUsesTransport ? (["TransportCardProof"] as PhotoType[]) : []),
    ...(hasDisability ? (["DisabilityProof"] as PhotoType[]) : []),
  ];

  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedDocs.size === 0 && selectedFields.size === 0) {
      setErrorMessage("Selecione ao menos um documento ou informação a revisar.");
      return;
    }
    if (!message.trim()) {
      setErrorMessage("A observação é obrigatória. Explique ao aluno o que precisa ser corrigido.");
      return;
    }
    setSubmitting(true);
    setErrorMessage("");
    try {
      await http.patch(
        `/license-request/${currentLicenseRequest._id}/request-revision`,
        {
          documents: Array.from(selectedDocs),
          fields: Array.from(selectedFields),
          ...(message.trim() ? { message: message.trim() } : {}),
        },
      );
      onSuccess("Pedido enviado para revisão. O aluno foi notificado por e-mail.");
      await onReload();
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e.message ?? "Falha ao enviar para revisão.");
    } finally {
      setSubmitting(false);
    }
  };

  const itemClass = (selected: boolean) =>
    `flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm border transition-all cursor-pointer ${
      selected
        ? "border-primary bg-primary/10 text-primary font-medium"
        : "border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/40"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardCheck className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-on-surface text-base">
              Solicitar revisão
            </h2>
            <p className="text-xs text-on-surface-variant">
              Marque o que o aluno precisa corrigir e reenviar
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
            Documentos a reenviar
          </p>
          {revisionDocuments.map((doc) => (
            <label key={doc} className={itemClass(selectedDocs.has(doc))}>
              <input
                type="checkbox"
                className="accent-primary"
                checked={selectedDocs.has(doc)}
                onChange={() => toggle(setSelectedDocs, doc)}
              />
              {PHOTO_TYPE_LABELS[doc]}
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
            Informações a corrigir
          </p>
          {REVISION_FIELD_KEYS.map((field) => (
            <label key={field} className={itemClass(selectedFields.has(field))}>
              <input
                type="checkbox"
                className="accent-primary"
                checked={selectedFields.has(field)}
                onChange={() => toggle(setSelectedFields, field)}
              />
              {REVISION_FIELD_LABELS[field]}
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">
            Observação para o aluno <span className="text-error">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface resize-none focus:outline-none focus:border-primary"
            rows={3}
            maxLength={500}
            placeholder="Explique o que precisa ser corrigido…"
            value={message}
            onChange={(e) => { setMessage(e.target.value); if (errorMessage) setErrorMessage(""); }}
          />
        </div>

        {errorMessage && <p className="text-xs text-error">{errorMessage}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-medium text-on-surface-variant border border-outline-variant/60 rounded-xl transition-all hover:bg-surface-container hover:border-outline-variant hover:text-on-surface active:scale-[0.98] disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            Cancelar
          </button>
          <Button
            variant="primary"
            size="md"
            loading={submitting}
            disabled={
              (selectedDocs.size === 0 && selectedFields.size === 0) || !message.trim() || submitting
            }
            onClick={handleSubmit}
            className="flex-1"
          >
            Enviar para revisão
          </Button>
        </div>
      </div>
    </div>
  );
}
