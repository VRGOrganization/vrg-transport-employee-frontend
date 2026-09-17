import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBusQueueMock } = vi.hoisted(() => ({ getBusQueueMock: vi.fn() }));

vi.mock("@/services/licenseRequestService", () => ({
  licenseRequestService: { getBusQueue: getBusQueueMock },
}));

import BusQueueSelectorPanel from "./BusQueueSelectorPanel";

const BUSES = [
  {
    busId: "bus-2",
    identifier: "02",
    shift: "Manhã",
    capacity: 48,
    universities: [
      { universityId: "uni-1", acronym: "UNIFEV" },
      { universityId: "uni-2", acronym: "FATEC" },
    ],
    pendingCount: 5,
    revisionCount: 1,
    waitlistedCount: 2,
  },
  {
    busId: "bus-7",
    identifier: "07",
    shift: "Noite",
    capacity: 44,
    universities: [],
    pendingCount: 0,
    revisionCount: 0,
    waitlistedCount: 0,
  },
];

describe("BusQueueSelectorPanel", () => {
  beforeEach(() => {
    getBusQueueMock.mockReset();
  });

  it("lista os ônibus com turno, vagas por dia, faculdades e contagens da fila", async () => {
    getBusQueueMock.mockResolvedValue({ enrollmentCycleId: "cycle-1", buses: BUSES });

    render(<BusQueueSelectorPanel onChange={vi.fn()} />);

    const bus02 = await screen.findByRole("button", { name: /Ônibus 02/ });
    expect(bus02).toHaveTextContent("Manhã");
    expect(bus02).toHaveTextContent("48 vagas por dia");
    expect(bus02).toHaveTextContent("UNIFEV, FATEC");
    expect(bus02).toHaveTextContent("5 pendentes");
    expect(bus02).toHaveTextContent("2 em fila");
    expect(bus02).toHaveTextContent("1 em revisão");

    const bus07 = screen.getByRole("button", { name: /Ônibus 07/ });
    expect(bus07).toHaveTextContent("0 pendentes");
    expect(bus07).not.toHaveTextContent("em fila");
  });

  it("devolve o ônibus escolhido", async () => {
    getBusQueueMock.mockResolvedValue({ enrollmentCycleId: "cycle-1", buses: BUSES });
    const onChange = vi.fn();

    render(<BusQueueSelectorPanel onChange={onChange} />);
    fireEvent.click(await screen.findByRole("button", { name: /Ônibus 07/ }));

    expect(onChange).toHaveBeenCalledWith(BUSES[1]);
  });

  it("mostra estado vazio e erro de carregamento", async () => {
    getBusQueueMock.mockResolvedValueOnce({ enrollmentCycleId: null, buses: [] });
    const { unmount } = render(<BusQueueSelectorPanel onChange={vi.fn()} />);
    expect(await screen.findByText("Nenhum ônibus ativo")).toBeInTheDocument();
    unmount();

    getBusQueueMock.mockRejectedValueOnce(new Error("falhou"));
    render(<BusQueueSelectorPanel onChange={vi.fn()} />);
    expect(await screen.findByText("Não foi possível carregar os ônibus")).toBeInTheDocument();
  });
});
