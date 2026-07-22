import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudentDetailPanel } from "./StudentDetailPanel";
import type { PreviewItem, StudentRecord } from "@/types/cards.types";

vi.mock("@/components/cards/CardPageComponents", () => ({
  ImageLightbox: () => null,
  DocumentPreview: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/components/cards/DocumentsGrid", () => ({
  DocumentsGrid: ({
    licenseItems,
    personalItems,
    civilName,
  }: {
    licenseItems: PreviewItem[];
    personalItems: PreviewItem[];
    civilName?: string;
  }) => (
    <div>
      <div data-testid="license-items">
        {licenseItems.map((i) => i.title).join(", ")}
      </div>
      <div data-testid="personal-items">
        {personalItems.map((i) => i.title).join(", ")}
      </div>
      <div data-testid="civil-name">{civilName ?? ""}</div>
    </div>
  ),
}));

vi.mock("@/components/cards/StudentInfoCard", () => ({
  StudentInfoCard: () => null,
}));
vi.mock("@/components/cards/LicenseDetailsCard", () => ({
  LicenseDetailsCard: () => null,
}));
vi.mock("@/components/cards/AllocationSummaryCard", () => ({
  AllocationSummaryCard: () => null,
}));
vi.mock("@/components/cards/PriorityBadge", () => ({
  PriorityBadge: () => null,
}));
vi.mock("@/components/cards/UpdateRequestDiff", () => ({
  UpdateRequestDiff: () => null,
}));
vi.mock("@/components/cards/ApprovalFooter", () => ({
  ApprovalFooter: () => null,
}));
vi.mock("@/components/cards/ImageHistoryDrawer", () => ({
  ImageHistoryDrawer: () => null,
}));

const student: StudentRecord = {
  _id: "student-1",
  name: "Aluno 1",
  email: "a@a.com",
  active: true,
};

function baseProps() {
  return {
    selected: student,
    selectedImages: [],
    loadingSelected: false,
    currentLicense: null,
    currentLicenseRequest: null,
    pendingImagesByType: {},
    profileImage: null,
    enrollmentImage: null,
    scheduleImage: null,
    academicPeriodImage: null,
    governmentImage: null,
    proofOfResidenceImage: null,
    transportCardProofImage: null as string | null,
    alreadyUsesTransport: false,
    disabilityProofImage: null as string | null,
    hasDisability: false,
    selectedLicensePreview: null,
    onReload: vi.fn().mockResolvedValue(undefined),
    onOpenRejectModal: vi.fn(),
    onOpenRevisionModal: vi.fn(),
    printingSingle: false,
    onPrintSingle: vi.fn(),
  };
}

describe("StudentDetailPanel — declaração de uso do sistema antigo", () => {
  it("exibe o badge e a carteirinha na seção de Documentos Pessoais quando alreadyUsesTransport=true", () => {
    render(
      <StudentDetailPanel
        {...baseProps()}
        alreadyUsesTransport={true}
        transportCardProofImage="data:image/png;base64,xxx"
      />,
    );

    expect(screen.getByText(/já usa o transporte/i)).toBeInTheDocument();
    expect(screen.getByText("Sim")).toBeInTheDocument();
    expect(screen.getByTestId("personal-items")).toHaveTextContent(
      "Carteirinha de Transporte Atual",
    );
    expect(screen.getByTestId("license-items")).not.toHaveTextContent(
      "Carteirinha de Transporte Atual",
    );
  });

  it("não exibe badge nem carteirinha quando alreadyUsesTransport=false e não há imagem legada", () => {
    render(<StudentDetailPanel {...baseProps()} alreadyUsesTransport={false} />);

    expect(screen.queryByText(/já usa o transporte/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("personal-items")).not.toHaveTextContent(
      "Carteirinha de Transporte Atual",
    );
    expect(screen.getByTestId("license-items")).not.toHaveTextContent(
      "Carteirinha de Transporte Atual",
    );
  });

  it("mostra a carteirinha (sem badge) quando há imagem legada mas alreadyUsesTransport=false", () => {
    render(
      <StudentDetailPanel
        {...baseProps()}
        alreadyUsesTransport={false}
        transportCardProofImage="data:image/png;base64,legacy"
      />,
    );

    expect(screen.queryByText(/já usa o transporte/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("personal-items")).toHaveTextContent(
      "Carteirinha de Transporte Atual",
    );
  });
});

describe("StudentDetailPanel — declaração de PCD", () => {
  it("exibe o badge PCD e o laudo na seção de Documentos Pessoais quando hasDisability=true", () => {
    render(
      <StudentDetailPanel
        {...baseProps()}
        hasDisability={true}
        disabilityProofImage="data:image/png;base64,laudo"
      />,
    );

    expect(screen.getByText(/^pcd:/i)).toBeInTheDocument();
    expect(screen.getByText("Sim")).toBeInTheDocument();
    expect(screen.getByTestId("personal-items")).toHaveTextContent(
      "Laudo Médico (PCD)",
    );
    expect(screen.getByTestId("license-items")).not.toHaveTextContent(
      "Laudo Médico (PCD)",
    );
  });

  it("não exibe badge nem laudo quando hasDisability=false e não há imagem legada", () => {
    render(<StudentDetailPanel {...baseProps()} hasDisability={false} />);

    expect(screen.queryByText(/^pcd:/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("personal-items")).not.toHaveTextContent(
      "Laudo Médico (PCD)",
    );
    expect(screen.getByTestId("license-items")).not.toHaveTextContent(
      "Laudo Médico (PCD)",
    );
  });

  it("mostra o laudo (sem badge) quando há imagem legada mas hasDisability=false", () => {
    render(
      <StudentDetailPanel
        {...baseProps()}
        hasDisability={false}
        disabilityProofImage="data:image/png;base64,legacy"
      />,
    );

    expect(screen.queryByText(/^pcd:/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("personal-items")).toHaveTextContent(
      "Laudo Médico (PCD)",
    );
  });
});

describe("StudentDetailPanel — nome civil perto dos documentos pessoais", () => {
  it("passa o nome civil pro DocumentsGrid quando há nome social preenchido", () => {
    render(
      <StudentDetailPanel
        {...baseProps()}
        selected={{ ...student, socialName: "Aluna Social" }}
      />,
    );

    expect(screen.getByTestId("civil-name")).toHaveTextContent("Aluno 1");
  });

  it("não duplica o nome civil quando não há nome social preenchido", () => {
    render(<StudentDetailPanel {...baseProps()} selected={student} />);

    expect(screen.getByTestId("civil-name")).toHaveTextContent("");
  });
});
