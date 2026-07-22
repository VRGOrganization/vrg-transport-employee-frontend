import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UniversityTable } from "./UniversityTable";
import type { University } from "@/types/university.types";

const makeUniversity = (overrides: Partial<University> = {}): University => ({
  _id: "uni-1",
  name: "Universidade A",
  acronym: "UA",
  address: "Rua A",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("UniversityTable — indicador de cobertura de ônibus", () => {
  it("mostra selo de coberta pra faculdade com hasBus: true", () => {
    render(
      <UniversityTable
        universities={[makeUniversity({ hasBus: true })]}
        loading={false}
      />,
    );

    expect(screen.getByText(/coberta/i)).toBeInTheDocument();
  });

  it("mostra selo de sem cobertura pra faculdade com hasBus: false", () => {
    render(
      <UniversityTable
        universities={[makeUniversity({ hasBus: false })]}
        loading={false}
      />,
    );

    expect(screen.getByText(/sem cobertura/i)).toBeInTheDocument();
  });

  it("não quebra quando hasBus está ausente (undefined)", () => {
    render(
      <UniversityTable
        universities={[makeUniversity()]}
        loading={false}
      />,
    );

    expect(screen.getByText("UA")).toBeInTheDocument();
  });
});
