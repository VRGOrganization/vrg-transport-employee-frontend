import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EnrollmentPeriodModal } from './EnrollmentPeriodModal';
import type { EnrollmentPeriod } from '@/types/enrollmentPeriod';
import { toCivilBR } from '@/lib/utils/date';

function makePeriod(overrides: Partial<EnrollmentPeriod> = {}): EnrollmentPeriod {
  return {
    _id: 'p1',
    // Instantes na convenção do app: início = meia-noite de Brasília,
    // fim = último milissegundo do dia em Brasília (já no dia seguinte em UTC).
    startDate: '2030-12-01T03:00:00.000Z',
    endDate: '2031-01-01T02:59:59.999Z',
    cycleStartDate: '2030-12-01T03:00:00.000Z',
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

  it('pre-fills the form with the window dates and validity', () => {
    render(<EnrollmentPeriodModal {...baseProps} />);
    expect(screen.getByDisplayValue('2030-12-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2030-12-31')).toBeInTheDocument();
    expect(screen.getByDisplayValue('6')).toBeInTheDocument();
  });

  it('submits only the changed fields (validity only when dates untouched)', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/validade da carteirinha/i), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toEqual({ licenseValidityMonths: 8 });
    expect('startDate' in payload).toBe(false);
    expect('endDate' in payload).toBe(false);
  });

  it('submits the changed window dates as ISO', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de fim/i), {
      target: { value: '2030-12-20' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(toCivilBR(payload.endDate as string)).toBe('2030-12-20');
    expect('startDate' in payload).toBe(false);
    expect('licenseValidityMonths' in payload).toBe(false);
  });

  it('blocks submit with a message when nothing changed', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/nenhuma alteração para salvar/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('with no open window: hides window date fields, still edits validity', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(
      <EnrollmentPeriodModal
        {...baseProps}
        period={makePeriod({ startDate: null, endDate: null })}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByLabelText(/data de início/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/data de fim/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nenhuma janela aberta/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/validade da carteirinha/i), {
      target: { value: '9' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toEqual({ licenseValidityMonths: 9 });
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
