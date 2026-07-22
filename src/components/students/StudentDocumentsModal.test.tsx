import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudentDocumentsModal } from "./StudentDocumentsModal";
import type { ImageRecord } from "@/types/cards.types";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@/services/http", () => ({
  http: {
    get: getMock,
  },
}));

function makeImage(over: Partial<ImageRecord> = {}): ImageRecord {
  return {
    _id: "img-1",
    studentId: "student-1",
    photoType: "GovernmentId",
    photo3x4: null,
    documentImage: "data:image/png;base64,xxx",
    studentCard: null,
    ...over,
  };
}

describe("StudentDocumentsModal — declaração de uso do sistema antigo", () => {
  it("exibe a carteirinha de transporte quando o aluno declarou alreadyUsesTransport=true", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: true });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([
          makeImage({ _id: "img-1", photoType: "GovernmentId" }),
          makeImage({ _id: "img-2", photoType: "TransportCardProof" }),
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Carteirinha de Transporte Atual")).toBeInTheDocument(),
    );
  });

  it("não exibe a carteirinha de transporte quando alreadyUsesTransport=false, mesmo se existir o documento", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([
          makeImage({ _id: "img-1", photoType: "GovernmentId" }),
          makeImage({ _id: "img-2", photoType: "TransportCardProof" }),
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Documento de identidade")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Carteirinha de Transporte Atual")).not.toBeInTheDocument();
  });
});

describe("StudentDocumentsModal — documentos em PDF", () => {
  it("renderiza documento PDF num iframe, não numa tag <img>", async () => {
    const pdfUrl =
      "https://bucket.r2.cloudflarestorage.com/abc123.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256";

    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([
          makeImage({ _id: "img-1", photoType: "GovernmentId", documentImage: pdfUrl }),
        ]);
      }
      return Promise.resolve([]);
    });

    const { container } = render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Documento de identidade")).toBeInTheDocument(),
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    const iframe = container.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", pdfUrl);
  });
});

describe("StudentDocumentsModal — declaração de PCD", () => {
  it("exibe o laudo médico quando hasDisability=true", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([
          makeImage({ _id: "img-1", photoType: "GovernmentId" }),
          makeImage({ _id: "img-2", photoType: "DisabilityProof" }),
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal
        studentId="student-1"
        studentName="Aluno 1"
        hasDisability={true}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Laudo Médico (PCD)")).toBeInTheDocument(),
    );
  });

  it("não exibe o laudo médico quando hasDisability=false, mesmo se existir o documento", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([
          makeImage({ _id: "img-1", photoType: "GovernmentId" }),
          makeImage({ _id: "img-2", photoType: "DisabilityProof" }),
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal
        studentId="student-1"
        studentName="Aluno 1"
        hasDisability={false}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("Documento de identidade")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Laudo Médico (PCD)")).not.toBeInTheDocument();
  });
});
