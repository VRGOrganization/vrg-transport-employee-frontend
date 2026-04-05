"use client";


import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { Button } from "@/components/ui/Button";

export default function AdminDashboard() {
  const { user, logout } = useEmployeeAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Painel do Administrador</h1>
      <p>Bem-vindo, {user?.name}</p>
      <Button onClick={logout}>Sair</Button>
    </div>
  );
}