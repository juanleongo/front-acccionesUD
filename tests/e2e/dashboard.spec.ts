import { expect, test } from '@playwright/test';

test('dashboard de demostración sin backend', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('websocket', (socket) => requests.push(socket.url()));
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/'))
      requests.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dashboard');
  await expect(
    page.getByRole('heading', { name: 'Bienvenido, Juan Pérez' }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('dashboard-dark.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Cambiar tema de color' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({
    path: testInfo.outputPath('dashboard-light.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Invertir', exact: true })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toContainText('Invertir en AAPL');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Invertir', exact: true }).first(),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Alternar menú lateral' }).click();
  await expect(
    page.getByRole('button', { name: 'Alternar menú lateral' }),
  ).toHaveAttribute('aria-expanded', 'false');
  for (const width of [320, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Alternar menú lateral' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Navegación del dashboard' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar navegación' }).click();
  await page.screenshot({
    path: testInfo.outputPath('dashboard-mobile.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});
