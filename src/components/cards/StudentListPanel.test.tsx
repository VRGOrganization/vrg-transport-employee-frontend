import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StudentListPanel } from './StudentListPanel';

const makeStudent = (id: string, name: string, institution = 'Inst') => ({ _id: id, name, email: `${id}@mail.com`, active: true, institution });
const makeRequest = (id: string, studentId: string, universityId: string, status: 'pending' | 'waitlisted', createdAt = new Date().toISOString()) => ({ _id: id, studentId, universityId, status, createdAt, filaPosition: undefined });

function renderPanel(props: any = {}) {
  const defaultProps = {
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
    onPrintBatch: () => {},
    largeItems: false,
    ...props,
  };

  return render(<StudentListPanel {...defaultProps} />);
}

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
    } as any;

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
    } as any;

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
    } as any;

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
    } as any;

    const r1 = makeRequest('r1', 's1', 'uni-1', 'waitlisted');
    const r2 = makeRequest('r2', 's2', 'uni-2', 'pending');

    renderPanel({ students: [s1, s2], licenseRequests: [r1, r2], pendingStudentIds: new Set(['s2']), waitlistedStudentIds: new Set(['s1']), bus });

    // switch filter to 'Na fila' (waitlisted)
    const btn = screen.getByText('Na fila');
    fireEvent.click(btn);

    expect(screen.queryByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Bob')).toBeNull();
  });
});
