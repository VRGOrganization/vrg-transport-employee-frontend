import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { universitiesStub } = vi.hoisted(() => ({
  universitiesStub: [
    { _id: "uni-1", name: "Universidade Um", acronym: "U1", address: "-", active: true, createdAt: "", updatedAt: "" },
    { _id: "uni-2", name: "Universidade Dois", acronym: "U2", address: "-", active: true, createdAt: "", updatedAt: "" },
  ],
}));

vi.mock("@/services/universityService", () => ({
  universityService: {
    list: vi.fn().mockResolvedValue(universitiesStub),
  },
}));

import { OpenEnrollmentWindowModal } from "./OpenEnrollmentWindowModal";
import { universityService } from "@/services/universityService";

const baseProps = {
  open: true,
  loading: false,
  serverError: "",
  onClose: vi.fn(),
  onSubmit: vi.fn(() => Promise.resolve()),
};

describe("OpenEnrollmentWindowModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(universityService.list).mockResolvedValue(universitiesStub as never);
  });

  it("shows a generic title, not tied to 'repescagem'", () => {
    render(<OpenEnrollmentWindowModal {...baseProps} />);
    expect(screen.getByText("Abrir janela de inscrição")).toBeInTheDocument();
    expect(screen.queryByText(/repescagem/i)).not.toBeInTheDocument();
  });

  it("defaults to 'Todos os alunos' and does not show the multi-select", () => {
    render(<OpenEnrollmentWindowModal {...baseProps} />);
    expect(screen.getByLabelText(/^Todos os alunos/)).toBeChecked();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("shows the university multi-select only when 'Faculdades específicas' is selected", async () => {
    render(<OpenEnrollmentWindowModal {...baseProps} />);
    fireEvent.click(screen.getByLabelText(/^Faculdades específicas/));

    await waitFor(() => {
      expect(screen.getByText(/U1 — Universidade Um/)).toBeInTheDocument();
      expect(screen.getByText(/U2 — Universidade Dois/)).toBeInTheDocument();
    });
  });

  it("requires at least one university when scope is 'Faculdades específicas'", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Data de início"), { target: { value: "2030-04-01" } });
    fireEvent.change(screen.getByLabelText("Data de fim"), { target: { value: "2030-04-03" } });
    fireEvent.click(screen.getByLabelText(/^Faculdades específicas/));
    await waitFor(() => screen.getByText(/U1 — Universidade Um/));

    fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

    expect(await screen.findByText(/selecione ao menos uma faculdade/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits eligibilityScope=all without eligibleUniversityIds", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Data de início"), { target: { value: "2030-04-01" } });
    fireEvent.change(screen.getByLabelText("Data de fim"), { target: { value: "2030-04-03" } });
    fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.eligibilityScope).toBe("all");
    expect("eligibleUniversityIds" in payload).toBe(false);
  });

  it("submits eligibilityScope=specific_universities with selected ids", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Data de início"), { target: { value: "2030-04-01" } });
    fireEvent.change(screen.getByLabelText("Data de fim"), { target: { value: "2030-04-03" } });
    fireEvent.click(screen.getByLabelText(/^Faculdades específicas/));
    await waitFor(() => screen.getByText(/U1 — Universidade Um/));
    fireEvent.click(screen.getByText(/U1 — Universidade Um/));

    fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.eligibilityScope).toBe("specific_universities");
    expect(payload.eligibleUniversityIds).toEqual(["uni-1"]);
  });

  it("requires start and end dates", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

    expect(await screen.findByText(/data de início é obrigatória/i)).toBeInTheDocument();
    expect(screen.getByText(/data de fim é obrigatória/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows server error", () => {
    render(<OpenEnrollmentWindowModal {...baseProps} serverError="Já existe uma janela de inscrição ativa." />);
    expect(screen.getByText("Já existe uma janela de inscrição ativa.")).toBeInTheDocument();
  });
});
