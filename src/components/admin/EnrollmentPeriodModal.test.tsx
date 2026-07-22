import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-day-picker', () => ({
  DayPicker: () => null,
}));

import { EnrollmentPeriodModal } from './EnrollmentPeriodModal';
import type { EnrollmentPeriod } from '@/types/enrollmentPeriod';

function makePeriod(overrides: Partial<EnrollmentPeriod> = {}): EnrollmentPeriod {
  return {
    _id: 'p1',
    startDate: '2030-12-01T00:00:00.000Z',
    endDate: '2030-12-31T23:59:59.999Z',
    cycleStartDate: '2030-12-01T00:00:00.000Z',
    totalSlots: 350,
    filledSlots: 10,
    licenseValidityMonths: 6,
    active: true,
    createdByAdminId: 'a1',
    closedByAdminId: null,
    closedAt: null,
    createdAt: '2030-11-01T00:00:00.000Z',
    updatedAt: '2030-11-01T00:00:00.000Z',
    ...overrides,
  };
}

const baseProps = {
  open: true,
  period: makePeriod(),
  loading: false,
  serverError: '',
  onClose: vi.fn(),
  onSubmit: vi.fn(() => Promise.resolve()),
};

describe('EnrollmentPeriodModal (edição da janela aberta)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the edit title and "Salvar alterações" as the submit label', () => {
    render(<EnrollmentPeriodModal {...baseProps} />);
    expect(screen.getByText('Editar período de inscrição')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it('pre-fills the form with the window dates and validity', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.startDate).toContain('2030-12-01');
    expect(payload.endDate).toContain('2030-12-31');
    expect(payload.licenseValidityMonths).toBe(6);
  });

  it('no slots input field — only one number input (licenseValidityMonths)', () => {
    render(<EnrollmentPeriodModal {...baseProps} />);
    const numberInputs = screen.queryAllByRole('spinbutton');
    expect(numberInputs).toHaveLength(1);
  });

  it('shows derived read-only capacity for the period', () => {
    render(<EnrollmentPeriodModal {...baseProps} period={makePeriod({ totalSlots: 350 })} />);
    expect(screen.getByText(/350 vagas-dia/)).toBeInTheDocument();
  });

  it('shows server error (e.g. no active window to update)', () => {
    const errorMsg = 'Não há janela de inscrição ativa para este ciclo.';
    render(<EnrollmentPeriodModal {...baseProps} serverError={errorMsg} />);
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });
});
