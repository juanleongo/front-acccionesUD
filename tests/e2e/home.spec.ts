import { expect, test } from '@playwright/test';

test('la landing permite explorar sin backend ni conexiones WebSocket', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const businessRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('websocket', (socket) => businessRequests.push(socket.url()));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/'))
      businessRequests.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: /De tener curiosidad por la bolsa/,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Datos de demostración. Cotizaciones y estados ilustrativos/,
    ),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.getByRole('button', { name: 'Pausar carrusel' }).click();
  await page.getByRole('button', { name: 'Comisionista siguiente' }).click();
  await expect(
    page.getByRole('button', { name: 'Ver comisionista 2', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Ver comisionista 1', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Solicitar Propuesta' })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toContainText('Carlos Rodríguez');
  await page.getByRole('button', { name: 'Entendido' }).click();

  await page.screenshot({
    path: testInfo.outputPath('landing-dark.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Cambiar tema de color' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({
    path: testInfo.outputPath('landing-light.png'),
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Cambiar tema de color' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Londres (LSE)' }).click();
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByText('Barclays PLC')).toBeVisible();
  await page.getByRole('button', { name: 'Todos (5)' }).click();
  await page.keyboard.press('Control+k');
  const search = page.getByRole('searchbox', {
    name: 'Buscar empresa o acción',
  });
  await expect(search).toBeFocused();
  await search.fill('tesla');
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByText('Tesla Motors')).toBeVisible();
  await page
    .getByRole('button', { name: 'Simular orden', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText(
    'Simulación de órdenes · TSLA',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Simular orden', exact: true }),
  ).toBeFocused();
  await search.fill('inexistente');
  await expect(page.getByText('No encontramos activos')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.getByRole('row')).toHaveCount(6);
  await page
    .getByRole('button', { name: 'Abrir cuenta de práctica', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Entendido' }).click();
  await page.setViewportSize({ width: 320, height: 640 });
  await page.screenshot({
    path: testInfo.outputPath('landing-mobile.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Seguridad & Confianza' }).click();
  await expect(
    page.getByRole('button', { name: 'Abrir menú' }),
  ).toHaveAttribute('aria-expanded', 'false');
  expect(errors).toEqual([]);
  expect(businessRequests).toEqual([]);
});
