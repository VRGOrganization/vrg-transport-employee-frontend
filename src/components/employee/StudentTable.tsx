"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Student } from "@/types/student";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import type { PageSize } from "@/lib/constants";

interface StudentTableProps {
  students: Student[];
  loading?: boolean;
  onDeleted: (id: string) => void;
}

export function StudentTable({ students, loading, onDeleted }: StudentTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  const handlePageSizeChange = (size: PageSize) => {
    setPageSize(size);
    setPage(1);
  };

  const handleDeleted = (id: string) => {
    onDeleted(id);
    const newTotalPages = Math.max(1, Math.ceil((students.length - 1) / pageSize));
    if (page > newTotalPages) setPage(newTotalPages);
  };

  const paginated = students.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Student>[] = [
    {
      key: "name",
      label: "Nome do Aluno",
      render: (student) => (
        <div className="flex items-center gap-4">
          <Avatar name={student.name} size="sm" />
          <span className="font-semibold text-on-surface">{student.name}</span>
        </div>
      ),
      skeleton: () => (
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-surface-container-high animate-pulse shrink-0" />
          <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse" />
        </div>
      ),
    },
    {
      key: "email",
      label: "E-mail",
      render: (student) => <span className="text-on-surface-variant">{student.email}</span>,
    },
    {
      key: "registrationNumber",
      label: "Matrícula",
      render: (student) => (
        <span className="text-on-surface-variant font-mono text-sm">
          {student.registrationNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      align: "right",
      render: (student) => (
        <div onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/employee/students/edit?id=${student._id}`)}
            className="p-2 text-primary hover:bg-primary-fixed rounded-lg transition-colors inline-flex"
            title="Editar"
          >
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
          <button
            onClick={() => handleDeleted(student._id)}
            className="p-2 text-error hover:bg-error-container rounded-lg transition-colors inline-flex ml-2"
            title="Desativar"
          >
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={paginated}
      rowKey={(s) => s._id}
      loading={loading}
      total={students.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={handlePageSizeChange}
      className="mb-8"
      empty={
        <p className="text-center text-on-surface-variant text-sm">
          Nenhum aluno ativo encontrado.
        </p>
      }
      header={
        <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center">
          <h2 className="font-headline text-xl font-bold text-primary">Lista de Alunos</h2>
          <Link
            href="/employee/students/new"
            className="bg-secondary text-white px-6 py-2 rounded-xl font-bold hover:bg-secondary/90 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Novo Aluno
          </Link>
        </div>
      }
    />
  );
}
