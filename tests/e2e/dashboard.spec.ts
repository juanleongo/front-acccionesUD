import { test, expect } from '@playwright/test';
test('dashboard consulta el catálogo, reloj, estado diario y calendario', async ({
  page,
}) => {
  const instant = '2026-01-12T14:30:00Z';
  await page.route('**/api/v1/instruments/search?*', (route) =>
    route.fulfill({ json: { total: 0, page_size: 50, results: [] } }),
  );
  await page.route('**/api/v1/instruments/*/candles?*', (route) =>
    route.fulfill({
      json: {
        currency: 'USD',
        source: 'Alpaca',
        is_delayed: false,
        bars: [],
        next_page_token: null,
      },
    }),
  );
  await page.route('**/api/v1/markets', (r) =>
    r.fulfill({
      json: [
        { code: 'TEST', name: 'Bolsa de prueba' },
        { code: 'ALT', name: 'Segunda bolsa' },
      ],
    }),
  );
  await page.route('**/api/v1/markets/clock?*', (r) =>
    r.fulfill({
      json: {
        is_open: true,
        timestamp: instant,
        next_open: instant,
        next_close: instant,
        time_zone: 'America/New_York',
      },
    }),
  );
  await page.route('**/api/v1/markets/*/status?*', (r) => {
    const url = new URL(r.request().url());
    return r.fulfill({
      json: {
        market: url.pathname.split('/').at(-2),
        date: url.searchParams.get('date'),
        open: false,
        open_at: null,
        close_at: null,
        override: true,
      },
    });
  });
  await page.route('**/api/v1/markets/calendar?*', (r) => {
    const q = new URL(r.request().url()).searchParams;
    return r.fulfill({
      json: {
        time_zone: q.get('tz'),
        days: [
          {
            date: q.get('start'),
            kind: q.get('market') === 'ALT' ? 'holiday' : 'trading_day',
            open_at:
              q.get('market') === 'ALT' ? null : q.get('start') + 'T14:30:00Z',
            close_at:
              q.get('market') === 'ALT' ? null : q.get('start') + 'T21:00:00Z',
            override: false,
          },
        ],
      },
    });
  });
  await page.goto('/dashboard');
  await expect(
    page.getByRole('heading', { name: /Reloj bursátil/ }),
  ).toBeVisible();
  await expect(page.getByText('Sin negociación')).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Negociación', exact: true }),
  ).toBeVisible();
  const bar = page.getByRole('img', { name: /Sesión/ }).locator('span');
  await expect(bar).toBeVisible();
  expect(
    await bar.evaluate(
      (el) => el.getBoundingClientRect().width / el.parentElement!.clientWidth,
    ),
  ).toBeCloseTo(6.5 / 24, 2);
  await page.getByLabel('Mercado', { exact: true }).selectOption('ALT');
  await expect(page.getByRole('cell', { name: 'Festivo' })).toBeVisible();
  await page.getByLabel('Hasta').fill('2020-01-01');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'intervalo válido',
  );
});
test('markets pide iniciar sesión cuando la API responde 401', async ({
  page,
}) => {
  await page.route('**/api/v1/markets', (r) =>
    r.fulfill({ status: 401, json: { code: 'UNAUTHORIZED' } }),
  );
  await page.goto('/markets');
  await expect(
    page.getByRole('link', { name: 'Inicia sesión' }),
  ).toHaveAttribute('href', '/login');
});
