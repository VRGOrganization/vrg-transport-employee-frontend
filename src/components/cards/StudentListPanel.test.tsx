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
