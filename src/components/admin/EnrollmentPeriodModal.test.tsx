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

describe('EnrollmentPeriodModal (edição da janela aberta)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the window edit title and "Salvar alterações" as the submit label', () => {
    render(<EnrollmentPeriodModal {...baseProps} />);
    expect(screen.getByText('Editar janela de inscrição')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it('pre-fills the form with the window dates', () => {
    render(<EnrollmentPeriodModal {...baseProps} />);
    expect(screen.getByDisplayValue('2030-12-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2030-12-31')).toBeInTheDocument();
  });

  it('does not offer capacity nor license validity — those belong to the cycle', () => {
    render(<EnrollmentPeriodModal {...baseProps} />);

    expect(screen.queryByLabelText(/validade da carteirinha/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByText(/vagas-dia/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/capacidade/i)).not.toBeInTheDocument();
  });

  it('submits the changed window dates as ISO and nothing else', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de fim/i), {
      target: { value: '2030-12-20' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(Object.keys(payload)).toEqual(['endDate']);
    expect(toCivilBR(payload.endDate as string)).toBe('2030-12-20');
  });

  it('blocks submit with a message when nothing changed', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/nenhuma alteração para salvar/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an end date before the start date', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<EnrollmentPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de fim/i), {
      target: { value: '2030-11-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByText(/data de fim deve ser maior/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('escopo da janela (somente leitura)', () => {
    it('shows "Todos os alunos" for the all scope', () => {
      render(<EnrollmentPeriodModal {...baseProps} />);
      expect(screen.getByText('Todos os alunos')).toBeInTheDocument();
    });

    it('shows the has_university scope label', () => {
      render(
        <EnrollmentPeriodModal
          {...baseProps}
          period={makePeriod({ eligibilityScope: 'has_university' })}
        />,
      );
      expect(screen.getByText(/só alunos com faculdade cadastrada/i)).toBeInTheDocument();
    });

    it('lists the eligible universities for the specific scope', () => {
      render(
        <EnrollmentPeriodModal
          {...baseProps}
          period={makePeriod({
            eligibilityScope: 'specific_universities',
            eligibleUniversities: [
              { _id: 'u1', name: 'Universidade Federal Fluminense', acronym: 'UFF' },
              { _id: 'u2', name: 'Faculdade de Medicina de Campos', acronym: 'FMC' },
            ],
          })}
        />,
      );

      expect(screen.getByText(/faculdades específicas/i)).toBeInTheDocument();
      expect(screen.getByText(/UFF/)).toBeInTheDocument();
      expect(screen.getByText(/FMC/)).toBeInTheDocument();
    });

    it('explains that changing the scope requires reopening the window', () => {
      render(<EnrollmentPeriodModal {...baseProps} />);
      expect(screen.getByText(/feche esta janela e abra uma nova/i)).toBeInTheDocument();
    });
  });

  it('with no open window: shows an empty state and no submit', () => {
    render(
      <EnrollmentPeriodModal
        {...baseProps}
        period={makePeriod({ startDate: null, endDate: null })}
      />,
    );

    expect(screen.queryByLabelText(/data de início/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/data de fim/i)).not.toBeInTheDocument();
    expect(screen.getByText(/nenhuma janela aberta/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /salvar alterações/i }),
    ).not.toBeInTheDocument();
  });

  it('shows server error (e.g. no active window to update)', () => {
    const errorMsg = 'Não há janela de inscrição ativa para este ciclo.';
    render(<EnrollmentPeriodModal {...baseProps} serverError={errorMsg} />);
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });
});
