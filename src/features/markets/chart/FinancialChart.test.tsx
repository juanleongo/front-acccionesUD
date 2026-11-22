// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import type * as LightweightCharts from 'lightweight-charts';
const engine = vi.hoisted(() => {
  const data = vi.fn();
  const api = { applyOptions: vi.fn(), setData: data };
  const scale = {
    getVisibleLogicalRange: vi.fn(() => ({ from: -0.5, to: 1.5 })),
    setVisibleLogicalRange: vi.fn(),
    subscribeVisibleLogicalRangeChange: vi.fn(),
    unsubscribeVisibleLogicalRangeChange: vi.fn(),
    fitContent: vi.fn(),
  };
  const chart = {
    addSeries: vi.fn(() => api),
    removeSeries: vi.fn(),
    remove: vi.fn(),
    applyOptions: vi.fn(),
    timeScale: () => scale,
    priceScale: () => ({ applyOptions: vi.fn() }),
    subscribeCrosshairMove: vi.fn(),
    unsubscribeCrosshairMove: vi.fn(),
    setCrosshairPosition: vi.fn(),
  };
  return { chart, api, scale, create: vi.fn(() => chart) };
});
vi.mock('lightweight-charts', async (original) => ({
  ...(await original<typeof LightweightCharts>()),
  createChart: engine.create,
}));
import { FinancialChart } from './FinancialChart';
const points = [
  {
    time: Date.parse('2026-11-19T14:30:00Z'),
    price: 100,
    open: 99,
    high: 101,
    low: 98,
    close: 100,
  },
  {
    time: Date.parse('2026-11-19T14:31:00Z'),
    price: 101,
    open: 100,
    high: 102,
    low: 99,
    close: 101,
  },
];
it('keeps one chart and one active series across mode changes and cleans listeners on unmount', () => {
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
  expect(engine.create).toHaveBeenCalledTimes(1);
  expect(engine.api.setData.mock.calls[0]![0][0]).toMatchObject({
    open: 99,
    high: 101,
    low: 98,
    close: 100,
  });
  rerender(<FinancialChart {...props} mode="line" />);
  expect(engine.api.setData).toHaveBeenLastCalledWith(
    points.map((p) => ({ time: p.time / 1000, value: p.close })),
  );
  rerender(<FinancialChart {...props} mode="area" />);
  expect(engine.create).toHaveBeenCalledTimes(1);
  expect(engine.chart.removeSeries).toHaveBeenCalledTimes(2);
  fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowLeft' });
  expect(engine.chart.setCrosshairPosition).toHaveBeenCalled();
  unmount();
  expect(engine.chart.remove).toHaveBeenCalledOnce();
  expect(engine.chart.unsubscribeCrosshairMove).toHaveBeenCalledTimes(3);
  expect(
    engine.scale.unsubscribeVisibleLogicalRangeChange,
  ).toHaveBeenCalledTimes(3);
});
