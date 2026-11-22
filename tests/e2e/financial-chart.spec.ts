import { test, expect, type Page } from '@playwright/test';

const scenarios = [
  { symbol: 'UP', count: 1100, base: 100, delta: 0.02 },
  { symbol: 'DOWN', count: 100, base: 100, delta: -0.2 },
  { symbol: 'DOJI', count: 60, base: 5, delta: 0 },
  { symbol: 'SMALL', count: 10, base: 0.00001, delta: 0.00000001 },
  { symbol: 'HIGH', count: 100, base: 100000, delta: 100 },
  { symbol: 'ONE', count: 1, base: 3.475, delta: 0 },
  { symbol: 'TWO', count: 2, base: 2, delta: 1 },
  { symbol: 'JUMP', count: 100, base: 1, delta: 0 },
];
async function fixture(page: Page) {
  const requests: URL[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let json: unknown = {};
    if (url.pathname === '/api/v1/markets')
      json = [{ code: 'NASDAQ', name: 'NASDAQ' }];
    else if (url.pathname.includes('instruments/search'))
      json = {
        total: 9,
        page_size: 8,
        results:
          url.searchParams.get('page') === '2'
            ? [{ symbol: 'BATCH', name: 'Second catalog page' }]
            : scenarios.map((s) => ({
                symbol: s.symbol,
                name: `Fixture ${s.symbol}`,
              })),
      };
    else if (url.pathname.endsWith('/candles')) {
      requests.push(url);
      const symbol = url.pathname.split('/').at(-2);
      const s =
        scenarios.find((item) => item.symbol === symbol) ?? scenarios[0]!;
      const step =
        url.searchParams.get('timeframe') === '1Day' ? 86400000 : 60000;
      json = {
        currency: 'USD',
        source: 'alpaca',
        is_delayed: false,
        next_page_token: null,
        bars: Array.from({ length: s.count }, (_, i) => {
          const value = Number(
            (
              s.base +
              i * s.delta +
              (s.symbol === 'UP' ? Math.sin(i / 4) * 0.4 : 0) +
              (s.symbol === 'JUMP' && i > 50 ? 50 : 0)
            ).toFixed(s.base < 1 ? 8 : 2),
          );
          const close = Number(
            (
              value + (s.delta === 0 ? 0 : Math.cos(i) * Math.abs(s.delta) * 6)
            ).toFixed(s.base < 1 ? 8 : 2),
          );
          const wiggle = s.delta === 0 ? 0 : Math.abs(s.delta) * 2;
          return {
            timestamp: new Date(
              Date.UTC(2026, 10, 19, 15) - (s.count - i) * step,
            ).toISOString(),
            open: value,
            high: Number((Math.max(value, close) + wiggle).toFixed(8)),
            low: Number((Math.min(value, close) - wiggle).toFixed(8)),
            close,
            volume: 100 + i,
          };
        }),
      };
    } else if (url.pathname.includes('/calendar'))
      json = { time_zone: 'America/New_York', days: [] };
    else if (url.pathname.includes('/clock'))
      json = {
        is_open: true,
        timestamp: '2026-11-19T15:00:00Z',
        next_open: '2026-11-20T14:30:00Z',
        next_close: '2026-11-19T21:00:00Z',
        time_zone: 'America/New_York',
      };
    else {
      await route.fulfill({ status: 503, json: {} });
      return;
    }
    await route.fulfill({ json });
  });
  return { requests, errors };
}

