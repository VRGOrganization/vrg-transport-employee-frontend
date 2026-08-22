import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listUniversitiesMock, createTemporaryMock, listActiveBusMock, adminCreateMock } =
  vi.hoisted(() => ({
    listUniversitiesMock: vi.fn(),
    createTemporaryMock: vi.fn(),
    listActiveBusMock: vi.fn(),
    adminCreateMock: vi.fn(),
  }));

vi.mock("@/services/universityService", () => ({
  universityService: {
    list: listUniversitiesMock,
    createTemporary: createTemporaryMock,
  },
}));

vi.mock("@/services/busService", () => ({
  busService: { listActive: listActiveBusMock },
}));

vi.mock("@/services/licenseRequestService", () => ({
  licenseRequestService: { adminCreate: adminCreateMock },
}));

import { AdminLicenseRequestForm } from "./AdminLicenseRequestForm";

const universities = [
  {
    _id: "uni-1",
    name: "Faculdade Um",
    acronym: "F1",
    address: "",
    active: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "uni-2",
    name: "Faculdade Dois",
    acronym: "F2",
    address: "",
    active: true,
    createdAt: "",
    updatedAt: "",
  },
];

const buses = [
  { _id: "bus-1", identifier: "Ônibus 1", active: true, createdAt: "", updatedAt: "" },
  { _id: "bus-2", identifier: "Ônibus 2", active: true, createdAt: "", updatedAt: "" },
];

/** Ônibus com turno definido, para exercitar o filtro por turno. */
const busesWithShift = [
  { _id: "bus-m", identifier: "Ônibus Manhã", shift: "Manhã", active: true, createdAt: "", updatedAt: "" },
  { _id: "bus-n", identifier: "Ônibus Noite", shift: "Noite", active: true, createdAt: "", updatedAt: "" },
];

function setSelect(label: RegExp, value: string) {
  fireEvent.change(screen.getByRole("combobox", { name: label }), {
    target: { value },
  });
}

/** Turno é pré-requisito da grade e do ônibus em todos os fluxos. */
function setShift(value: string, label: RegExp = /^Turno$/) {
  setSelect(label, value);
}

