import { expect, it, vi } from 'vitest';
vi.mock('@/lib/api/client', () => ({ browserHttp: { request: vi.fn() } }));
import { positionsSchema } from './portfolio-api';
const response = {
  positions: [
    {
      symbol: 'TEST',
      exchange: 'NASDAQ',
      sector: null,
      qty: '1.000000000',
      reserved_qty: '0E-9',
      price: '3.67',
      price_source: 'alpaca_position',
      average_cost: '3.67',
      market_value: '3.67',
      cost_basis: '3.67',
      unrealized_pnl: '0.00',
      reconciliation_mismatch: false,
    },
  ],
  totals: { market_value: '3.67', cost_basis: '3.67', unrealized_pnl: '0.00' },
  view_type: 'table',
  positions_as_of: '2026-11-20T00:00:00Z',
  currency: 'USD',
};
it('acepta la notación decimal exponencial emitida por el backend', () => {
  const data = positionsSchema.parse(response);
  expect(data.positions[0]?.reserved_qty).toBe('0E-9');
  expect(Number(data.positions[0]?.reserved_qty)).toBe(0);
});
it.each(['NaN', 'Infinity', '1e999', 'incorrecto'])(
  'rechaza valores inválidos: %s',
  (value) => {
    expect(
      positionsSchema.safeParse({
        ...response,
        totals: { ...response.totals, market_value: value },
      }).success,
    ).toBe(false);
  },
);
