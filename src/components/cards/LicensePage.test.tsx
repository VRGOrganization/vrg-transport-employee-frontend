import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LicenseRequestRecord } from "@/types/cards.types";

const mocks = vi.hoisted(() => ({
  useCardsData: vi.fn(),
  clearSelection: vi.fn(),
  currentLicenseRequest: null as unknown,
  reissueProps: vi.fn(),
}));

vi.mock("@/components/hooks/useCardsData", () => ({
  useCardsData: mocks.useCardsData,
}));

vi.mock("@/components/hooks/useAutoRefresh", () => ({
  useAutoRefresh: () => ({ isAutoRefreshing: false }),
}));

vi.mock("@/components/hooks/usePdfPrint", () => ({
  usePdfPrint: () => ({
    pdfPreviewUrl: null,
    pdfPreviewTitle: "",
    printingSingle: false,
    printingBatch: false,
    selectedForBatch: new Set<string>(),
    closePdfPreview: vi.fn(),
    toggleBatchSelection: vi.fn(),
    setBatchSelection: vi.fn(),
    handlePrintSingle: vi.fn(),
    handlePrintBatch: vi.fn(),
    buildPrintableMap: () => new Map(),
  }),
}));

vi.mock("@/components/hooks/useStudentSelection", () => ({
  useStudentSelection: () => ({
    selected: mocks.currentLicenseRequest ? { _id: "s1" } : null,
    selectedImages: [],
    loadingSelected: false,
    currentLicense: null,
    fullLicense: null,
    currentLicenseRequest: mocks.currentLicenseRequest,
    pendingImagesByType: {},
    selectStudent: vi.fn(),
    clearSelection: mocks.clearSelection,
  }),
}));

vi.mock("@/services/universityService", () => ({
  universityService: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/components/universities/UniversitySelectorPanel", () => ({
  default: () => <div>Seletor de faculdades</div>,
}));

vi.mock("@/components/cards/BusQueueSelectorPanel", () => ({
  default: ({ onChange }: { onChange: (bus: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onChange({
          busId: "bus-2",
          identifier: "02",
          shift: "Manhã",
          capacity: 48,
          universities: [{ universityId: "u1", acronym: "UNIFEV" }],
          pendingCount: 1,
          revisionCount: 0,
          waitlistedCount: 0,
        })
      }
    >
      Escolher ônibus 02
    </button>
  ),
}));

vi.mock("@/components/cards/StudentListPanel", () => ({
  StudentListPanel: () => <div>Lista de alunos</div>,
}));

vi.mock("@/components/cards/StudentDetailPanel", () => ({
  StudentDetailPanel: () => <div>Detalhe do aluno</div>,
}));

vi.mock("@/components/cards/ReissueCandidatesSection", () => ({
  ReissueCandidatesSection: (props: unknown) => {
    mocks.reissueProps(props);
    return null;
  },
}));

import { LicensePage } from "./LicensePage";
import { QUEUE_VIEW_STORAGE_KEY } from "@/components/hooks/useQueueViewMode";

function installLocalStorageMock(): Storage {
  const data = new Map<string, string>();
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    removeItem: vi.fn((key: string) => void data.delete(key)),
    clear: vi.fn(() => data.clear()),
    key: vi.fn(() => null),
    get length() {
      return data.size;
    },
  } as Storage;
  Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
  return storage;
}

function cardsData() {
  return {
    students: [],
    licenses: [],
    licenseRequests: [],
    loading: false,
    error: "",
    licensedStudentIds: new Set<string>(),
    pendingStudentIds: new Set<string>(),
    waitlistedStudentIds: new Set<string>(),
    stats: { total: 0, withCard: 0, pending: 0, waitlisted: 0, review: 0 },
    reload: vi.fn(),
  };
}

describe("LicensePage: visão da fila por faculdade ou por ônibus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installLocalStorageMock();
    mocks.useCardsData.mockImplementation(cardsData);
    mocks.currentLicenseRequest = null;
  });

  it("começa na visão por ônibus, com a opção por ônibus primeiro", () => {
    render(<LicensePage role="employee" />);

    expect(screen.getByRole("button", { name: "Escolher ônibus 02" })).toBeInTheDocument();
    const toggles = screen.getAllByRole("button", { name: /^Por / });
    expect(toggles.map((button) => button.textContent)).toEqual(["Por ônibus", "Por faculdade"]);
    expect(screen.getByRole("button", { name: "Por ônibus" })).toHaveAttribute("aria-pressed", "true");
  });

  it("troca para a visão por faculdade e guarda a preferência", () => {
    render(<LicensePage role="employee" />);

    fireEvent.click(screen.getByRole("button", { name: "Por faculdade" }));

    expect(screen.getByText("Seletor de faculdades")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Escolher ônibus 02" })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(QUEUE_VIEW_STORAGE_KEY)).toBe("university");
  });

  it("restaura a visão por faculdade salva", async () => {
    window.localStorage.setItem(QUEUE_VIEW_STORAGE_KEY, "university");

    render(<LicensePage role="admin" />);

    expect(await screen.findByText("Seletor de faculdades")).toBeInTheDocument();
  });

  it("ao escolher um ônibus, carrega a fila daquele ônibus e permite voltar", async () => {
    render(<LicensePage role="employee" />);

    fireEvent.click(await screen.findByRole("button", { name: "Escolher ônibus 02" }));

    expect(mocks.useCardsData).toHaveBeenLastCalledWith({ kind: "bus", busId: "bus-2" });
    expect(screen.getByRole("heading", { name: /Ônibus 02/ })).toBeInTheDocument();
    expect(screen.getByText("Lista de alunos")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Por faculdade" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Voltar para a lista de ônibus" }));

    expect(await screen.findByRole("button", { name: "Escolher ônibus 02" })).toBeInTheDocument();
    expect(mocks.useCardsData).toHaveBeenLastCalledWith(null);
  });

  it("trocar de visão limpa o aluno selecionado", () => {
    render(<LicensePage role="employee" />);
    mocks.clearSelection.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Por faculdade" }));

    expect(mocks.clearSelection).toHaveBeenCalled();
  });

  it("avisa que aprovar inclui os dias do pedido em outro ônibus", async () => {
    mocks.currentLicenseRequest = {
      _id: "r1",
      studentId: "s1",
      status: "pending",
      allocationSummary: [
        { day: "SEG", period: "Manhã", busId: "bus-2", busIdentifier: "02", status: "active" },
        { day: "TER", period: "Manhã", busId: "bus-5", busIdentifier: "05", status: "active" },
      ],
    } as unknown as LicenseRequestRecord;

    render(<LicensePage role="employee" />);
    fireEvent.click(await screen.findByRole("button", { name: "Escolher ônibus 02" }));

    await waitFor(() =>
      expect(
        screen.getByText("Aprovar aprova o pedido inteiro, incluindo os dias no ônibus 05."),
      ).toBeInTheDocument(),
    );
  });
});