/** Anexa um arquivo a TODOS os campos de documento presentes (obrigatórios). */
function uploadAllDocs() {
  document.querySelectorAll('input[type="file"]').forEach((input, i) => {
    const file = new File(["x"], `doc-${i}.png`, { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
  });
}

describe("AdminLicenseRequestForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUniversitiesMock.mockResolvedValue(universities);
    listActiveBusMock.mockResolvedValue(buses);
    adminCreateMock.mockResolvedValue({ requestId: "req-1" });
  });

  async function renderReady() {
    render(<AdminLicenseRequestForm studentId="student-1" />);
    // Aguarda o carregamento de faculdades/ônibus. A lista de ônibus só é
    // preenchida depois que um turno é escolhido, então esperamos as duas
    // chamadas de carga em vez de uma opção de ônibus.
    await waitFor(() => {
      expect(listUniversitiesMock).toHaveBeenCalled();
      expect(listActiveBusMock).toHaveBeenCalled();
    });
    // datalist de faculdades já populado (não depende do turno)
    await waitFor(() =>
      expect(document.querySelector('option[value="Faculdade Um"]')).not.toBeNull(),
    );
  }

  it("does not send any secondary field when the secondary toggle is off (regression)", async () => {
    await renderReady();

    fireEvent.change(screen.getByPlaceholderText(/Digite ou selecione a faculdade/i), {
      target: { value: "Faculdade Um" },
    });
    setShift("Manhã");
    fireEvent.click(screen.getByLabelText("SEG Manhã"));
    setSelect(/Ônibus \(seleção manual\)/i, "bus-1");
    uploadAllDocs();

    fireEvent.click(screen.getByRole("button", { name: /Revisar pedido/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirmar e criar pedido/i }));

    await waitFor(() => expect(adminCreateMock).toHaveBeenCalledTimes(1));
    const payload = adminCreateMock.mock.calls[0][0];
    expect(payload.universityId).toBe("uni-1");
    expect(payload).not.toHaveProperty("secondaryUniversityId");
    expect(payload).not.toHaveProperty("secondaryInstitution");
    expect(payload).not.toHaveProperty("secondaryDegree");
    expect(payload).not.toHaveProperty("secondarySchedule");
    expect(payload).not.toHaveProperty("secondaryBusId");
  });

  it("sends the secondary institution fields in the payload when the toggle is on", async () => {
    await renderReady();

    // primária
    fireEvent.change(screen.getByPlaceholderText(/Digite ou selecione a faculdade/i), {
      target: { value: "Faculdade Um" },
    });
    setShift("Manhã");
    fireEvent.click(screen.getByLabelText("SEG Manhã"));
    setSelect(/Ônibus \(seleção manual\)/i, "bus-1");

    // liga o bloco secundário
    fireEvent.click(screen.getByLabelText(/Aluno cursa em segunda instituição/i));

    // secundária
    fireEvent.change(
      screen.getByPlaceholderText(/Digite ou selecione a segunda faculdade/i),
      { target: { value: "Faculdade Dois" } },
    );
    fireEvent.change(screen.getByLabelText(/Curso \/ Graduação \(2ª\)/i), {
      target: { value: "Direito" },
    });
    setShift("Noite", /Turno \(2ª\)/);
    fireEvent.click(screen.getByLabelText("TER Noite (2ª)"));
    setSelect(/Ônibus \(2ª\)/i, "bus-2");
    uploadAllDocs();

    fireEvent.click(screen.getByRole("button", { name: /Revisar pedido/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirmar e criar pedido/i }));

    await waitFor(() => expect(adminCreateMock).toHaveBeenCalledTimes(1));
    const payload = adminCreateMock.mock.calls[0][0];
    expect(payload.secondaryUniversityId).toBe("uni-2");
    expect(payload.secondaryInstitution).toBe("Faculdade Dois");
    expect(payload.secondaryDegree).toBe("Direito");
    expect(payload.secondaryBusId).toBe("bus-2");
    expect(payload.secondarySchedule).toEqual([{ day: "TER", period: "Noite" }]);
  });

  it("blocks submit and shows an error when primary and secondary schedules collide", async () => {
    await renderReady();

    fireEvent.change(screen.getByPlaceholderText(/Digite ou selecione a faculdade/i), {
      target: { value: "Faculdade Um" },
    });
    setShift("Manhã");
    fireEvent.click(screen.getByLabelText("SEG Manhã"));
    setSelect(/Ônibus \(seleção manual\)/i, "bus-1");

    fireEvent.click(screen.getByLabelText(/Aluno cursa em segunda instituição/i));
    fireEvent.change(
      screen.getByPlaceholderText(/Digite ou selecione a segunda faculdade/i),
      { target: { value: "Faculdade Dois" } },
    );
    fireEvent.change(screen.getByLabelText(/Curso \/ Graduação \(2ª\)/i), {
      target: { value: "Direito" },
    });
    // mesmo turno e mesmo slot da primária -> colisão
    setShift("Manhã", /Turno \(2ª\)/);
    fireEvent.click(screen.getByLabelText("SEG Manhã (2ª)"));
    setSelect(/Ônibus \(2ª\)/i, "bus-2");
    uploadAllDocs();

    fireEvent.click(screen.getByRole("button", { name: /Revisar pedido/i }));

    await screen.findByText(/colis/i);
    expect(adminCreateMock).not.toHaveBeenCalled();
  });

  it("blocks submit and shows an error when required documents are missing", async () => {
    await renderReady();

    fireEvent.change(screen.getByPlaceholderText(/Digite ou selecione a faculdade/i), {
      target: { value: "Faculdade Um" },
    });
    setShift("Manhã");
    fireEvent.click(screen.getByLabelText("SEG Manhã"));
    setSelect(/Ônibus \(seleção manual\)/i, "bus-1");
    // sem anexar documentos

    fireEvent.click(screen.getByRole("button", { name: /Revisar pedido/i }));

    await screen.findByText(/Anexe a foto 3x4/i);
    expect(adminCreateMock).not.toHaveBeenCalled();
  });

  it("confirma a criação sem expor o id do pedido na mensagem", async () => {
    await renderReady();

    fireEvent.change(screen.getByPlaceholderText(/Digite ou selecione a faculdade/i), {
      target: { value: "Faculdade Um" },
    });
    setShift("Manhã");
    fireEvent.click(screen.getByLabelText("SEG Manhã"));
    setSelect(/Ônibus \(seleção manual\)/i, "bus-1");
    uploadAllDocs();

    fireEvent.click(screen.getByRole("button", { name: /Revisar pedido/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirmar e criar pedido/i }));

    const banner = await screen.findByText(/Pedido criado com sucesso e adicionado à fila/i);
    // Nem o id devolvido pela API nem um ObjectId cru podem aparecer na tela.
    expect(banner.textContent).not.toContain("req-1");
    expect(banner.textContent).not.toMatch(/\(id\b/i);
    expect(banner.textContent).not.toMatch(/[0-9a-f]{24}/i);
    expect(adminCreateMock).toHaveBeenCalledTimes(1);
  });

  it("continua entregando o id do pedido para o onSuccess", async () => {
    const onSuccess = vi.fn();
    render(<AdminLicenseRequestForm studentId="student-1" onSuccess={onSuccess} />);
    await waitFor(() =>
      expect(document.querySelector('option[value="Faculdade Um"]')).not.toBeNull(),
    );

    fireEvent.change(screen.getByPlaceholderText(/Digite ou selecione a faculdade/i), {
      target: { value: "Faculdade Um" },
    });
    setShift("Manhã");
    fireEvent.click(screen.getByLabelText("SEG Manhã"));
    setSelect(/Ônibus \(seleção manual\)/i, "bus-1");
    uploadAllDocs();

    fireEvent.click(screen.getByRole("button", { name: /Revisar pedido/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Confirmar e criar pedido/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("req-1"));
  });

  describe("foto 3x4 aceita apenas imagem", () => {
    // A license-api decodifica a foto com Pillow e só aceita
    // ALLOWED_PHOTO_FORMATS = {JPEG, PNG, WEBP} — PDF quebraria na geração.
    const fotoInput = () =>
      screen.getByLabelText(/Selecionar Foto 3x4/i).parentElement!.parentElement!
        .querySelector('input[type="file"]') as HTMLInputElement;

    it("não oferece PDF no seletor da foto 3x4", async () => {
      await renderReady();

      expect(fotoInput().accept).toBe("image/jpeg,image/png,image/webp");
    });

    it("mantém PDF disponível nos comprovantes", async () => {
      await renderReady();

      const comprovante = screen
        .getByLabelText(/Selecionar Comprovante de matrícula/i)
        .parentElement!.parentElement!.querySelector(
          'input[type="file"]',
        ) as HTMLInputElement;

      expect(comprovante.accept).toContain("application/pdf");
    });

    it("recusa um PDF escolhido na foto 3x4 e explica o motivo", async () => {
      await renderReady();

      const pdf = new File(["x"], "foto.pdf", { type: "application/pdf" });
      fireEvent.change(fotoInput(), { target: { files: [pdf] } });

      await screen.findByText(/PDF não é aceito na foto 3x4/i);
      expect(screen.queryByText("foto.pdf")).not.toBeInTheDocument();
    });

    it("aceita uma imagem na foto 3x4", async () => {
      await renderReady();

      const png = new File(["x"], "foto.png", { type: "image/png" });
      fireEvent.change(fotoInput(), { target: { files: [png] } });

      expect(await screen.findByText("foto.png")).toBeInTheDocument();
      expect(screen.queryByText(/PDF não é aceito/i)).not.toBeInTheDocument();
    });
  });

  describe("coerência entre turno, grade de horários e ônibus", () => {
    it("mantém grade e ônibus bloqueados enquanto nenhum turno é escolhido", async () => {
      await renderReady();

      expect(screen.getByLabelText("SEG Manhã")).toBeDisabled();
      expect(screen.getByLabelText("SEG Noite")).toBeDisabled();
      expect(screen.getByRole("combobox", { name: /Ônibus \(seleção manual\)/i })).toBeDisabled();
      expect(screen.getByText(/Selecione o turno para liberar a grade/i)).toBeInTheDocument();
    });

    it("libera apenas os horários do turno escolhido", async () => {
      await renderReady();
      setShift("Manhã");

      expect(screen.getByLabelText("SEG Manhã")).not.toBeDisabled();
      expect(screen.getByLabelText("SEG Tarde")).toBeDisabled();
      expect(screen.getByLabelText("SEG Noite")).toBeDisabled();
    });

    it("turno Integral libera todos os períodos da grade", async () => {
      await renderReady();
      setShift("Integral");

      expect(screen.getByLabelText("SEG Manhã")).not.toBeDisabled();
      expect(screen.getByLabelText("SEG Tarde")).not.toBeDisabled();
      expect(screen.getByLabelText("SEG Noite")).not.toBeDisabled();
    });

    it("descarta horários incompatíveis ao trocar o turno", async () => {
      await renderReady();

      setShift("Manhã");
      fireEvent.click(screen.getByLabelText("SEG Manhã"));
      expect(screen.getByLabelText("SEG Manhã")).toBeChecked();

      // Trocar para Noite invalida o horário da manhã já marcado.
      setShift("Noite");
      expect(screen.getByLabelText("SEG Manhã")).not.toBeChecked();
      expect(screen.getByLabelText("SEG Manhã")).toBeDisabled();
    });

    it("lista apenas ônibus do turno escolhido", async () => {
      listActiveBusMock.mockResolvedValue(busesWithShift);
      render(<AdminLicenseRequestForm studentId="student-1" />);
      await waitFor(() => expect(listActiveBusMock).toHaveBeenCalled());

      setShift("Manhã");
      await screen.findByRole("option", { name: /Ônibus Manhã/ });
      expect(screen.queryByRole("option", { name: /Ônibus Noite/ })).not.toBeInTheDocument();

      setShift("Noite");
      await screen.findByRole("option", { name: /Ônibus Noite/ });
      expect(screen.queryByRole("option", { name: /Ônibus Manhã/ })).not.toBeInTheDocument();
    });

    it("turno Integral lista ônibus de todos os turnos", async () => {
      listActiveBusMock.mockResolvedValue(busesWithShift);
      render(<AdminLicenseRequestForm studentId="student-1" />);
      await waitFor(() => expect(listActiveBusMock).toHaveBeenCalled());

      setShift("Integral");

      await screen.findByRole("option", { name: /Ônibus Manhã/ });
      expect(screen.getByRole("option", { name: /Ônibus Noite/ })).toBeInTheDocument();
    });

    it("limpa o ônibus escolhido quando ele não atende ao novo turno", async () => {
      listActiveBusMock.mockResolvedValue(busesWithShift);
      render(<AdminLicenseRequestForm studentId="student-1" />);
      await waitFor(() => expect(listActiveBusMock).toHaveBeenCalled());

      setShift("Manhã");
      await screen.findByRole("option", { name: /Ônibus Manhã/ });
      setSelect(/Ônibus \(seleção manual\)/i, "bus-m");
      expect(screen.getByRole("combobox", { name: /Ônibus \(seleção manual\)/i })).toHaveValue("bus-m");

      setShift("Noite");
      await waitFor(() =>
        expect(screen.getByRole("combobox", { name: /Ônibus \(seleção manual\)/i })).toHaveValue(""),
      );
    });

    it("bloqueia o envio quando o turno não foi escolhido", async () => {
      await renderReady();

      fireEvent.change(screen.getByPlaceholderText(/Digite ou selecione a faculdade/i), {
        target: { value: "Faculdade Um" },
      });
      uploadAllDocs();

      fireEvent.click(screen.getByRole("button", { name: /Revisar pedido/i }));

      await screen.findByText(/Escolha o turno do aluno antes de continuar/i);
      expect(adminCreateMock).not.toHaveBeenCalled();
    });
  });
});
