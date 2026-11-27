import { expect, test } from '@playwright/test';
const row = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NASDAQ',
  tradable: true,
  price: '178.32',
  change_ratio: '-0.0284',
  as_of: '2026-11-25T21:00:00Z',
  feed: 'iex',
  is_delayed: false,
  is_stale: true,
};
const pageData = {
  results: [
    row,
    {
      ...row,
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: '149.3',
      change_ratio: '0.0253',
    },
    {
      ...row,
      symbol: 'AAAB',
      name: 'Corgi ETF',
      price: null,
      change_ratio: null,
    },
  ],
  markets: [{ code: 'NASDAQ', name: 'Nasdaq' }],
  total: 3,
  page: 1,
  page_size: 6,
  retrieved_at: '2026-11-27T15:00:00Z',
  market_open: false,
  quotes_unavailable: true,
  source: 'alpaca',
  currency: 'USD',
};
for (const locale of ['es', 'en'])
  test(`market rows, notices and footer have responsive themes (${locale})`, async ({
    page,
  }, info) => {
    await page.addInitScript(
      (locale) => localStorage.setItem('acciones_ud_locale', locale),
      locale,
    );
    await page.route('**/api/v1/**', (route) =>
      new URL(route.request().url()).pathname ===
      '/api/v1/public/market-explorer'
        ? route.fulfill({ json: pageData })
        : route.fulfill({ status: 401, json: { code: 'NOT_AUTHENTICATED' } }),
    );
    await page.goto('/');
    const market = page.locator('#mercados');
    await expect(market.getByRole('table')).toBeVisible();
    await expect(market.locator('[data-quote-state="closed"]')).toHaveCount(2);
    await expect(market.locator('[data-quote-state="missing"]')).toHaveCount(1);
    await expect(market).not.toContainText(/Dato antiguo|Stale/);
    const footer = page.getByRole('contentinfo', {
      name: locale === 'es' ? 'Acerca de Acciones UD' : 'About Acciones UD',
    });
    for (const theme of ['dark', 'light']) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      for (const width of [320, 390, 768, 1440, 2560]) {
        await page.setViewportSize({ width, height: 1100 });
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
        await expect(footer).toBeVisible();
        if (width === 390 || width === 1440) {
          await market.screenshot({
            path: info.outputPath(`market-${theme}-${width}.png`),
            animations: 'disabled',
          });
          await footer.screenshot({
            path: info.outputPath(`footer-${theme}-${width}.png`),
            animations: 'disabled',
          });
        }
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(market.locator('tbody tr').first()).toHaveCSS(
      'animation-name',
      'none',
    );
  });

test('polling updates quotes after 30s, preserves closed-session timestamps and recovers after refresh failure', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-11-27T15:00:00Z') });
  let phase: 'old' | 'fresh' | 'closed' | 'error' = 'old';
  let requests = 0;
  await page.route('**/api/v1/**', (route) => {
    if (
      new URL(route.request().url()).pathname !==
      '/api/v1/public/market-explorer'
    )
      return route.fulfill({ status: 401, json: {} });
    requests++;
    if (phase === 'error')
      return route.fulfill({
        status: 503,
        json: { code: 'ALPACA_UNAVAILABLE' },
      });
    return route.fulfill({
      json: {
        ...pageData,
        results: [
          phase === 'old'
            ? row
            : {
                ...row,
                price: '180.5',
                as_of: '2026-11-27T15:00:31Z',
                is_stale: phase === 'closed',
              },
        ],
        total: 1,
        quotes_unavailable: false,
        market_open: phase !== 'closed',
        retrieved_at:
          phase === 'old' ? '2026-11-27T15:00:00Z' : '2026-11-27T15:00:31Z',
      },
    });
  });
  await page.goto('/');
  const market = page.locator('#mercados');
  await expect(market.locator('[data-quote-state="stale"]')).toHaveCount(1);
  const before = requests;
  phase = 'fresh';
  await page.clock.fastForward(31000);
  await expect.poll(() => requests).toBeGreaterThan(before);
  await expect(market.locator('[data-quote-state="recent"]')).toHaveCount(1);
  await expect(
    market
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: 'AAPL', exact: true }) }),
  ).toContainText('180,5');
  phase = 'closed';
  await market.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(market.locator('[data-quote-state="closed"]')).toHaveCount(1);
  await expect(
    market.locator('time[datetime="2026-11-27T15:00:31Z"]'),
  ).toHaveCount(2);
  phase = 'error';
  await market.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(market).toContainText('No pudimos renovar las cotizaciones.');
  await expect(market.locator('[data-quote-state="cached"]')).toHaveCount(1);
  await expect(market.getByRole('table')).toBeVisible();
  phase = 'fresh';
  await market.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(market.locator('[data-quote-state="recent"]')).toHaveCount(1);
  await expect(market).not.toContainText(
    'No pudimos renovar las cotizaciones.',
  );
});
