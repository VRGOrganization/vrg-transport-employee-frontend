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
  period: null as EnrollmentPeriod | null,
  loading: false,
  serverError: '',
  onClose: vi.fn(),
  onSubmit: vi.fn(() => Promise.resolve()),
};

describe('EnrollmentPeriodModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create submit sends payload without totalSlots', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(
      <EnrollmentPeriodModal
        {...baseProps}
        onSubmit={onSubmit}
        period={null}
      />
    );

    const dateInputs = screen.getAllByPlaceholderText('dd/mm/aaaa');
    fireEvent.change(dateInputs[0], { target: { value: '01/12/2030' } });
    await waitFor(() => expect(dateInputs[1]).not.toBeDisabled());
    fireEvent.change(dateInputs[1], { target: { value: '31/12/2030' } });

    fireEvent.click(screen.getByRole('button', { name: /abrir período/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    const payload = onSubmit.mock.calls[0][0];
    expect('totalSlots' in payload).toBe(false);
    expect(payload.startDate).toContain('2030-12-01');
    expect(payload.endDate).toContain('2030-12-31');
    expect(typeof payload.licenseValidityMonths).toBe('number');
  });

  it('no slots input field — only one number input (licenseValidityMonths)', () => {
    render(<EnrollmentPeriodModal {...baseProps} period={null} />);

    const numberInputs = screen.queryAllByRole('spinbutton');
    expect(numberInputs).toHaveLength(1);
  });

  it('no slot-related validation message on submit without vagas', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentPeriodModal {...baseProps} onSubmit={onSubmit} period={null} />);

    const dateInputs = screen.getAllByPlaceholderText('dd/mm/aaaa');
    fireEvent.change(dateInputs[0], { target: { value: '01/12/2030' } });
    await waitFor(() => expect(dateInputs[1]).not.toBeDisabled());
    fireEvent.change(dateInputs[1], { target: { value: '31/12/2030' } });

    fireEvent.click(screen.getByRole('button', { name: /abrir período/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.queryByText(/quantidade de vagas/i)).not.toBeInTheDocument();
  });

  it('shows "sem ônibus" backend error as general error in modal', () => {
    const errorMsg = 'Não há ônibus com vagas para abrir um período de inscrição.';
    render(
      <EnrollmentPeriodModal
        {...baseProps}
        serverError={errorMsg}
      />
    );
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });

  it('shows derived read-only capacity when period has totalSlots', () => {
    const period = makePeriod({ totalSlots: 350 });
    render(<EnrollmentPeriodModal {...baseProps} period={period} />);
    expect(screen.getByText(/350 vagas-dia/)).toBeInTheDocument();
  });

  it('create mode shows "calculado automaticamente" placeholder for capacity', () => {
    render(<EnrollmentPeriodModal {...baseProps} period={null} />);
    expect(screen.getByText(/calculado automaticamente/i)).toBeInTheDocument();
  });
});
