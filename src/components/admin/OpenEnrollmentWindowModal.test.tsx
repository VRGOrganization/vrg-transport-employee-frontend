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
  // Ciclo de 01/01/2030 a 01/07/2030 (meia-noite de Brasília).
  cycleStartDate: "2030-01-01T03:00:00.000Z",
  cycleEndDate: "2030-07-01T03:00:00.000Z",
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
    // O único checkbox fora do escopo 'específicas' é o de encerrar
    // carteirinhas; nenhuma faculdade é listada.
    expect(screen.queryByText(/U1: Universidade Um/)).not.toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(1);
  });

  it("shows the university multi-select only when 'Faculdades específicas' is selected", async () => {
    render(<OpenEnrollmentWindowModal {...baseProps} />);
    fireEvent.click(screen.getByLabelText(/^Faculdades específicas/));

    await waitFor(() => {
      expect(screen.getByText(/U1: Universidade Um/)).toBeInTheDocument();
      expect(screen.getByText(/U2: Universidade Dois/)).toBeInTheDocument();
    });
  });

  it("requires at least one university when scope is 'Faculdades específicas'", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Data de início"), { target: { value: "2030-04-01" } });
    fireEvent.change(screen.getByLabelText("Data de fim"), { target: { value: "2030-04-03" } });
    fireEvent.click(screen.getByLabelText(/^Faculdades específicas/));
    await waitFor(() => screen.getByText(/U1: Universidade Um/));

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
    await waitFor(() => screen.getByText(/U1: Universidade Um/));
    fireEvent.click(screen.getByText(/U1: Universidade Um/));

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

  it("trava os inputs no intervalo do ciclo", () => {
    render(<OpenEnrollmentWindowModal {...baseProps} />);

    const start = screen.getByLabelText(/data de início/i);
    expect(start).toHaveAttribute("min", "2030-01-01");
    expect(start).toHaveAttribute("max", "2030-07-01");
    expect(screen.getByLabelText(/data de fim/i)).toHaveAttribute(
      "max",
      "2030-07-01",
    );
  });

  it("recusa janela que começa antes do início do ciclo", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2029-12-20" },
    });
    fireEvent.change(screen.getByLabelText(/data de fim/i), {
      target: { value: "2030-02-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

    expect(
      await screen.findByText(/não pode começar antes do início do ciclo/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("recusa janela que termina depois do encerramento do ciclo", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2030-02-01" },
    });
    fireEvent.change(screen.getByLabelText(/data de fim/i), {
      target: { value: "2030-08-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

    expect(
      await screen.findByText(/não pode terminar depois do encerramento do ciclo/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envia início e fim no fuso de Brasília (mesmo dia escolhido)", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2030-02-01" },
    });
    fireEvent.change(screen.getByLabelText(/data de fim/i), {
      target: { value: "2030-02-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    const asBRDate = (iso: string) =>
      new Date(iso).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
    expect(asBRDate(payload.startDate)).toBe("01/02/2030");
    expect(asBRDate(payload.endDate)).toBe("10/02/2030");
  });


  // Reset é destrutivo e opt-in: o admin tem que pedir, e tem que ver o que
  // está pedindo antes de confirmar.
  describe("encerrar carteirinhas ao abrir", () => {
    const fillDates = () => {
      fireEvent.change(screen.getByLabelText("Data de início"), {
        target: { value: "2030-04-01" },
      });
      fireEvent.change(screen.getByLabelText("Data de fim"), {
        target: { value: "2030-04-03" },
      });
    };

    it("nasce desmarcado e não manda a flag ligada", async () => {
      const onSubmit = vi.fn(() => Promise.resolve());
      render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

      expect(
        screen.getByLabelText(/encerrar as carteirinhas/i),
      ).not.toBeChecked();

      fillDates();
      fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
      expect(onSubmit.mock.calls[0][0].resetEligibleStudentsOnOpen).toBe(false);
    });

    it("marcar mostra o aviso do que será perdido", () => {
      render(<OpenEnrollmentWindowModal {...baseProps} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      fireEvent.click(screen.getByLabelText(/encerrar as carteirinhas/i));

      const warning = screen.getByRole("alert");
      expect(warning).toHaveTextContent(/vaga/i);
      expect(warning).toHaveTextContent(/passe/i);
      // O admin precisa saber o que NÃO acontece, senão o botão parece o
      // encerramento de ciclo.
      expect(warning).toHaveTextContent(/ciclo/i);
    });

    it("com escopo de faculdades, o aviso nomeia as faculdades escolhidas", async () => {
      render(<OpenEnrollmentWindowModal {...baseProps} />);

      fireEvent.click(screen.getByLabelText(/^Faculdades específicas/));
      await waitFor(() => screen.getByText(/U1: Universidade Um/));
      fireEvent.click(screen.getByLabelText(/U1: Universidade Um/));
      fireEvent.click(screen.getByLabelText(/encerrar as carteirinhas/i));

      expect(screen.getByRole("alert")).toHaveTextContent(/U1/);
    });

    it("envia a flag ligada quando marcado", async () => {
      const onSubmit = vi.fn(() => Promise.resolve());
      render(<OpenEnrollmentWindowModal {...baseProps} onSubmit={onSubmit} />);

      fillDates();
      fireEvent.click(screen.getByLabelText(/encerrar as carteirinhas/i));
      fireEvent.click(screen.getByRole("button", { name: /abrir janela/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
      expect(onSubmit.mock.calls[0][0].resetEligibleStudentsOnOpen).toBe(true);
    });
  });
});
