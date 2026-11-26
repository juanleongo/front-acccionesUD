import { afterEach, expect, it, vi } from 'vitest';
import { browserHttp } from '@/lib/api/client';
import type { JsonRequest } from '@/lib/api';
import {
  estimateOrder,
  getInstrumentQuote,
  type OrderInput,
} from './trading-api';
afterEach(() => vi.useRealTimers());
const draft: OrderInput = {
  symbol: 'AAPL',
  side: 'buy',
  qty: '1',
  type: 'market',
  order_class: 'simple',
  time_in_force: 'day',
  schedule_if_closed: false,
};
it('cancela la estimación durante la pausa de escritura sin consultar ni enviar órdenes', async () => {
  vi.useFakeTimers();
  const request = vi.spyOn(browserHttp, 'request');
  const controller = new AbortController();
  const task = estimateOrder(draft, controller.signal);
  const rejected = expect(task).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort();
  await rejected;
  expect(request).not.toHaveBeenCalled();
});
it('rechaza una cotización de otro símbolo y propaga el AbortSignal', async () => {
  const signal = new AbortController().signal;
  const request = vi.spyOn(browserHttp, 'request').mockResolvedValue(undefined);
  await getInstrumentQuote('AAPL', signal);
  const options = request.mock.calls[0]?.[0] as unknown as JsonRequest<unknown>;
  expect(options.response).toBe('json');
  expect(() =>
    options.parse({
      symbol: 'MSFT',
      last_trade_price: '100',
      bid_price: null,
      ask_price: null,
      updated_at: null,
      as_of: null,
      currency: 'USD',
      source: 'Alpaca',
      is_delayed: false,
      is_stale: false,
    }),
  ).toThrow();
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({ path: '/api/v1/instruments/AAPL/quote', signal }),
  );
});
