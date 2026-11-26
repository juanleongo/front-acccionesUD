// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
const engine = vi.hoisted(() => {
  const zr = { on: vi.fn(), off: vi.fn() };
  const chart = {
    isDisposed: () => false,
    getWidth: () => 1000,
    getHeight: () => 600,
    convertToPixel: (_: unknown, point: number[]) => point,
    setOption: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn(),
    dispatchAction: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getZr: () => zr,
    getOption: () => ({ dataZoom: [{ start: 0, end: 100 }] }),
  };
  return { chart, init: vi.fn(() => chart) };
});
vi.mock('./echarts-engine', () => ({ init: engine.init }));
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  },
);
import { FinancialChart } from './FinancialChart';
const points = Array.from({ length: 40 }, (_, i) => ({
  time: Date.UTC(2026, 10, 19, 14, 30 + i),
  price: 100 + i,
  open: 99 + i,
  high: 101 + i,
  low: 98 + i,
  close: 100 + i,
  volume: 1000 + i,
}));
it('keeps one ECharts canvas across modes and adds indicators without another historical request', async () => {
  const props = {
    points,
    timeframe: '1Min' as const,
    datasetKey: 'A:1D:1Min',
    label: 'Chart A',
    currency: 'USD',
  };
  const { rerender, unmount } = render(
    <FinancialChart {...props} mode="candles" />,
  );
  await waitFor(() => expect(engine.init).toHaveBeenCalledOnce());
  expect(
    engine.chart.setOption.mock.calls.at(-1)![0].series[0].data[0],
  ).toEqual([99, 100, 98, 101]);
  const tooltip = engine.chart.setOption.mock.calls
    .at(-1)![0]
    .tooltip.formatter([{ dataIndex: 0, seriesId: 'price' }]);
  expect(tooltip).toContain('Apertura');
  expect(tooltip).toContain('Volumen');
  expect(tooltip).not.toMatch(/1795|lowest|highest|open/);
  rerender(<FinancialChart {...props} mode="area" />);
  await waitFor(() =>
    expect(
      engine.chart.setOption.mock.calls.at(-1)![0].series[0],
    ).toMatchObject({ type: 'line', areaStyle: expect.any(Object) }),
  );
  fireEvent.change(screen.getByLabelText('Indicadores'), {
    target: { value: 'rsi' },
  });
  await waitFor(() =>
    expect(
      engine.chart.setOption.mock.calls
        .at(-1)![0]
        .series.some((s: { id: string }) => s.id === 'rsi'),
    ).toBe(true),
  );
  expect(engine.init).toHaveBeenCalledOnce();
  fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowLeft' });
  expect(engine.chart.dispatchAction).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'showTip' }),
  );
  unmount();
  expect(engine.chart.dispose).toHaveBeenCalledOnce();
});
