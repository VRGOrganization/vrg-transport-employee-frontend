import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock LinkUniversityModal to expose a simple UI that calls `onAdd` when clicked.
vi.mock('./LinkUniversityModal', () => {
  const React = require('react');
  return {
    default: ({ open, onClose, onAdd }: any) => {
      if (!open) return null;
      return (
        React.createElement('div', { 'data-testid': 'mock-link-modal' },
          React.createElement('button', { onClick: () => onAdd('u4', 'Faculdade Nova', 'F') }, 'Mock Add'),
          React.createElement('button', { onClick: () => onClose() }, 'Mock Close')
        )
      );
    },
  };
});

import { BusFormModal } from './BusFormModal';

describe('BusFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    // select shift (select has no associated for/id, use role)
    const select = screen.getByRole('combobox') as HTMLSelectElement;
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

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('Manhã');
  });

  it('adds and removes university slots via LinkUniversityModal flow', async () => {
    // We'll render and interact with the link button; actual modal fetch is tested separately
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    const linkBtn = screen.getByText(/vincular faculdade/i);
    expect(linkBtn).toBeInTheDocument();
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

  it('adds a university slot via mocked LinkUniversityModal', async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<BusFormModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    const linkBtn = screen.getByText(/vincular faculdade/i);
    fireEvent.click(linkBtn);

    // mock modal should render
    const addBtn = await screen.findByText('Mock Add');
    fireEvent.click(addBtn);

    // after adding, the UI should show the new university acronym (we mocked acronym 'F')
    const acronyms = await screen.findAllByText('F');
    expect(acronyms.length).toBeGreaterThanOrEqual(1);
  });
});
