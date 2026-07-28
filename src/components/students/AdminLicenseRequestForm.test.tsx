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

function setSelect(label: RegExp, value: string) {
  fireEvent.change(screen.getByRole("combobox", { name: label }), {
    target: { value },
  });
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
    // aguarda o carregamento de faculdades/ônibus
    await screen.findByRole("option", { name: "Ônibus 1" });
  }

  it("does not send any secondary field when the secondary toggle is off (regression)", async () => {
    await renderReady();

    fireEvent.change(screen.getByPlaceholderText(/Digite ou selecione a faculdade/i), {
      target: { value: "Faculdade Um" },
    });
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
    // mesmo slot da primária -> colisão
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
    fireEvent.click(screen.getByLabelText("SEG Manhã"));
    setSelect(/Ônibus \(seleção manual\)/i, "bus-1");
    // sem anexar documentos

    fireEvent.click(screen.getByRole("button", { name: /Revisar pedido/i }));

    await screen.findByText(/Anexe a foto 3x4/i);
    expect(adminCreateMock).not.toHaveBeenCalled();
  });
});
