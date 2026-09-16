import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BanHistoryModal } from "./BanHistoryModal";
import type { BanHistoryEntry } from "@/types/banlist";

const cycleEncerrado: BanHistoryEntry = {
  banId: "ban1",
  active: false,
  bannedAt: "2026-01-10T12:00:00.000Z",
  bannedByName: "Admin Um",
  bannedByAdminId: "admin1",
  reasons: ["Uso indevido da carteirinha"],
  unbannedAt: "2026-02-01T09:30:00.000Z",
  unbannedByName: "Admin Dois",
  unbannedByAdminId: "admin2",
  unbanReasons: ["Recurso aceito"],
  events: [
    {
      type: "ban",
      at: "2026-01-10T12:00:00.000Z",
      byName: "Admin Um",
      byId: "admin1",
      reasons: ["Uso indevido da carteirinha"],
    },
    {
      type: "unban",
      at: "2026-02-01T09:30:00.000Z",
      byName: "Admin Dois",
      byId: "admin2",
      reasons: ["Recurso aceito"],
    },
  ],
};

const cycleAtivo: BanHistoryEntry = {
  banId: "ban2",
  active: true,
  bannedAt: "2026-05-05T08:00:00.000Z",
  bannedByName: "Admin Um",
  bannedByAdminId: "admin1",
  reasons: ["Reincidência"],
  unbannedAt: null,
  unbannedByName: null,
  unbannedByAdminId: null,
  unbanReasons: [],
  events: [
    {
      type: "ban",
      at: "2026-05-05T08:00:00.000Z",
      byName: "Admin Um",
      byId: "admin1",
      reasons: ["Reincidência"],
    },
  ],
};

function renderModal(props: Partial<React.ComponentProps<typeof BanHistoryModal>> = {}) {
  return render(
    <BanHistoryModal
      open
      studentName="Ana Beatriz Rocha"
      history={[cycleEncerrado]}
      onClose={vi.fn()}
      {...props}
    />,
  );
}

describe("BanHistoryModal", () => {
  it("mostra data e hora, quem baniu e o motivo", () => {
    renderModal();

    expect(screen.getByText("Admin Um")).toBeInTheDocument();
    expect(screen.getByText("Uso indevido da carteirinha")).toBeInTheDocument();
    // data + hora (não só a data)
    expect(screen.getByText(/10 de (jan|Jan).*\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("mostra o evento de reativação com quem reativou e o motivo", () => {
    renderModal();

    expect(screen.getByText("Reativado")).toBeInTheDocument();
    expect(screen.getByText("Admin Dois")).toBeInTheDocument();
    expect(screen.getByText("Recurso aceito")).toBeInTheDocument();
  });

  it("marca o ciclo ainda em vigor e o encerrado", () => {
    renderModal({ history: [cycleEncerrado, cycleAtivo] });

    expect(screen.getByText("Em vigor")).toBeInTheDocument();
    expect(screen.getByText("Encerrado")).toBeInTheDocument();
  });

  it("numera os banimentos em ordem cronológica, com o mais recente no topo", () => {
    renderModal({ history: [cycleEncerrado, cycleAtivo] });

    const headings = screen.getAllByText(/º banimento/);
    // o mais recente (2º) aparece primeiro na tela
    expect(headings[0]).toHaveTextContent("2º banimento");
    expect(headings[1]).toHaveTextContent("1º banimento");
  });

  it("não mostra evento de reativação enquanto o banimento está ativo", () => {
    renderModal({ history: [cycleAtivo] });

    expect(screen.queryByText("Reativado")).not.toBeInTheDocument();
    expect(screen.getByText("Banido")).toBeInTheDocument();
  });

  it("usa rótulo neutro quando o responsável não existe mais", () => {
    renderModal({
      history: [
        {
          ...cycleAtivo,
          bannedByName: null,
          events: [{ ...cycleAtivo.events[0], byName: null }],
        },
      ],
    });

    expect(screen.getByText("Usuário removido do sistema")).toBeInTheDocument();
  });

  it("informa quando o aluno nunca foi banido", () => {
    renderModal({ history: [] });

    expect(screen.getByText(/nunca foi banido/i)).toBeInTheDocument();
  });

  it("mostra a mensagem de erro quando a carga falha", () => {
    renderModal({ history: [], error: "Não foi possível carregar o histórico de banimentos." });

    expect(screen.getByText(/Não foi possível carregar o histórico/i)).toBeInTheDocument();
  });

  it("não renderiza nada quando fechado", () => {
    renderModal({ open: false });

    expect(screen.queryByText(/Histórico de banimentos/i)).not.toBeInTheDocument();
  });

  it("identifica o aluno no cabeçalho", () => {
    renderModal();
    expect(screen.getByText("Ana Beatriz Rocha")).toBeInTheDocument();
  });
});
