import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EnrollmentCycleEditModal } from './EnrollmentCycleEditModal';
import type { EnrollmentPeriod } from '@/types/enrollmentPeriod';

function makePeriod(overrides: Partial<EnrollmentPeriod> = {}): EnrollmentPeriod {
  return {
    _id: 'p1',
    startDate: '2030-12-01T03:00:00.000Z',
    endDate: '2031-01-01T02:59:59.999Z',
    cycleStartDate: '2030-12-01T03:00:00.000Z',
    resetScheduledFor: '2031-06-01T03:00:00.000Z',
    status: 'active',
    totalSlots: 350,
    filledSlots: 10,
    licenseValidityMonths: 6,
    active: true,
    createdByAdminId: 'a1',
    closedByAdminId: null,
    closedAt: null,
    eligibilityScope: 'all',
    eligibleUniversities: null,
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

describe('EnrollmentCycleEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the cycle edit title', () => {
    render(<EnrollmentCycleEditModal {...baseProps} />);
    expect(screen.getByText('Editar ciclo')).toBeInTheDocument();
  });

  it('pre-fills the current license validity', () => {
    render(<EnrollmentCycleEditModal {...baseProps} />);
    expect(screen.getByLabelText(/validade da carteirinha/i)).toHaveValue(6);
  });

  it('does not offer the window dates — those belong to the window', () => {
    render(<EnrollmentCycleEditModal {...baseProps} />);
    expect(screen.queryByLabelText(/data de início/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/data de fim/i)).not.toBeInTheDocument();
  });

  it('previews the license expiry anchored on the cycle start date', () => {
    render(<EnrollmentCycleEditModal {...baseProps} />);
    // 2030-12-01 + 6 meses
    expect(screen.getByText('01/06/2031')).toBeInTheDocument();
  });

  it('submits the new validity', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentCycleEditModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/validade da carteirinha/i), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toEqual({ licenseValidityMonths: 8 });
  });

  it('rejects a validity below one month', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentCycleEditModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/validade da carteirinha/i), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/maior ou igual a 1 mês/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks submit with a message when nothing changed', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentCycleEditModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/nenhuma alteração para salvar/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the server error', () => {
    render(<EnrollmentCycleEditModal {...baseProps} serverError="Falhou." />);
    expect(screen.getByText('Falhou.')).toBeInTheDocument();
  });
});
