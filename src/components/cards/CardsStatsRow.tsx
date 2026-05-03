import { DashboardStatCard } from "@/components/cards/DashboardStatCard";

interface CardsStatsRowProps {
  total: number;
  withCard: number;
  pending: number;
  waitlisted: number;
}

export function CardsStatsRow({ total, withCard, pending, waitlisted }: CardsStatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <DashboardStatCard
        icon="person"
        label="Alunos ativos"
        value={total}
        badge="Total"
        accent="primary"
      />
      <DashboardStatCard
        icon="badge"
        label="Carteirinhas criadas"
        value={withCard}
        badge="Emitidas"
        accent="secondary"
      />
      <DashboardStatCard
        icon="calendar_month"
        label="Pendentes de aprovação"
        value={pending}
        badge="Pendentes"
        accent="tertiary"
      />
      <DashboardStatCard
        icon="schedule"
        label="Na fila de espera"
        value={waitlisted}
        badge="Fila"
        accent="secondary"
      />
    </div>
  );
}