test('native chart preserves its canvas, data and viewport across modes; zoom, pan, reset and catalog pagination work', async ({
  page,
}) => {
  const { requests, errors } = await fixture(page);
  await page.goto('/markets');
  const root = page.locator('[data-chart-mode]');
  await expect(root.locator('canvas').first()).toBeVisible();
  await expect(root).toContainText('1041–1100 de 1100');
  const canvas = await root.locator('canvas').first().elementHandle();
  const initial = requests.length;
  for (const mode of ['line', 'area', 'candles']) {
    await page.locator('#price-chart-type').selectOption(mode);
    await expect(root).toHaveAttribute('data-chart-mode', mode);
    expect(await canvas!.evaluate((el) => el.isConnected)).toBe(true);
    await expect(root).toContainText('1041–1100 de 1100');
  }
  expect(requests).toHaveLength(initial);
  await page
    .getByRole('button', { name: '← Velas anteriores', exact: true })
    .click();
  await expect(root).toContainText('981–1040 de 1100');
  await page
    .getByRole('button', { name: 'Más recientes', exact: true })
    .click();
  await page.locator('#candle-visible-size').selectOption('100');
  await expect(root).toContainText('1001–1100 de 1100');
  const graph = page.getByRole('img', { name: 'Histórico de UP' });
  await graph.scrollIntoViewIfNeeded();
  const box = (await graph.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByLabel('Lectura del gráfico')).toContainText('Cierre');
  await page.mouse.wheel(0, -300);
  await expect(root).not.toContainText('1001–1100 de 1100');
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 130, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await page
    .getByRole('button', { name: 'Restablecer vista', exact: true })
    .click();
  await expect(root).toContainText('1041–1100 de 1100');
  await page
    .getByRole('button', { name: 'Ajustar al contenido', exact: true })
    .click();
  await expect(root).toContainText('1–1100 de 1100');
  for (const period of ['1D', '1M', '6M', 'MAX']) {
    await page.getByRole('button', { name: period, exact: true }).click();
    await expect(root.locator('canvas').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: period, exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
  expect(
    requests.some(
      (url) => url.searchParams.get('start') === '1970-01-01T00:00:00.000Z',
    ),
  ).toBe(true);
  await page.locator('#price-candle-frame').selectOption('1Min');
  await expect
    .poll(() => requests.at(-1)?.searchParams.get('timeframe'))
    .toBe('1Min');
  await page.locator('#price-instrument-select').selectOption('JUMP');
  await expect(
    page.getByRole('img', { name: 'Histórico de JUMP' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Siguiente instrumento', exact: true })
    .click();
  await expect(page.locator('#price-instrument-select')).toHaveValue('BATCH');
  await expect(
    page.getByRole('img', { name: 'Histórico de BATCH' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('renders sparse, constant, doji, small and large prices in all modes and responsive themes', async ({
  page,
}) => {
  const { errors } = await fixture(page);
  await page.goto('/markets');
  const root = page.locator('[data-chart-mode]');
  for (const scenario of scenarios) {
    await page
      .locator('#price-instrument-select')
      .selectOption(scenario.symbol);
    await expect(
      page.getByRole('img', { name: `Histórico de ${scenario.symbol}` }),
    ).toBeVisible();
    for (const mode of ['candles', 'line', 'area']) {
      await page.locator('#price-chart-type').selectOption(mode);
      await expect(root.locator('canvas').first()).toBeVisible();
      await expect(root).not.toContainText(/NaN|Infinity|contradictorios/);
    }
  }
  await page.locator('#price-instrument-select').selectOption('DOWN');
  await expect(
    page.getByRole('img', { name: 'Histórico de DOWN' }),
  ).toBeVisible();
  for (const theme of ['light', 'dark'])
    for (const width of [320, 390, 1440, 2560]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      await page.setViewportSize({ width, height: 1000 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await expect(root.locator('canvas').first()).toBeVisible();
      if (width === 1440)
        await root.screenshot({
          path: `test-results/financial-area-${theme}.png`,
        });
    }
  await page.locator('#price-chart-type').selectOption('candles');
  await page.locator('#price-instrument-select').selectOption('UP');
  await expect(
    page.getByRole('img', { name: 'Histórico de UP' }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page
    .getByRole('button', { name: 'Restablecer vista', exact: true })
    .click();
  await expect(root).toContainText('1041–1100 de 1100');
  await root.screenshot({ path: 'test-results/financial-candles-dark.png' });
  expect(errors).toEqual([]);
});

test('keeps the English controls and mobile chart accessible', async ({
  page,
}) => {
  const { errors } = await fixture(page);
  await page.addInitScript(() => {
    localStorage.setItem('acciones_ud_locale', 'en');
    localStorage.setItem('acciones_ud_theme', 'light');
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/markets');
  await expect(
    page.getByRole('img', { name: 'Price history for UP' }),
  ).toBeVisible();
  await page.getByLabel('Chart type').selectOption('area');
  await expect(page.locator('[data-chart-mode]')).toHaveAttribute(
    'data-chart-mode',
    'area',
  );
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(page.getByLabel('Chart readout')).toContainText('Close');
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
