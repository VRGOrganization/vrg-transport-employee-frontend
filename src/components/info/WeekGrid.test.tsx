import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WeekGrid } from "./WeekGrid";
import { gridByDayPeriod, gridTotals } from "@/lib/info/selectors";
import { createBusPalette } from "@/lib/info/palette";
import { EMPTY_LENS, type InfoLens, type Seat } from "@/types/info.types";

function seat(over: Partial<Seat> = {}): Seat {
  return {
    studentId: "s1",
    requestId: "r1",
    cycleId: "cycle-1",
    universityId: "uni-1",
    courseKey: "engenharia",
    busId: "bus-1",
    busIdentifier: "Ônibus 01",
    day: "SEG",
    period: "Manhã",
    legs: 2,
    status: "active",
    shift: "Manhã",
    ...over,
  };
}

const PALETTE = createBusPalette(
  [
    { _id: "bus-1", identifier: "Ônibus 01" },
    { _id: "bus-2", identifier: "Ônibus 02" },
  ],
  false,
);

function renderGrid(seats: Seat[], lens: InfoLens = EMPTY_LENS) {
  const onPatchLens = vi.fn();
  const grid = gridByDayPeriod(seats);
  const totals = gridTotals(seats, grid);

  render(
    <WeekGrid
      grid={grid}
      totals={totals}
      lens={lens}
      palette={PALETTE}
      capacityByBusDay={new Map()}
      onPatchLens={onPatchLens}
    />,
  );

  return { onPatchLens };
}

describe("WeekGrid", () => {
  it("renderiza as 15 células da semana", () => {
    renderGrid([]);

    expect(screen.getAllByRole("gridcell")).toHaveLength(15);
  });

  it("descreve cada célula por extenso para leitores de tela", () => {
    renderGrid([
      seat({ studentId: "a", day: "QUA", period: "Noite" }),
      seat({ studentId: "b", day: "QUA", period: "Noite", busId: "bus-2", busIdentifier: "Ônibus 02" }),
    ]);

    expect(
      screen.getByRole("gridcell", {
        name: "Quarta, noite: 2 alunos em 2 ônibus",
      }),
    ).toBeInTheDocument();
  });

  it("clicar numa célula aplica o recorte de dia e turno", async () => {
    const user = userEvent.setup();
    const { onPatchLens } = renderGrid([seat({ day: "QUI", period: "Tarde" })]);

    await user.click(
      screen.getByRole("gridcell", { name: /Quinta, tarde/ }),
    );

    expect(onPatchLens).toHaveBeenCalledWith({ day: "QUI", period: "Tarde" });
  });

  it("clicar de novo na célula selecionada desfaz o recorte", async () => {
    const user = userEvent.setup();
    const { onPatchLens } = renderGrid([seat({ day: "SEG", period: "Manhã" })], {
      ...EMPTY_LENS,
      day: "SEG",
      period: "Manhã",
    });

    await user.click(screen.getByRole("gridcell", { name: /Segunda, manhã/ }));

    expect(onPatchLens).toHaveBeenCalledWith({ day: null, period: null });
  });

  it("o total do dia filtra o dia inteiro", async () => {
    const user = userEvent.setup();
    const { onPatchLens } = renderGrid([seat({ day: "SEX" })]);

    await user.click(screen.getByRole("columnheader", { name: /Sexta/ }));

    expect(onPatchLens).toHaveBeenCalledWith({ day: "SEX" });
  });

  it("o total do turno filtra o turno inteiro", async () => {
    const user = userEvent.setup();
    const { onPatchLens } = renderGrid([seat({ period: "Noite" })]);

    await user.click(screen.getByRole("rowheader", { name: /Noite/ }));

    expect(onPatchLens).toHaveBeenCalledWith({ period: "Noite" });
  });

  it("roving tabindex: só a célula ativa é tabulável", () => {
    renderGrid([seat()]);

    const focusable = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.getAttribute("tabindex") === "0");

    // A grade inteira é UMA parada de tabulação.
    expect(focusable).toHaveLength(1);
    expect(focusable[0]).toHaveAccessibleName(/Segunda, manhã/);
  });

  it("as setas movem o foco entre as células", async () => {
    const user = userEvent.setup();
    renderGrid([seat()]);

    const first = screen.getByRole("gridcell", { name: /Segunda, manhã/ });
    first.focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("gridcell", { name: /Terça, manhã/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("gridcell", { name: /Terça, tarde/ })).toHaveFocus();

    await user.keyboard("{ArrowLeft}{ArrowUp}");
    expect(first).toHaveFocus();
  });

  it("as setas não saem da grade nas bordas", async () => {
    const user = userEvent.setup();
    renderGrid([seat()]);

    const first = screen.getByRole("gridcell", { name: /Segunda, manhã/ });
    first.focus();

    await user.keyboard("{ArrowUp}{ArrowLeft}");

    expect(first).toHaveFocus();
  });

  it("Esc limpa o recorte de dia e turno", async () => {
    const user = userEvent.setup();
    const { onPatchLens } = renderGrid([seat()], {
      ...EMPTY_LENS,
      day: "SEG",
      period: "Manhã",
    });

    screen.getByRole("gridcell", { name: /Segunda, manhã/ }).focus();
    await user.keyboard("{Escape}");

    expect(onPatchLens).toHaveBeenCalledWith({ day: null, period: null });
  });

  it("usa singular no rótulo de uma única pessoa", () => {
    renderGrid([seat()]);

    expect(
      screen.getByRole("gridcell", {
        name: "Segunda, manhã: 1 aluno em 1 ônibus",
      }),
    ).toBeInTheDocument();
  });
});
