import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentsGrid } from "./DocumentsGrid";
import type { PreviewItem } from "@/types/cards.types";

const licenseItems: PreviewItem[] = [
  { title: "Foto 3x4", dataUrl: null },
  { title: "Comprovante de Matrícula", dataUrl: null },
  { title: "Imagem da Grade Horária", dataUrl: null },
];

const personalItems: PreviewItem[] = [
  { title: "Documento de identidade", dataUrl: null },
  { title: "Comprovante de residência", dataUrl: null },
];

describe("DocumentsGrid", () => {
  it("renderiza o grupo de documentos da solicitação com título", () => {
    render(
      <DocumentsGrid
        licenseItems={licenseItems}
        personalItems={personalItems}
        loadingImages={false}
        onOpenLightbox={vi.fn()}
      />,
    );

    expect(screen.getByText(/documentos da solicitação/i)).toBeInTheDocument();
  });

  it("renderiza o grupo de documentos pessoais com título", () => {
    render(
      <DocumentsGrid
        licenseItems={licenseItems}
        personalItems={personalItems}
        loadingImages={false}
        onOpenLightbox={vi.fn()}
      />,
    );

    expect(screen.getByText(/documentos pessoais/i)).toBeInTheDocument();
  });

  it("renderiza todos os itens de licença no grupo correto", () => {
    render(
      <DocumentsGrid
        licenseItems={licenseItems}
        personalItems={personalItems}
        loadingImages={false}
        onOpenLightbox={vi.fn()}
      />,
    );

    expect(screen.getByText("Foto 3x4")).toBeInTheDocument();
    expect(screen.getByText("Comprovante de Matrícula")).toBeInTheDocument();
    expect(screen.getByText("Imagem da Grade Horária")).toBeInTheDocument();
  });

  it("renderiza todos os itens pessoais no grupo correto", () => {
    render(
      <DocumentsGrid
        licenseItems={licenseItems}
        personalItems={personalItems}
        loadingImages={false}
        onOpenLightbox={vi.fn()}
      />,
    );

    expect(screen.getByText("Documento de identidade")).toBeInTheDocument();
    expect(screen.getByText("Comprovante de residência")).toBeInTheDocument();
  });

  it("não exibe seção de documentos pessoais quando personalItems está vazio", () => {
    render(
      <DocumentsGrid
        licenseItems={licenseItems}
        personalItems={[]}
        loadingImages={false}
        onOpenLightbox={vi.fn()}
      />,
    );

    expect(screen.queryByText(/documentos pessoais/i)).not.toBeInTheDocument();
  });
});
