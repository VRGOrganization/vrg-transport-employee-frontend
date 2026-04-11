"use client";

import { useState } from "react";
import Link from "next/link";

// Reutiliza o tipo Student já exportado pela página de dashboard
export interface Student {
  _id: string;
  name: string;
  email: string;
  registrationId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StudentTableProps {
  students: Student[];
  loading?: boolean;
  onDeleted: (id: string) => void;
}

const PAGE_SIZE = 5;

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarColors = [
  "bg-blue-100 text-primary",
  "bg-orange-100 text-secondary",
  "bg-teal-100 text-tertiary",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
];

export function StudentTable({
  students,
  loading,
  onDeleted,
}: StudentTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const paginated = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleted = (id: string) => {
    onDeleted(id);

    const newTotal = students.length - 1;
    const newPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
    if (page > newPages) setPage(newPages);
  };

  return (
    <>
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-8">
        {/* Header */}
        <div className="px-8 py-6 border-b border-surface-container-low flex justify-between items-center">
          <h2 className="font-headline text-xl font-bold text-primary">
            Lista de Alunos
          </h2>
          <Link
            href="/employee/students/new"
            className="bg-secondary text-white px-6 py-2 rounded-xl font-bold hover:bg-secondary/90 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Novo Aluno
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-8 py-4 text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Nome do Aluno
                </th>
                <th className="px-8 py-4 text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  E-mail
                </th>
                <th className="px-8 py-4 text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Matrícula
                </th>
                <th className="px-8 py-4 text-xs font-bold text-on-surface-variant tracking-wider uppercase text-right">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-container-low">
              {loading ? (
                /* Skeleton rows */
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse" />
                        <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="h-4 w-48 bg-surface-container-high rounded animate-pulse" />
                    </td>
                    <td className="px-8 py-5">
                      <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse" />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="h-8 w-20 bg-surface-container-high rounded animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-8 py-12 text-center text-on-surface-variant text-sm"
                  >
                    Nenhum aluno ativo encontrado.
                  </td>
                </tr>
              ) : (
                paginated.map((student, idx) => {
                  const colorClass = avatarColors[idx % avatarColors.length];
                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      {/* Nome */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center font-bold text-sm flex-shrink-0`}
                          >
                            {getInitials(student.name)}
                          </div>
                          <span className="font-semibold text-on-surface">
                            {student.name}
                          </span>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="px-8 py-5 text-on-surface-variant">
                        {student.email}
                      </td>

                      {/* Matrícula — coluna extra relevante para alunos */}
                      <td className="px-8 py-5 text-on-surface-variant font-mono text-sm">
                        {student.registrationId}
                      </td>

                      {/* Ações */}
                      <td
                        className="px-8 py-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => window.location.assign(`/employee/students/edit?id=${student._id}`)}
                          className="p-2 text-primary hover:bg-primary-fixed rounded-lg transition-colors inline-flex"
                          title="Editar"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "20px" }}
                          >
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleted(student._id)}
                          className="p-2 text-error hover:bg-error-container rounded-lg transition-colors inline-flex ml-2"
                          title="Desativar"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "20px" }}
                          >
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-4 bg-surface-container-lowest flex justify-between items-center text-sm font-medium text-on-surface-variant">
          <span>
            Exibindo {Math.min(paginated.length, PAGE_SIZE)} de{" "}
            {students.length} alunos
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "20px" }}
              >
                chevron_left
              </span>
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-sm font-bold ${
                  page === i + 1
                    ? "bg-primary text-white"
                    : "border border-outline-variant hover:bg-surface-container-low text-primary"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "20px" }}
              >
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </section>

    
    </>
  );
}