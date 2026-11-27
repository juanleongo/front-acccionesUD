import { expect, it } from 'vitest';
import {
  budgetQuantity,
  withinBudget,
  isOrderWithinBudget,
  automaticBudgetPrice,
} from './order-budget';
it('obtiene automáticamente un precio válido desde la referencia del servidor', () => {
  expect(automaticBudgetPrice('355.14')).toBe('355.14');
  expect(automaticBudgetPrice('355.141')).toBe('355.15');
  expect(automaticBudgetPrice('0.99999')).toBe('1.00');
  expect(automaticBudgetPrice('0.12341')).toBe('0.1235');
  for (const value of ['', '0', '-1', 'NaN', 'Infinity'])
    expect(automaticBudgetPrice(value)).toBeNull();
});
import type { OrderInput, Preview } from './trading-api';

it('incluye la comisión en 100 USD y redondea la fracción hacia abajo a 9 decimales', () => {
  const quantity = budgetQuantity('100', '152.73', true);
  expect(quantity).toBe('0.654750212');
  expect(Number(quantity) * 152.73).toBeLessThanOrEqual(100);
  expect(withinBudget('100.00', '100')).toBe(true);
  expect(withinBudget('100.01', '100')).toBe(false);
});
it('dedica los 100 USD a acciones cuando la comisión se suma aparte', () => {
  expect(budgetQuantity('100', '100', true)).toBe('1');
  const draft: OrderInput = {
    symbol: 'NVDA',
    side: 'buy',
    qty: '1',
    type: 'limit',
    order_class: 'simple',
    time_in_force: 'day',
    limit_price: '100',
    schedule_if_closed: false,
  };
  const preview = {
    reference_price: '100',
    estimated_amount: '102',
    reference_commission: '2',
  } as Preview;
  expect(
    isOrderWithinBudget(draft, preview, { amount: '100', mode: 'shares' }),
  ).toBe(true);
  expect(
    isOrderWithinBudget(draft, preview, { amount: '100', mode: 'total' }),
  ).toBe(false);
  expect(
    isOrderWithinBudget({ ...draft, qty: '1.000000001' }, preview, {
      amount: '100',
      mode: 'shares',
    }),
  ).toBe(false);
  expect(withinBudget('99.9999999999999', '100')).toBe(true);
  expect(withinBudget('100.0000000000001', '100')).toBe(false);
});
it('respeta instrumentos enteros y rechaza importes inválidos o insuficientes', () => {
  expect(budgetQuantity('100', '152.73', false)).toBeNull();
  expect(budgetQuantity('100', '30', false)).toBe('3');
  expect(budgetQuantity('100', '10', true)).toBe('10');
  for (const input of ['0', '-1', 'NaN', 'Infinity', '', '1e6'])
    expect(budgetQuantity(input, '10', true)).toBeNull();
  expect(withinBudget('NaN', '100')).toBe(false);
});
it('refina acciones de precio bajo usando el total de un lote, sin multiplicar el redondeo de una acción', () => {
  expect(budgetQuantity('100', '0.01', true)).toBe('10000');
  expect(budgetQuantity('100', '1.02', true, '10000')).toBe('980392.156862745');
  expect(budgetQuantity('100', '90.01', false, '3')).toBe('3');
});
