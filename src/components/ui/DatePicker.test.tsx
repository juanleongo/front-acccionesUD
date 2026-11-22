// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { DatePicker } from './DatePicker';

afterEach(() => setAppLocale('es'));

it('respeta el intervalo y entrega la fecha elegida sin desplazarla de día', () => {
  const change = vi.fn();
  render(
    <DatePicker
      label="Hasta"
      value="2026-11-21"
      min="2026-11-21"
      max="2026-11-27"
      onChange={change}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Elegir fecha: Hasta' }));
  expect(screen.getByRole('button', { name: '20/11/2026' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '28/11/2026' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '27/11/2026' }));
  expect(change).toHaveBeenCalledWith('2026-11-27');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('permite cerrar con Escape y devuelve el foco al control', () => {
  render(<DatePicker label="Desde" value="2026-11-21" onChange={vi.fn()} />);
  const trigger = screen.getByRole('button', { name: 'Elegir fecha: Desde' });
  fireEvent.click(trigger);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it('muestra el calendario y permite limpiar la fecha también en inglés', () => {
  setAppLocale('en');
  const change = vi.fn();
  render(<DatePicker label="From" value="2026-11-21" onChange={change} />);
  fireEvent.click(screen.getByRole('button', { name: 'Choose date: From' }));
  expect(screen.getByText('November 2026')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  expect(change).toHaveBeenCalledWith('');
});
