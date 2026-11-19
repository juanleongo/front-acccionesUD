// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CandleSeries } from './CandleSeries';
const candles = Array.from({ length: 70 }, (_, index) => ({
  time: Date.UTC(2026, 10, 18, 14, index),
  open: 100,
  high: 110,
  low: 90,
  close: 100 + index / 10,
  price: 100 + index / 10,
}));
it('muestra OHLC reales y permite recorrer el histórico sin agrupar velas', () => {
  const { container } = render(
    <CandleSeries candles={candles} currency="USD" label="Velas AAPL" />,
  );
  expect(container.querySelectorAll('[data-candle]')).toHaveLength(60);
  expect(screen.getByText(/Apertura:/)).toHaveTextContent('Máximo: 110');
  fireEvent.click(screen.getByRole('button', { name: '← Velas anteriores' }));
  expect(container.querySelectorAll('[data-candle]')).toHaveLength(10);
  expect(screen.getByText(/Mostrando/)).toHaveTextContent('1–10 de 70');
  fireEvent.click(screen.getByRole('button', { name: 'Más recientes' }));
  fireEvent.change(screen.getByLabelText('Velas visibles'), {
    target: { value: '30' },
  });
  expect(container.querySelectorAll('[data-candle]')).toHaveLength(30);
  fireEvent.keyDown(screen.getByRole('group'), { key: 'ArrowLeft' });
  expect(screen.getByText(/Apertura:/)).toHaveTextContent('Cierre: 106,8');
});
it('representa una vela plana sin coordenadas inválidas', () => {
  const { container } = render(
    <CandleSeries
      candles={[{ time: 0, price: 1, open: 1, high: 1, low: 1, close: 1 }]}
      currency="USD"
      label="Vela plana"
    />,
  );
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  expect(container.querySelector('rect')).toHaveAttribute('height', '1');
});
