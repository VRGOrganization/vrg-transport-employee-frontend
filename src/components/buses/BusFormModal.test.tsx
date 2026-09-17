import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listMock = vi.fn();

vi.mock('@/lib/universityApi', () => ({
  universityApi: { list: (...args: unknown[]) => listMock(...args) },
}));

import { BusFormModal } from './BusFormModal';
import type { Bus } from '@/types/university.types';

function makeBus(overrides: Partial<Bus>): Bus {
  return { _id: 'bus', identifier: '01', active: true, createdAt: '', updatedAt: '', ...overrides };
}

const UNIVERSITIES = [
  { _id: 'u1', name: 'Universidade Alfa', acronym: 'UA', address: '', active: true, createdAt: '', updatedAt: '' },
  { _id: 'u2', name: 'Universidade Beta', acronym: 'UB', address: '', active: true, createdAt: '', updatedAt: '' },
  { _id: 'u3', name: 'Universidade Gama', acronym: 'UG', address: '', active: true, createdAt: '', updatedAt: '' },
  { _id: 'u4', name: 'Faculdade Nova', acronym: 'F', address: '', active: true, createdAt: '', updatedAt: '' },
];

const UNIVERSITIES = [
  { _id: 'u1', name: 'Universidade Alfa', acronym: 'UA', address: '', active: true, createdAt: '', updatedAt: '' },
  { _id: 'u2', name: 'Universidade Beta', acronym: 'UB', address: '', active: true, createdAt: '', updatedAt: '' },
  { _id: 'u3', name: 'Universidade Gama', acronym: 'UG', address: '', active: true, createdAt: '', updatedAt: '' },
  { _id: 'u4', name: 'Faculdade Nova', acronym: 'F', address: '', active: true, createdAt: '', updatedAt: '' },
];

