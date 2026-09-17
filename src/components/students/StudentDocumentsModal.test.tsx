import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      if (path === "/transport-usage/student-1") {
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
      if (path === "/transport-usage/student-1") {
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
      if (path === "/transport-usage/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([
          makeImage({ _id: "img-1", photoType: "GovernmentId", documentImage: pdfUrl }),
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

    expect(document.body.querySelector("iframe")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Documento de identidade/ }));

    const iframe = await waitFor(() => {
      const el = document.body.querySelector("iframe");
      expect(el).toBeInTheDocument();
      return el;
    });
    expect(document.body.querySelector("img")).not.toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", pdfUrl);
  });
});

describe("StudentDocumentsModal — declaração de PCD", () => {
  it("exibe o laudo médico quando hasDisability=true", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student-1") {
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
      if (path === "/transport-usage/student-1") {
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

describe("StudentDocumentsModal — documento sem imagem atribuída", () => {
  it("não exibe botão para documento sem imagem", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([
          makeImage({ _id: "img-1", photoType: "GovernmentId", documentImage: null }),
        ]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.queryByText("Carregando documentos…")).not.toBeInTheDocument(),
    );

    expect(screen.queryByText("Documento de identidade")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Documento de identidade/ }),
    ).not.toBeInTheDocument();
  });
});

describe("StudentDocumentsModal — viewer de imagem em modal separado", () => {
  it("não renderiza a imagem grande até o usuário clicar no documento", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([makeImage({ _id: "img-1", photoType: "GovernmentId" })]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Documento de identidade")).toBeInTheDocument(),
    );

    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fechar" })).not.toBeInTheDocument();
  });

  it("abre o viewer em modal próprio ao clicar no documento, com botões Voltar e Fechar", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([makeImage({ _id: "img-1", photoType: "GovernmentId" })]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Documento de identidade")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Documento de identidade/ }));

    expect(await screen.findByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
  });

  it("botão Voltar fecha o viewer e retorna ao modal de documentos, sem chamar onClose", async () => {
    const onClose = vi.fn();
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([makeImage({ _id: "img-1", photoType: "GovernmentId" })]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={onClose} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Documento de identidade")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Documento de identidade/ }));
    const voltarBtn = await screen.findByRole("button", { name: "Voltar" });
    fireEvent.click(voltarBtn);

    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Documento de identidade")).toBeInTheDocument();
  });

  it("botão Fechar do viewer chama onClose", async () => {
    const onClose = vi.fn();
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([makeImage({ _id: "img-1", photoType: "GovernmentId" })]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={onClose} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Documento de identidade")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Documento de identidade/ }));
    const fecharBtn = await screen.findByRole("button", { name: "Fechar" });
    fireEvent.click(fecharBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicar no backdrop do viewer não fecha o modal", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/transport-usage/student-1") {
        return Promise.resolve({ studentId: "student-1", alreadyUsesTransport: false });
      }
      if (path === "/image/student/student-1") {
        return Promise.resolve([makeImage({ _id: "img-1", photoType: "GovernmentId" })]);
      }
      return Promise.resolve([]);
    });

    render(
      <StudentDocumentsModal studentId="student-1" studentName="Aluno 1" onClose={vi.fn()} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Documento de identidade")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Documento de identidade/ }));
    await screen.findByRole("button", { name: "Voltar" });

    const backdrops = document.body.querySelectorAll(".fixed.inset-0");
    const viewerBackdrop = backdrops[backdrops.length - 1];
    fireEvent.click(viewerBackdrop);

    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
  });
});
