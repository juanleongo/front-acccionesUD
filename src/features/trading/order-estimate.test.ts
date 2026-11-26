import { expect, it } from 'vitest';
import {
  estimateInput,
  multiplyOrderValues,
  orderBasePrice,
} from './order-estimate';
import { getOrderTypeHelp } from './order-type-help';
import type { OrderInput } from './trading-api';
const draft: OrderInput = {
  symbol: 'AAPL',
  side: 'buy',
  qty: '2',
  type: 'market',
  order_class: 'simple',
  time_in_force: 'day',
  schedule_if_closed: false,
};

it('multiplica cantidades fraccionarias y precios sin redondeos binarios', () => {
  expect(multiplyOrderValues('0.1', '0.2')).toBe('0.02');
  expect(multiplyOrderValues('0.000000001', '123.4567')).toBe(
    '0.0000001234567',
  );
  expect(multiplyOrderValues('9007199254740993', '2')).toBe(
    '18014398509481986',
  );
  expect(multiplyOrderValues('', '100')).toBeNull();
});
it('usa el límite o stop para el cálculo sin confundirlos con la cotización', () => {
  expect(
    orderBasePrice({ ...draft, type: 'limit', limit_price: '95' }, '100'),
  ).toBe('95');
  expect(
    orderBasePrice(
      { ...draft, type: 'stop_limit', limit_price: '94', stop_price: '95' },
      '100',
    ),
  ).toBe('94');
  expect(
    orderBasePrice({ ...draft, type: 'stop', stop_price: '98' }, '100'),
  ).toBe('98');
  expect(orderBasePrice(draft, '100')).toBe('100');
});
it('nunca incluye confirmación, autorizaciones ni códigos MFA en las consultas automáticas', () => {
  expect(
    estimateInput({
      ...draft,
      confirmed: true,
      high_amount_acknowledged: true,
      totp_code: '123456',
    }),
  ).toEqual(draft);
});
it('distingue el máximo de compra del mínimo de venta en ES y EN', () => {
  expect(getOrderTypeHelp('limit', 'buy', 'es')).toContain('precio máximo');
  expect(getOrderTypeHelp('limit', 'sell', 'es')).toContain('precio mínimo');
  expect(getOrderTypeHelp('limit', 'buy', 'en')).toContain(
    'maximum price per share',
  );
  expect(getOrderTypeHelp('limit', 'sell', 'en')).toContain(
    'minimum price per share',
  );
});
