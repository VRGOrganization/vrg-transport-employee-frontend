import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { http } from "@/services/http";
import type { LicenseRequestRecord } from "@/types/cards.types";

interface AcceptDocumentsButtonProps {
  licenseRequest: LicenseRequestRecord | null;
  selectedBusRouteLabel: string;
  hasInstitution: boolean;
  profileImage: string | null;
  institution: string | undefined;
  onSuccess: () => Promise<void>;
}

/**
 * Botão de aceite de documentos para a aba "Revisão" (solicitações tipo "update"
 * pendentes). Reusa o endpoint de aprovação PATCH /license-request/approve/:id,
 * espelhando a validação de `handleApprove` em StudentDetailPanel.
 */
export function AcceptDocumentsButton({
  licenseRequest,
  selectedBusRouteLabel,
  hasInstitution,
  profileImage,
  institution,
  onSuccess,
}: AcceptDocumentsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const disabled =
    !licenseRequest ||
    licenseRequest.status !== "pending" ||
    !hasInstitution ||
    !selectedBusRouteLabel;

  const handleClick = async () => {
    if (!licenseRequest || disabled || loading) return;
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      await http.patch(`/license-request/approve/${licenseRequest._id}`, {
        institution,
        bus: selectedBusRouteLabel,
        ...(profileImage ? { photo: profileImage } : {}),
      });
      setMessage("Documentos aceitos com sucesso.");
      setIsError(false);
      await onSuccess();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage(e.message ?? "Falha ao aceitar os documentos.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        fullWidth
        loading={loading}
        disabled={disabled}
        icon={<CheckCircle className="size-5" />}
        onClick={handleClick}
      >
        {loading ? "Aceitando..." : "Aceitar documentos"}
      </Button>
      {message && (
        <p
          className={`text-sm ${isError ? "text-error" : "text-success"}`}
          role={isError ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </div>
  );
}
