import { test, expect } from '@playwright/test';

test('both market tables use real HTTP through the Next proxy @live-backend', async ({
  page,
  request,
}) => {
  test.skip(
    process.env.RUN_LIVE_MARKETS !== '1',
    'Opt-in integration against the configured backend.',
  );
  const initial = await request.get('/api/v1/public/market-explorer?q=AAPL');
  expect(initial.status()).toBe(200);
  expect(initial.headers()['content-type']).toContain('application/json');
  const data = await initial.json();
  expect(data.source).toBe('alpaca');
  expect(
    data.results.some((item: { symbol: string }) => item.symbol === 'AAPL'),
  ).toBe(true);
  await page.goto('/');
  const landing = page.locator('#mercados');
  await expect(landing.getByRole('table')).toBeVisible({ timeout: 20_000 });
  await landing.getByLabel('Empresa o símbolo').fill('AAPL');
  await landing.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(
    landing.getByRole('link', { name: 'AAPL', exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  await landing.screenshot({
    path: 'test-results/real-public-market-table.png',
  });
  // Isolate protected views without a user session. The public table keeps its real HTTP path.
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/v1/public/')) return route.continue();
    if (path === '/api/v1/markets')
      return route.fulfill({ json: data.markets });
    if (path === '/api/v1/instruments/search')
      return route.fulfill({ json: { total: 0, page_size: 6, results: [] } });
    return route.fulfill({ status: 503, json: {} });
  });
  await page.goto('/markets');
  const table = page.getByRole('region', { name: 'Tabla de acciones' });
  await expect(table.getByRole('table')).toBeVisible({ timeout: 20_000 });
  await page.getByLabel('Empresa o símbolo').fill('AAPL');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  // Keep this search on the exchange containing Apple.
  await page.getByLabel('Bolsa', { exact: true }).selectOption('NASDAQ');
  await expect(
    table.getByRole('button', { name: 'AAPL', exact: true }),
  ).toBeVisible({ timeout: 20_000 });
  await table.screenshot({
    path: 'test-results/real-private-market-table.png',
  });
});

test('NVIDIA is found by name across exchanges with a local logo and a clear filter recovery @live-backend', async ({
  page,
}) => {
  test.skip(
    process.env.RUN_LIVE_MARKETS !== '1',
    'Opt-in real backend integration.',
  );
  await page.goto('/');
  const landing = page.locator('#mercados');
  await expect(landing.getByRole('table')).toBeVisible({ timeout: 20000 });
  await landing.getByLabel('Empresa o símbolo').fill('NVIDIA');
  await landing.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(
    landing.getByRole('link', { name: 'NVDA', exact: true }),
  ).toBeVisible({ timeout: 20000 });
  const row = landing
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name: 'NVDA', exact: true }) });
  const logo = row.locator('img');
  await expect(logo).toHaveAttribute('src', /\/brands\/nvidia\.svg$/);
  await expect
    .poll(() =>
      logo.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await landing.getByLabel('Bolsa', { exact: true }).selectOption('AMEX');
  await expect(landing).toContainText('La búsqueda está limitada a AMEX.', {
    timeout: 20000,
  });
  await landing
    .getByRole('button', { name: 'Buscar en todas las bolsas', exact: true })
    .click();
  await expect(
    landing.getByRole('link', { name: 'NVDA', exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await landing.screenshot({ path: 'test-results/nvidia-logo-live.png' });
});

test('MSFT uses a real external logo in the public and internal tables @live-backend', async ({
  page,
  request,
}) => {
  test.skip(
    process.env.RUN_LIVE_MARKETS !== '1',
    'Opt-in real backend and logo provider integration.',
  );
  test.setTimeout(60000);
  const response = await request.get('/api/v1/public/market-explorer?q=MSFT');
  expect(response.status()).toBe(200);
  const data = await response.json();
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/v1/public/')) return route.continue();
    if (path === '/api/v1/markets')
      return route.fulfill({ json: data.markets });
    if (path === '/api/v1/instruments/search')
      return route.fulfill({ json: { total: 0, page_size: 6, results: [] } });
    return route.fulfill({ status: 503, json: {} });
  });
  for (const path of ['/', '/markets']) {
    await page.goto(path);
    const table =
      path === '/'
        ? page.locator('#mercados')
        : page.getByRole('region', { name: 'Tabla de acciones' }).locator('..');
    await expect(table.getByRole('table')).toBeVisible({ timeout: 20000 });
    await page.getByLabel('Empresa o símbolo').fill('MSFT');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    const row = table.getByRole('row').filter({
      has: page.getByRole(path === '/' ? 'link' : 'button', {
        name: 'MSFT',
        exact: true,
      }),
    });
    await expect(row).toBeVisible({ timeout: 20000 });
    const image = row.locator('img');
    await expect(image).toHaveAttribute(
      'src',
      /^https:\/\/logoapi\.sh\/ticker\/NASDAQ%3AMSFT\.svg/,
    );
    await expect
      .poll(
        () =>
          image.evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
        { timeout: 15000 },
      )
      .toBe(true);
    await expect(row.locator('[data-loaded="true"]')).toBeVisible();
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
        if (width === 1440)
          await table.screenshot({
            path: `test-results/external-logo-${path === '/' ? 'public' : 'internal'}-${theme}.png`,
          });
      }
  }
});

