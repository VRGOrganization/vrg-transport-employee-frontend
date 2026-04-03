"use client";

import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { Button } from "@/components/ui/Button";

export default function EmployeeDashboard() {
  const { user, logout } = useEmployeeAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Painel do Funcionário</h1>
      <p>Bem-vindo, {user?.name}</p>
      <p>Matrícula: {user?.registrationId}</p>
      <Button onClick={logout}>Sair</Button>
    </div>
  );
}