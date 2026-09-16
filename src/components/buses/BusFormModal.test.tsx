import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listMock = vi.fn();

vi.mock('@/lib/universityApi', () => ({
  universityApi: { list: (...args: unknown[]) => listMock(...args) },
}));

import { BusFormModal } from './BusFormModal';

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

  it('renders empty form when creating and allows submitting with capacity empty (no limit)', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    // Identifier input
    const identifier = screen.getByPlaceholderText('Ex: 01');
    fireEvent.change(identifier, { target: { value: '01' } });

    // Capacity left empty
    const submit = screen.getByRole('button', { name: /cadastrar/i });
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    const calledWith = onSubmit.mock.calls[0][0];
    expect(calledWith.identifier).toBe('01');
    expect('capacity' in calledWith).toBe(true);
    expect(calledWith.capacity).toBeNull();
    // shift should not be present when not selected
    expect(calledWith.shift).toBeUndefined();
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

    const identifier = screen.getByPlaceholderText('Ex: 01');
    fireEvent.change(identifier, { target: { value: '1' } });

    const submit = screen.getByRole('button', { name: /cadastrar/i });
    fireEvent.click(submit);

    await screen.findByText('O identificador deve conter exatamente 2 dígitos numéricos (ex: 01, 02).');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits with selected shift', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    // fill identifier
    const identifier = screen.getByPlaceholderText('Ex: 01');
    fireEvent.change(identifier, { target: { value: '02' } });

    // select shift — the only native <select> on the form (the university
    // field is an input[role=combobox], not a <select>)
    const select = document.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Manhã' } });

    const submit = screen.getByRole('button', { name: /cadastrar/i });
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.shift).toBe('Manhã');
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