test('the first catalog page loads the A, AA and AAA logos through the secondary provider @live-backend', async ({
  page,
  request,
}) => {
  test.skip(
    process.env.RUN_LIVE_MARKETS !== '1',
    'Opt-in real catalog and image provider integration.',
  );
  test.setTimeout(60000);
  const initial = await request.get('/api/v1/public/market-explorer?page=1');
  expect(initial.status()).toBe(200);
  const data = await initial.json();
  expect(data.results.map((asset: { symbol: string }) => asset.symbol)).toEqual(
    expect.arrayContaining(['A', 'AA', 'AAA', 'AAAA', 'AAAB']),
  );
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/api/v1/public/')) return route.continue();
    if (path === '/api/v1/markets')
      return route.fulfill({ json: data.markets });
    if (path === '/api/v1/instruments/search')
      return route.fulfill({ json: { total: 0, page_size: 6, results: [] } });
    return route.fulfill({ status: 503, json: {} });
  });
  for (const path of ['/', '/markets']) {
    await page.goto(path);
    const table =
      path === '/'
        ? page.locator('#mercados')
        : page.getByRole('region', { name: 'Tabla de acciones' }).locator('..');
    await expect(table.getByRole('table')).toBeVisible({ timeout: 20000 });
    for (const symbol of ['A', 'AA', 'AAA']) {
      const row = table.getByRole('row').filter({
        has: page.getByRole(path === '/' ? 'link' : 'button', {
          name: symbol,
          exact: true,
        }),
      });
      await row.scrollIntoViewIfNeeded();
      const image = row.locator('img');
      await expect(image).toHaveAttribute(
        'src',
        `https://financialmodelingprep.com/image-stock/${symbol}.png`,
        { timeout: 15000 },
      );
      await expect
        .poll(
          () =>
            image.evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
            ),
          { timeout: 15000 },
        )
        .toBe(true);
      await expect(row.locator('[data-loaded="true"]')).toBeVisible();
      if (symbol === 'AAA') {
        const brightness = await row
          .locator('[data-loaded="true"]')
          .evaluate((el) => {
            const rgb = getComputedStyle(el)
              .backgroundColor.match(/\d+/g)!
              .slice(0, 3)
              .map(Number);
            return rgb.reduce((a, b) => a + b, 0) / 3;
          });
        expect(brightness).toBeLessThan(100);
      }
    }
    for (const theme of ['light', 'dark']) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      await table.screenshot({
        path: `test-results/first-page-logos-${path === '/' ? 'public' : 'internal'}-${theme}.png`,
      });
    }
  }
});