describe('BusFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue(UNIVERSITIES);
  });

  function fillCreateForm({ identifier = '01', capacity = '48', shift = 'Manhã' } = {}) {
    fireEvent.change(screen.getByPlaceholderText('Ex: 01'), { target: { value: identifier } });
    fireEvent.change(screen.getByPlaceholderText('Ex: 48'), { target: { value: capacity } });
    // o único <select> nativo do form (a faculdade é um input[role=combobox])
    fireEvent.change(document.querySelector('select') as HTMLSelectElement, { target: { value: shift } });
  }

  it('cria ônibus enviando capacidade numérica e turno, nunca null', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    fillCreateForm({ identifier: '01', capacity: '48', shift: 'Noite' });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ identifier: '01', capacity: 48, shift: 'Noite' });
  });

  it('exige capacidade', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    fillCreateForm({ capacity: '' });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await screen.findByText('Informe a capacidade: um número inteiro de pelo menos 1 vaga.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('exige turno', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    fillCreateForm({ shift: '' });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await screen.findByText('Selecione o turno do ônibus: Manhã ou Noite.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('oferece só os turnos Manhã e Noite', () => {
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={vi.fn()} />);

    const options = Array.from(document.querySelectorAll('select option'))
      .map((o) => (o as HTMLOptionElement).value)
      .filter(Boolean);
    expect(options).toEqual(['Manhã', 'Noite']);
  });

  it('ônibus antigo com turno Tarde abre sem turno e obriga a escolher', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    const initial = makeBus({ _id: 'bus-old', identifier: '07', capacity: 40, shift: 'Tarde' });
    render(<BusFormModal open={true} initial={initial} onClose={() => {}} onSubmit={onSubmit} />);

    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await screen.findByText('Selecione o turno do ônibus: Manhã ou Noite.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('mostra no campo de capacidade a recusa do backend por capacidade abaixo da ocupação', async () => {
    const message =
      'A capacidade não pode ser menor que 40, a quantidade de alunos já alocados neste ônibus em um mesmo dia.';
    const onSubmit = vi.fn(() => Promise.reject({ status: 409, message }));
    const onClose = vi.fn();
    const initial = makeBus({ _id: 'bus-full', identifier: '08', capacity: 48, shift: 'Manhã' });
    render(<BusFormModal open={true} initial={initial} onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Ex: 48'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    const fieldError = await screen.findByText(message);
    expect(fieldError.closest('div')?.querySelector('input')).toBe(screen.getByPlaceholderText('Ex: 48'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('não bloqueia localmente capacidade abaixo da ocupação calculada na tela (quem decide é o backend)', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    const initial = makeBus({ _id: 'bus-9', identifier: '09', capacity: 48, shift: 'Manhã', filledSlotsTotal: 40 });
    render(<BusFormModal open={true} initial={initial} onClose={() => {}} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Ex: 48'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].capacity).toBe(30);
  });

  it('strips non-digits and caps identifier input at 2 characters', () => {
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={vi.fn()} />);

    const identifier = screen.getByPlaceholderText('Ex: 01') as HTMLInputElement;
    fireEvent.change(identifier, { target: { value: 'a1b2c3' } });

    expect(identifier.value).toBe('12');
  });

  it('rejects an identifier that is not exactly 2 digits', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    fillCreateForm({ identifier: '1' });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await screen.findByText('O identificador deve conter exatamente 2 dígitos numéricos (ex: 01, 02).');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hydrates initial shift when editing', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    const initial = {
      _id: 'bus-shift-1',
      identifier: '03',
      capacity: 20,
      shift: 'Manhã',
    } as any;

    render(<BusFormModal open={true} initial={initial} onClose={() => {}} onSubmit={onSubmit} />);

    const select = document.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('Manhã');
  });

  it('validates identifier required', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    const submit = screen.getByRole('button', { name: /cadastrar/i });
    fireEvent.click(submit);

    await screen.findByText(/O identificador é obrigatório/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('removes a slot and reindexes priorities on submit', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());

    const initial = {
      _id: 'bus-1',
      identifier: '04',
      capacity: 40,
      shift: 'Manhã',
      universitySlots: [
        { universityId: 'u1', priorityOrder: 1 },
        { universityId: 'u2', priorityOrder: 2 },
        { universityId: 'u3', priorityOrder: 3 },
      ],
    } as any;

    render(<BusFormModal open={true} initial={initial} onClose={() => {}} onSubmit={onSubmit} />);

    // There should be three "Remover" buttons
    const removeButtons = screen.getAllByText(/Remover/i);
    expect(removeButtons).toHaveLength(3);

    // Remove the middle slot (u2)
    fireEvent.click(removeButtons[1]);

    // Submit (button text is 'Salvar' when editing)
    const submit = screen.getByRole('button', { name: /salvar/i });
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.universitySlots).toHaveLength(2);
    expect(payload.universitySlots[0]).toEqual({ universityId: 'u1', priorityOrder: 1 });
    expect(payload.universitySlots[1]).toEqual({ universityId: 'u3', priorityOrder: 2 });
  });

  it('preserves provided priorityOrder when submitting without removal', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());

    const initial = {
      _id: 'bus-2',
      identifier: '05',
      capacity: 30,
      shift: 'Noite',
      universitySlots: [
        { universityId: 'uA', priorityOrder: 3 },
        { universityId: 'uB', priorityOrder: 1 },
        { universityId: 'uC', priorityOrder: 2 },
      ],
    } as any;

    render(<BusFormModal open={true} initial={initial} onClose={() => {}} onSubmit={onSubmit} />);

    const submit = screen.getByRole('button', { name: /salvar/i });
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.universitySlots).toHaveLength(3);
    expect(payload.universitySlots.map((s: any) => s.priorityOrder)).toEqual([3, 1, 2]);
  });

  it('adds a university slot via the combobox popover (centered above the modal, never behind it)', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /vincular faculdade/i }));

    // The popover renders as its own dialog on top of the BusFormModal's
    // dialog — both coexist (no z-index collision), never stacked behind it.
    const dialogs = await screen.findAllByRole('dialog');
    expect(dialogs).toHaveLength(2);

    const option = await screen.findByRole('option', { name: /UA.*Universidade Alfa/i });
    fireEvent.click(option);

    // Popover closes after selection, leaving only the BusFormModal dialog.
    await waitFor(() => {
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });

    // The linked-slots list (in the form, behind the closed popover) now
    // shows the added university.
    expect(screen.getByText(/Prioridade P1/i)).toBeInTheDocument();
    expect(screen.getAllByText('UA').length).toBeGreaterThanOrEqual(1);

    // Selected university leaves the popover's candidate list once it
    // re-renders with the university already filtered out from `slots`.
    fireEvent.click(screen.getByRole('button', { name: /vincular faculdade/i }));
    await screen.findAllByRole('dialog');
    expect(screen.queryByRole('option', { name: /UA.*Universidade Alfa/i })).not.toBeInTheDocument();
  });

  it('filters the combobox list by search query', async () => {
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /vincular faculdade/i }));
    const combobox = await screen.findByPlaceholderText(/buscar por nome ou sigla/i);
    await screen.findByRole('option', { name: /UA.*Universidade Alfa/i });

    fireEvent.change(combobox, { target: { value: 'Beta' } });

    expect(screen.getByRole('option', { name: /UB.*Universidade Beta/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /UA.*Universidade Alfa/i })).not.toBeInTheDocument();
  });
});
