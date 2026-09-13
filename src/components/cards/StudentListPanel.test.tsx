import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StudentListPanel } from './StudentListPanel';
import type { LicenseRequestRecord, StudentRecord } from '@/types/cards.types';
import type { Bus } from '@/types/university.types';

type StudentListPanelProps = React.ComponentProps<typeof StudentListPanel>;

const makeStudent = (id: string, name: string, institution = 'Inst'): StudentRecord => ({ _id: id, name, email: `${id}@mail.com`, active: true, institution });
const makeRequest = (
  id: string,
  studentId: string,
  universityId: string,
  status: 'pending' | 'waitlisted' | 'approved' | 'rejected' | 'cancelled',
  createdAt = new Date().toISOString(),
): LicenseRequestRecord => ({
  _id: id,
  studentId,
  universityId,
  status,
  createdAt,
  filaPosition: undefined,
  type: 'initial',
  changedDocuments: [],
  rejectionReason: null,
  rejectedAt: null,
  licenseId: null,
});

function renderPanel(props: Partial<StudentListPanelProps> = {}) {
  const defaultProps: StudentListPanelProps = {
    students: [],
    licenseRequests: [],
    licensedStudentIds: new Set<string>(),
    pendingStudentIds: new Set<string>(),
    waitlistedStudentIds: new Set<string>(),
    selectedStudent: null,
    selectedForBatch: [],
    printingBatch: false,
    loading: false,
    error: '',
    printableCardsByStudentId: new Map(),
    onSelectStudent: () => {},
    onToggleBatch: () => {},
    onSetBatch: () => {},
    onPrintBatch: () => {},
    largeItems: false,
  };

  return render(<StudentListPanel {...defaultProps} {...props} />);
}

