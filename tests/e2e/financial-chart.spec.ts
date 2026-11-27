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
    if (url.pathname === '/api/v1/public/market-explorer')
      json = {
        results: [
          {
            symbol: 'UP',
            name: 'Fixture UP',
            exchange: 'NASDAQ',
            tradable: true,
            price: '121.98',
            change_ratio: '0.02',
            as_of: '2026-11-19T15:00:00Z',
            feed: 'iex',
            is_delayed: false,
            is_stale: false,
          },
        ],
        markets: [{ code: 'NASDAQ', name: 'NASDAQ' }],
        total: 1,
        page: 1,
        page_size: 6,
        retrieved_at: '2026-11-19T15:00:00Z',
        market_open: true,
        quotes_unavailable: false,
        source: 'alpaca',
        currency: 'USD',
      };
    else if (url.pathname === '/api/v1/markets')
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

test('analysis indicators, drawings and Alpaca tables work without external chart requests', async ({
  page,
}) => {
  const { errors } = await fixture(page);
  const external: string[] = [];
  page.on('request', (request) => {
    if (/tradingview/i.test(request.url())) external.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('#mercados table')).toBeVisible();
  await expect(page.locator('#mercados')).toContainText('Fixture UP');
  expect(await page.locator('iframe').count()).toBe(0);
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    for (const width of [320, 390, 1440, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await expect(page.locator('#mercados table')).toBeVisible();
      if (width === 1440)
        await page
          .locator('#mercados')
          .screenshot({ path: `test-results/market-table-${theme}.png` });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/markets');
  const root = page.locator('[data-chart-mode]');
  await expect(root.locator('canvas').first()).toBeVisible();
  await page.locator('#chart-indicator').selectOption('rsi');
  await expect(root).toContainText(
    'Los indicadores necesitan suficiente histórico previo.',
  );
  await page
    .getByRole('button', { name: 'Nivel horizontal', exact: true })
    .click();
  const graph = page.getByRole('img', { name: 'Histórico de UP' });
  await graph.scrollIntoViewIfNeeded();
  const box = (await graph.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.25);
  await expect(
    page.getByRole('button', { name: 'Deshacer dibujo' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Deshacer dibujo' }).click();
  await expect(
    page.getByRole('button', { name: 'Deshacer dibujo' }),
  ).toBeDisabled();
  await page.locator('#chart-indicator').selectOption('macd');
  await expect(root.locator('canvas').first()).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await root.screenshot({ path: 'test-results/analysis-macd-dark.png' });
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('drawing tools support two clicks, drag, cancellation, undo, download and fullscreen', async ({
  page,
}) => {
  const { errors } = await fixture(page);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/markets');
  const root = page.locator('[data-chart-mode]');
  const graph = page.getByRole('img', { name: 'Histórico de UP' });
  await expect(root.locator('canvas').first()).toBeVisible();
  await graph.scrollIntoViewIfNeeded();
  const bounds = (await graph.boundingBox())!;
  const a = {
    x: bounds.x + bounds.width * 0.35,
    y: bounds.y + bounds.height * 0.23,
  };
  const b = {
    x: bounds.x + bounds.width * 0.65,
    y: bounds.y + bounds.height * 0.33,
  };
  await page
    .getByRole('button', { name: 'Línea de tendencia', exact: true })
    .click();
  await graph.scrollIntoViewIfNeeded();
  await page.mouse.click(a.x, a.y);
  await expect(root).toContainText('Primer punto marcado.');
  await page.mouse.move(b.x, b.y);
  await page.mouse.click(b.x, b.y);
  await expect(root).toHaveAttribute('data-drawing-count', '1');
  await page
    .getByRole('button', { name: 'Medir variación', exact: true })
    .click();
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
  await page.mouse.up();
  await expect(root).toHaveAttribute('data-drawing-count', '2');
  await expect(root).toContainText('1041–1100 de 1100');
  await root.screenshot({ path: 'test-results/drawing-tools-corrected.png' });
  await page
    .getByRole('button', { name: 'Deshacer dibujo', exact: true })
    .click();
  await expect(root).toHaveAttribute('data-drawing-count', '1');
  await page
    .getByRole('button', { name: 'Medir variación', exact: true })
    .click();
  await page.mouse.click(a.x, a.y);
  await expect(root).toContainText('Primer punto marcado.');
  await page.keyboard.press('Escape');
  await expect(root).not.toContainText('Primer punto marcado.');
  await page
    .getByRole('button', { name: 'Nivel horizontal', exact: true })
    .click();
  await page.mouse.click(b.x, b.y);
  await expect(root).toHaveAttribute('data-drawing-count', '2');
  await page
    .getByRole('button', { name: 'Borrar dibujos', exact: true })
    .click();
  await expect(root).toHaveAttribute('data-drawing-count', '0');
  for (const indicator of ['sma', 'ema', 'bollinger', 'rsi', 'macd', 'none']) {
    await page.locator('#chart-indicator').selectOption(indicator);
    await expect(root.locator('canvas').first()).toBeVisible();
    await expect(root).not.toContainText(
      /No se pudo cargar el motor|NaN|Infinity/,
    );
  }
  await page.getByRole('button', { name: 'Volumen', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Volumen', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Volumen', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Descargar gráfico', exact: true })
    .click();
  expect((await downloaded).suggestedFilename()).toBe('acciones-ud.png');
  await page
    .getByRole('button', { name: 'Pantalla completa', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Salir de pantalla completa',
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Salir de pantalla completa', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Pantalla completa', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('edits selected drawings, moves handles and shapes, creates shaded areas and restores deleted objects', async ({
  page,
}) => {
  const { errors } = await fixture(page);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/markets');
  const root = page.locator('[data-chart-mode]');
  const graph = page.getByRole('img', { name: 'Histórico de UP' });
  await expect(root.locator('canvas').first()).toBeVisible();
  await graph.scrollIntoViewIfNeeded();
  const box = (await graph.boundingBox())!;
  const a = { x: box.x + box.width * 0.25, y: box.y + box.height * 0.28 };
  const b = { x: box.x + box.width * 0.7, y: box.y + box.height * 0.48 };
  await page
    .getByRole('button', { name: 'Línea de tendencia', exact: true })
    .click();
  await page.mouse.click(a.x, a.y);
  await page.mouse.click(b.x, b.y);
  const editor = page.getByRole('group', {
    name: 'Editar dibujo seleccionado',
  });
  await expect(editor).toBeVisible();
  const line = root.locator('[data-kind="trend"]');
  await expect(line.locator('[data-handle]')).toHaveCount(2);
  await expect(root.locator('[data-anchor-date]')).toHaveCount(2);
  await editor.getByRole('button', { name: 'Verde', exact: true }).click();
  await editor.getByLabel('Grosor', { exact: true }).selectOption('4');
  await editor.getByLabel('Trazo', { exact: true }).selectOption('dashed');
  await editor.getByLabel('Texto del dibujo').fill('Soporte');
  await expect(line.locator('polyline')).toHaveAttribute('stroke-width', '4');
  await expect(line.locator('polyline')).toHaveAttribute(
    'stroke-dasharray',
    '8 5',
  );
  await expect(line).toContainText('Soporte');
  const oldPoints = await line.locator('polyline').getAttribute('points');
  const handle = await line.locator('[data-handle="0"]').evaluate((el) => ({
    x: Number(el.getAttribute('cx')),
    y: Number(el.getAttribute('cy')),
  }));
  await page.mouse.move(box.x + handle.x, box.y + handle.y);
  await page.mouse.down();
  await page.mouse.move(box.x + handle.x + 45, box.y + handle.y - 25, {
    steps: 6,
  });
  await page.mouse.up();
  await expect(line.locator('polyline')).not.toHaveAttribute(
    'points',
    oldPoints!,
  );
  const changedPoints = await line.locator('polyline').getAttribute('points');
  const coordinates = changedPoints!
    .split(' ')
    .map((v) => v.split(',').map(Number));
  const midpoint = {
    x: box.x + (coordinates[0]![0]! + coordinates[1]![0]!) / 2,
    y: box.y + (coordinates[0]![1]! + coordinates[1]![1]!) / 2,
  };
  await editor.getByRole('button', { name: 'Deseleccionar dibujo' }).click();
  await expect(editor).not.toBeVisible();
  await page.mouse.move(midpoint.x, midpoint.y);
  await page.mouse.down();
  await page.mouse.move(midpoint.x + 30, midpoint.y + 20, { steps: 6 });
  await page.mouse.up();
  await expect(editor).toBeVisible();
  await expect(line.locator('polyline')).not.toHaveAttribute(
    'points',
    changedPoints!,
  );
  await page
    .getByRole('button', { name: 'Área rectangular', exact: true })
    .click();
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  await page.mouse.up();
  await expect(root.locator('[data-kind="rectangle"] polygon')).toBeVisible();
  await editor.getByLabel('Relleno', { exact: true }).selectOption('0.25');
  await expect(root.locator('[data-kind="rectangle"] polygon')).toHaveAttribute(
    'fill-opacity',
    '0.25',
  );
  await page
    .getByRole('button', { name: 'Área poligonal', exact: true })
    .click();
  await page.mouse.click(a.x, a.y);
  await page.mouse.click(b.x, b.y);
  await page.mouse.click(a.x, b.y + 30);
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-drawing-count', '3');
  await expect(root.locator('[data-kind="polygon"] [data-handle]')).toHaveCount(
    3,
  );
  await editor
    .getByRole('button', { name: 'Eliminar dibujo seleccionado' })
    .click();
  await expect(root).toHaveAttribute('data-drawing-count', '2');
  await page
    .getByRole('button', { name: 'Deshacer dibujo', exact: true })
    .click();
  await expect(root).toHaveAttribute('data-drawing-count', '3');
  await page
    .getByRole('button', { name: 'Rehacer dibujo', exact: true })
    .click();
  await expect(root).toHaveAttribute('data-drawing-count', '2');
  // Re-select an existing shape by clicking its actual line after a mode change.
  await page.locator('#price-chart-type').selectOption('area');
  await page.locator('#price-chart-type').selectOption('candles');
  const rectangle = root.locator('[data-kind="rectangle"] polygon');
  await expect(rectangle).toBeVisible();
  const rectPoint = await rectangle.evaluate((el) =>
    el.getAttribute('points')!.split(' ')[0]!.split(',').map(Number),
  );
  await page.mouse.click(box.x + rectPoint[0]!, box.y + rectPoint[1]!);
  await expect(editor).toBeVisible();
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    for (const width of [320, 390, 1440, 2560]) {
      await page.setViewportSize({ width, height: 1100 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await expect(editor).toBeVisible();
      if (width === 1440 || width === 320)
        await root.screenshot({
          path: `test-results/editable-drawings-${theme}-${width}.png`,
        });
    }
  }
  expect(errors).toEqual([]);
});

test('calendar dates share one row and the chart exchange does not restrict stock search', async ({
  page,
}) => {
  await fixture(page);
  await page.goto('/markets');
  await expect(page.getByLabel('Bolsa', { exact: true })).toHaveValue('');
  await expect(page.locator('[data-chart-mode] canvas').first()).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const from = page.getByRole('button', {
      name: 'Elegir fecha: Desde',
      exact: true,
    });
    const to = page.getByRole('button', {
      name: 'Elegir fecha: Hasta',
      exact: true,
    });
    const a = await from.boundingBox(),
      b = await to.boundingBox();
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    await expect
      .poll(async () =>
        page
          .locator(
            'button[aria-label="Elegir fecha: Desde"], button[aria-label="Elegir fecha: Hasta"]',
          )
          .evaluateAll((elements) => {
            const boxes = elements.map((el) => el.getBoundingClientRect());
            return boxes.length === 2
              ? Math.abs(boxes[0]!.y - boxes[1]!.y)
              : 999;
          }),
      )
      .toBeLessThan(3);
    expect(b!.x).toBeGreaterThan(a!.x);
    for (const control of [from, to]) {
      await control.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const popup = (await dialog.boundingBox())!;
      expect(popup.x).toBeGreaterThanOrEqual(0);
      expect(popup.x + popup.width).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape');
    }
    if (width === 1440)
      await page
        .locator('section')
        .filter({
          has: page.getByRole('heading', {
            name: 'Calendario de NASDAQ',
            exact: true,
          }),
        })
        .last()
        .screenshot({ path: 'test-results/calendar-dates-aligned.png' });
  }
});

test('selects and edits a line underneath a filled area and cycles coincident drawings', async ({
  page,
}) => {
  const { errors } = await fixture(page);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/markets');
  const root = page.locator('[data-chart-mode]');
  await expect(root.locator('canvas').first()).toBeVisible();
  await page.locator('#price-chart-type').selectOption('area');
  await expect(root).toHaveAttribute('data-chart-mode', 'area');
  const graph = page.getByRole('img', { name: 'Histórico de UP' });
  await graph.scrollIntoViewIfNeeded();
  const box = (await graph.boundingBox())!;
  await page
    .getByRole('button', { name: 'Línea de tendencia', exact: true })
    .click();
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.3);
  await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.48);
  const firstLine = root.locator('[data-kind="trend"]').first();
  await expect(firstLine).toHaveAttribute('data-selected', 'true');
  const lineId = (await firstLine.getAttribute('data-drawing-id'))!;
  const line = root.locator(`[data-drawing-id="${lineId}"]`);
  await page
    .getByRole('button', { name: 'Área rectangular', exact: true })
    .click();
  await page.mouse.click(box.x + box.width * 0.17, box.y + box.height * 0.22);
  await page.mouse.click(box.x + box.width * 0.78, box.y + box.height * 0.58);
  const rectangle = root.locator('[data-kind="rectangle"]');
  await expect(rectangle).toHaveAttribute('data-selected', 'true');
  const rectId = (await rectangle.getAttribute('data-drawing-id'))!;
  const rectPoints = await rectangle.locator('polygon').getAttribute('points');
  const coordinates = () =>
    line.locator('polyline').evaluate((el) =>
      el
        .getAttribute('points')!
        .split(' ')
        .map((p) => p.split(',').map(Number)),
    );
  const points = await coordinates();
  const middle = {
    x: box.x + (points[0]![0]! + points[1]![0]!) / 2,
    y: box.y + (points[0]![1]! + points[1]![1]!) / 2,
  };
  await page.mouse.click(middle.x, middle.y);
  await expect(line).toHaveAttribute('data-selected', 'true');
  await expect(rectangle).toHaveAttribute('data-selected', 'false');
  await expect(page.locator('#chart-drawing-select')).toHaveValue(lineId);
  const editor = page.getByRole('group', {
    name: 'Editar dibujo seleccionado',
  });
  await editor.getByRole('button', { name: 'Verde', exact: true }).click();
  await expect(line.locator('polyline')).toHaveAttribute(
    'stroke',
    'var(--color-drawing-green)',
  );
  await expect(rectangle.locator('polygon')).toHaveAttribute(
    'stroke',
    'var(--color-drawing-blue)',
  );
  const before = await line.locator('polyline').getAttribute('points');
  await page.mouse.move(middle.x, middle.y);
  await page.mouse.down();
  await page.mouse.move(middle.x + 20, middle.y + 14, { steps: 6 });
  await page.mouse.up();
  await expect(line.locator('polyline')).not.toHaveAttribute('points', before!);
  await expect(rectangle.locator('polygon')).toHaveAttribute(
    'points',
    rectPoints!,
  );
  await expect(root).toContainText('1041–1100 de 1100');
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.53);
  await expect(rectangle).toHaveAttribute('data-selected', 'true');
  const moved = await coordinates();
  await page
    .getByRole('button', { name: 'Línea de tendencia', exact: true })
    .click();
  await page.mouse.click(box.x + moved[0]![0]!, box.y + moved[0]![1]!);
  await page.mouse.click(box.x + moved[1]![0]!, box.y + moved[1]![1]!);
  await expect(root).toHaveAttribute('data-drawing-count', '3');
  const lastLine = root.locator('[data-kind="trend"][data-selected="true"]');
  const duplicateId = (await lastLine.getAttribute('data-drawing-id'))!;
  const duplicate = root.locator(`[data-drawing-id="${duplicateId}"]`);
  const midpoint = {
    x: box.x + (moved[0]![0]! + moved[1]![0]!) / 2,
    y: box.y + (moved[0]![1]! + moved[1]![1]!) / 2,
  };
  for (const expected of [lineId, rectId, duplicateId]) {
    await page.keyboard.down('Alt');
    await page.mouse.click(midpoint.x, midpoint.y);
    await page.keyboard.up('Alt');
    await expect(page.locator('#chart-drawing-select')).toHaveValue(expected);
  }
  await page.locator('#chart-drawing-select').selectOption(lineId);
  await expect(line).toHaveAttribute('data-selected', 'true');
  const coincident = await line.locator('polyline').getAttribute('points');
  const duplicatePoints = await duplicate
    .locator('polyline')
    .getAttribute('points');
  await page.mouse.move(midpoint.x, midpoint.y);
  await page.mouse.down();
  await page.mouse.move(midpoint.x - 15, midpoint.y + 10, { steps: 6 });
  await page.mouse.up();
  await expect(line.locator('polyline')).not.toHaveAttribute(
    'points',
    coincident!,
  );
  await expect(duplicate.locator('polyline')).toHaveAttribute(
    'points',
    duplicatePoints!,
  );
  await expect(page.locator('#chart-drawing-select')).toHaveValue(lineId);

  await editor
    .getByRole('button', { name: 'Eliminar dibujo seleccionado' })
    .click();
  await expect(root).toHaveAttribute('data-drawing-count', '2');
  await expect(rectangle.locator('polygon')).toHaveAttribute(
    'points',
    rectPoints!,
  );
  await page
    .getByRole('button', { name: 'Deshacer dibujo', exact: true })
    .click();
  await expect(root).toHaveAttribute('data-drawing-count', '3');
  await page.locator('#chart-drawing-select').selectOption(lineId);
  for (const theme of ['light', 'dark']) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    await root.screenshot({
      path: `test-results/overlapping-drawings-${theme}.png`,
    });
  }
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.locator('#chart-drawing-select').selectOption(rectId);
  await expect(rectangle).toHaveAttribute('data-selected', 'true');
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
