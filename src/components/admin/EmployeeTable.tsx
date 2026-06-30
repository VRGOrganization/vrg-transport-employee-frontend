"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { EmployeeModal } from "@/components/employees/EmployeeModal";
import type { Employee } from "@/types/employee";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import type { PageSize } from "@/lib/constants";

interface EmployeeTableProps {
  employees: Employee[];
  loading?: boolean;
  onUpdated: (updated: Employee) => void;
  onDeleted: (id: string) => void;
}

export function EmployeeTable({ employees, loading, onUpdated, onDeleted }: EmployeeTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handlePageSizeChange = (size: PageSize) => {
    setPageSize(size);
    setPage(1);
  };

  const handleUpdated = (updated: Employee) => {
    onUpdated(updated);
    setSelectedEmployee(null);
  };

  const handleDeleted = (id: string) => {
    onDeleted(id);
    setSelectedEmployee(null);
    const newTotalPages = Math.max(1, Math.ceil((employees.length - 1) / pageSize));
    if (page > newTotalPages) setPage(newTotalPages);
  };

  const paginated = employees.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Employee>[] = [
    {
      key: "name",
      label: "Nome do Funcionário",
      render: (emp) => (
        <div className="flex items-center gap-4">
          <Avatar name={emp.name} size="sm" />
          <span className="font-semibold text-on-surface capitalize">{emp.name}</span>
        </div>
      ),
      skeleton: () => (
        <div className="flex items-center gap-4">
          <div className="size-9 rounded-full bg-surface-container-high animate-pulse shrink-0" />
          <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse" />
        </div>
      ),
    },
    {
      key: "email",
      label: "E-mail",
      render: (emp) => <span className="text-on-surface-variant">{emp.email}</span>,
    },
    {
      key: "actions",
      label: "Ações",
      align: "right",
      render: (emp) => (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedEmployee(emp)}
            className="p-2 text-primary hover:bg-primary-fixed rounded-lg transition-colors inline-flex"
            title="Editar"
          >
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={paginated}
        rowKey={(e) => e._id}
        loading={loading}
        total={employees.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={setSelectedEmployee}
        className="mb-8"
        empty={
          <p className="text-center text-on-surface-variant text-sm">
            Nenhum funcionário ativo encontrado.
          </p>
        }
        header={
          <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center">
            <h2 className="font-headline text-xl font-bold text-primary">Lista de Usuários</h2>
            <Link
              href="/admin/employees/new"
              className="bg-secondary text-white px-6 py-2 rounded-xl font-bold hover:bg-secondary/90 active:scale-95 transition-all flex items-center gap-2 text-sm"
            >
              <UserPlus className="size-4" />
              Novo Funcionário
            </Link>
          </div>
        }
      />

      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
