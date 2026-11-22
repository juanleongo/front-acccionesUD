import { expect, test } from '@playwright/test';
test('grafica cierres paginados y cambia el período sin inventar precios', async ({
  page,
}) => {
  await page.route('**/api/v1/markets', (route) =>
    route.fulfill({
      json: [
        { code: 'NYSE', name: 'Nueva York' },
        { code: 'ALT', name: 'Otra bolsa' },
      ],
    }),
  );
  await page.route('**/api/v1/markets/*/status?*', (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
  await page.route('**/api/v1/markets/calendar?*', (route) =>
    route.fulfill({ json: { time_zone: 'America/New_York', days: [] } }),
  );
  await page.route('**/api/v1/instruments/search?*', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const results =
      params.get('exchange') === 'NYSE'
        ? [
            { symbol: 'ABC', name: 'Acciones ABC' },
            { symbol: 'SPY', name: 'Fondo Americano' },
          ]
        : [];
    return route.fulfill({
      json: { total: results.length, page_size: 50, results },
    });
  });
  await page.route('**/api/v1/instruments/ABC/candles?*', (route) =>
    route.fulfill({
      json: {
        currency: 'USD',
        source: 'Alpaca',
        is_delayed: false,
        next_page_token: null,
        bars: [],
      },
    }),
  );
  await page.route('**/api/v1/markets/clock?*', (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.route('**/api/v1/instruments/SPY/candles?*', (route) => {
    const q = new URL(route.request().url()).searchParams;
    const daily = q.get('timeframe') === '5Min',
      next = q.has('page_token');
    return route.fulfill({
      json: {
        currency: 'USD',
        source: 'Alpaca',
        is_delayed: false,
        next_page_token: daily || next ? null : 'cursor',
        bars: daily
          ? []
          : [
              {
                timestamp: next
                  ? '2026-01-03T16:00:00Z'
                  : '2026-01-02T16:00:00Z',
                open: next ? '98.5' : '99',
                high: next ? '99.2' : '101',
                low: next ? '96.1' : '98.5',
                close: next ? '96.84' : '100',
              },
            ],
      },
    });
  });
  await page.goto('/markets');
  const select = page.getByRole('combobox', {
    name: 'Instrumento',
    exact: true,
  });
  await expect(select).toHaveValue('ABC');
  await select.selectOption('SPY');
  await expect(
    page.getByRole('img', { name: /Histórico de SPY/ }),
  ).toBeVisible();
  await expect(
    page.locator('article[data-direction="down"] strong'),
  ).toContainText(/3,16/);
  const graph = page.getByRole('img', { name: /Histórico de SPY/ });
  await graph.focus();
  await graph.press('ArrowLeft');
  await expect(page.getByLabel('Lectura del gráfico')).toContainText(
    'Cierre 100',
  );
  await graph.press('ArrowRight');
  await expect(page.getByLabel('Lectura del gráfico')).toContainText(
    'Cierre 96,84',
  );
  await page.getByRole('button', { name: '1D', exact: true }).click();
  await expect(
    page.getByText('Sin precios disponibles para este período.'),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Mercado', exact: true })
    .selectOption('ALT');
  await expect(
    page.getByText(/Sin instrumentos para este filtro en ALT/),
  ).toBeVisible();
  await expect(select).toBeDisabled();
});