describe('StudentListPanel — busca por nome social e nome civil', () => {
  it('encontra aluno digitando o nome social, mesmo aluno some ao filtrar por nome civil de outro aluno', () => {
    const s1: StudentRecord = { ...makeStudent('s1', 'João Silva'), socialName: 'Joana Silva' };
    const s2 = makeStudent('s2', 'Bob');

    renderPanel({
      students: [s1, s2],
      licensedStudentIds: new Set(['s1', 's2']),
      filter: 'with-card',
    });

    fireEvent.change(screen.getByPlaceholderText('Buscar por nome, e-mail ou instituição'), {
      target: { value: 'Joana' },
    });

    expect(screen.queryByText('Joana Silva')).toBeTruthy();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('também encontra o mesmo aluno buscando pelo nome civil', () => {
    const s1: StudentRecord = { ...makeStudent('s1', 'João Silva'), socialName: 'Joana Silva' };
    const s2 = makeStudent('s2', 'Bob');

    renderPanel({
      students: [s1, s2],
      licensedStudentIds: new Set(['s1', 's2']),
      filter: 'with-card',
    });

    fireEvent.change(screen.getByPlaceholderText('Buscar por nome, e-mail ou instituição'), {
      target: { value: 'João Silva' },
    });

    expect(screen.queryByText('Joana Silva')).toBeTruthy();
    expect(screen.queryByText('Bob')).toBeNull();
  });
});

describe('StudentListPanel — prioridade dinâmica', () => {
  it('mostra só P1 quando P1 tem pendentes (filtro=pending)', () => {
    const s1 = makeStudent('s1', 'Alice');
    const s2 = makeStudent('s2', 'Bob');

    const bus = {
      _id: 'b1',
      universitySlots: [
        { universityId: 'uni-1', priorityOrder: 1 },
        { universityId: 'uni-2', priorityOrder: 2 },
      ],
    } as Bus;

    const r1 = makeRequest('r1', 's1', 'uni-1', 'pending');
    const r2 = makeRequest('r2', 's2', 'uni-2', 'pending');

    renderPanel({ students: [s1, s2], licenseRequests: [r1, r2], pendingStudentIds: new Set(['s1','s2']), waitlistedStudentIds: new Set(), bus });

    expect(screen.queryByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('mostra lista VAZIA quando P1 tem só waitlisted e filtro é pending (não cair para P2)', () => {
    const s1 = makeStudent('s1', 'Alice');
    const s2 = makeStudent('s2', 'Bob');

    const bus = {
      _id: 'b1',
      universitySlots: [
        { universityId: 'uni-1', priorityOrder: 1 },
        { universityId: 'uni-2', priorityOrder: 2 },
      ],
    } as Bus;

    const r1 = makeRequest('r1', 's1', 'uni-1', 'waitlisted');
    const r2 = makeRequest('r2', 's2', 'uni-2', 'pending');

    renderPanel({ students: [s1, s2], licenseRequests: [r1, r2], pendingStudentIds: new Set(['s2']), waitlistedStudentIds: new Set(['s1']), bus });

    expect(screen.queryByText('Nenhuma solicitação pendente encontrada.')).toBeTruthy();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('mostra P2 quando P1 não tem nenhuma demanda ativa', () => {
    const s1 = makeStudent('s1', 'Alice');
    const s2 = makeStudent('s2', 'Bob');

    const bus = {
      _id: 'b1',
      universitySlots: [
        { universityId: 'uni-1', priorityOrder: 1 },
        { universityId: 'uni-2', priorityOrder: 2 },
      ],
    } as Bus;

    const r2 = makeRequest('r2', 's2', 'uni-2', 'pending');

    renderPanel({ students: [s1, s2], licenseRequests: [r2], pendingStudentIds: new Set(['s2']), waitlistedStudentIds: new Set(), bus });

    expect(screen.queryByText('Bob')).toBeTruthy();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('no filter pending, when P1 has only waitlisted and filter switched to waitlisted shows P1', () => {
    const s1 = makeStudent('s1', 'Alice');
    const s2 = makeStudent('s2', 'Bob');

    const bus = {
      _id: 'b1',
      universitySlots: [
        { universityId: 'uni-1', priorityOrder: 1 },
        { universityId: 'uni-2', priorityOrder: 2 },
      ],
    } as Bus;

    const r1 = makeRequest('r1', 's1', 'uni-1', 'waitlisted');
    const r2 = makeRequest('r2', 's2', 'uni-2', 'pending');

    renderPanel({ students: [s1, s2], licenseRequests: [r1, r2], pendingStudentIds: new Set(['s2']), waitlistedStudentIds: new Set(['s1']), bus });

    const btn = screen.getByText('Em Espera');
    fireEvent.click(btn);

    expect(screen.queryByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('na revisão, lista apenas solicitações update pendentes', () => {
    const updatePending = makeStudent('s1', 'Update Pendente');
    const initialPending = makeStudent('s2', 'Inicial Pendente');
    const updateApproved = makeStudent('s3', 'Update Aprovado');

    const r1 = {
      ...makeRequest('r1', 's1', 'uni-1', 'pending'),
      type: 'update',
    } as LicenseRequestRecord;
    const r2 = makeRequest('r2', 's2', 'uni-1', 'pending');
    const r3 = {
      ...makeRequest('r3', 's3', 'uni-1', 'approved'),
      type: 'update',
    } as LicenseRequestRecord;

    renderPanel({
      students: [updatePending, initialPending, updateApproved],
      licenseRequests: [r1, r2, r3],
      pendingStudentIds: new Set(['s1', 's2']),
      filter: 'review',
      showReview: true,
    });

    expect(screen.getByText('Update Pendente')).toBeInTheDocument();
    expect(screen.queryByText('Inicial Pendente')).toBeNull();
    expect(screen.queryByText('Update Aprovado')).toBeNull();
  });
});

describe('StudentListPanel — ordem FIFO da fila', () => {
  // O backend devolve os pedidos por createdAt DESC e `GET /student` não tem
  // ordenação garantida: sem ordenação no cliente a fila aparecia invertida
  // (criava-se A e depois B, e a lista mostrava B | A).
  const alunoA = makeStudent('s-a', 'Aluno A');
  const alunoB = makeStudent('s-b', 'Aluno B');
  const pedidoA = makeRequest('r-a', 's-a', 'uni-1', 'pending', '2026-08-21T10:00:00Z');
  const pedidoB = makeRequest('r-b', 's-b', 'uni-1', 'pending', '2026-08-21T10:05:00Z');

  const nomesNaTela = () =>
    screen
      .getAllByText(/^Aluno [AB]$/)
      .map((el) => el.textContent);

  it('mostra o primeiro a entrar no topo (A criado antes de B)', () => {
    renderPanel({
      // ordem "ruim" vinda de GET /student e pedidos em createdAt DESC
      students: [alunoB, alunoA],
      licenseRequests: [pedidoB, pedidoA],
      pendingStudentIds: new Set(['s-a', 's-b']),
      filter: 'pending',
    });

    expect(nomesNaTela()).toEqual(['Aluno A', 'Aluno B']);
  });

  it('mantém a ordem FIFO independentemente da ordem de entrada', () => {
    renderPanel({
      students: [alunoA, alunoB],
      licenseRequests: [pedidoA, pedidoB],
      pendingStudentIds: new Set(['s-a', 's-b']),
      filter: 'pending',
    });

    expect(nomesNaTela()).toEqual(['Aluno A', 'Aluno B']);
  });

  it('prioridade vence o FIFO: pedido mais novo com prioridade maior sobe', () => {
    const pedidoBPrioritario = {
      ...pedidoB,
      priorityLevel: 1,
    } as LicenseRequestRecord;

    renderPanel({
      students: [alunoA, alunoB],
      licenseRequests: [pedidoA, pedidoBPrioritario],
      pendingStudentIds: new Set(['s-a', 's-b']),
      filter: 'pending',
    });

    expect(nomesNaTela()).toEqual(['Aluno B', 'Aluno A']);
  });

  it('aba de aprovados também respeita a ordem da fila', () => {
    renderPanel({
      students: [alunoB, alunoA],
      licenseRequests: [pedidoB, pedidoA],
      licensedStudentIds: new Set(['s-a', 's-b']),
      filter: 'with-card',
    });

    expect(nomesNaTela()).toEqual(['Aluno A', 'Aluno B']);
  });

  it('lista de espera respeita filaPosition antes do FIFO', () => {
    const esperaA = {
      ...makeRequest('w-a', 's-a', 'uni-1', 'waitlisted', '2026-08-21T10:00:00Z'),
      filaPosition: 2,
    } as LicenseRequestRecord;
    const esperaB = {
      ...makeRequest('w-b', 's-b', 'uni-1', 'waitlisted', '2026-08-21T10:05:00Z'),
      filaPosition: 1,
    } as LicenseRequestRecord;

    renderPanel({
      students: [alunoA, alunoB],
      licenseRequests: [esperaA, esperaB],
      waitlistedStudentIds: new Set(['s-a', 's-b']),
      filter: 'waitlisted',
    });

    expect(nomesNaTela()).toEqual(['Aluno B', 'Aluno A']);
  });
});
