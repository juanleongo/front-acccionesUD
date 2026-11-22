// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AssetSearchCombobox } from './AssetSearchCombobox';
const assets = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ' },
];
it('muestra opciones sin escribir y selecciona un activo del catálogo', () => {
  const onSearch = vi.fn(),
    onSelect = vi.fn();
  render(
    <AssetSearchCombobox
      search=""
      assets={assets}
      loading={false}
      error={false}
      onSearch={onSearch}
      onSelect={onSelect}
    />,
  );
  fireEvent.focus(screen.getByRole('combobox'));
  expect(
    screen.getByRole('listbox', { name: 'Acciones disponibles' }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole('option', { name: /AAPL.*Apple Inc/ }));
  expect(onSelect).toHaveBeenCalledWith('AAPL');
  expect(onSearch).toHaveBeenCalledWith('AAPL');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('combobox'));
  expect(screen.getByRole('listbox')).toBeVisible();
});
it('permite buscar y elegir usando el teclado', () => {
  const onSelect = vi.fn(),
    onSearch = vi.fn();
  render(
    <AssetSearchCombobox
      search=""
      assets={assets}
      loading={false}
      error={false}
      onSearch={onSearch}
      onSelect={onSelect}
    />,
  );
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: 'M' } });
  expect(onSearch).toHaveBeenCalledWith('M');
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(onSelect).toHaveBeenCalledWith('MSFT');
});
