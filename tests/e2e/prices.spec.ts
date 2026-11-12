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
    page.getByRole('img', { name: /Evolución de SPY/ }),
  ).toBeVisible();
  await expect(
    page.locator('article[data-direction="down"] strong'),
  ).toContainText(/3,16/);
  await expect(page.getByLabel('Escala de precios')).toContainText('96,84');
  const graph = page.getByRole('img', { name: /Evolución de SPY/ });
  const box = await graph.boundingBox();
  await graph.hover({ position: { x: 2, y: 60 } });
  await expect(page.getByRole('tooltip')).toContainText('100 USD');
  await graph.hover({ position: { x: Math.floor(box!.width) - 2, y: 60 } });
  await expect(page.getByRole('tooltip')).toContainText('96,84 USD');
  await select.hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
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
