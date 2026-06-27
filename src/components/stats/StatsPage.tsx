"use client";

import { StatsDashboard } from "@/components/stats/StatsDashboard";

interface StatsPageProps {
  role: "admin" | "employee";
}

export function StatsPage({ role }: StatsPageProps) {
  void role;
  return (
    <main className="flex-1 p-8">
      <StatsDashboard />
    </main>
  );
}
