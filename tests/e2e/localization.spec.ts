import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`el catálogo cambia ES/EN y conserva el idioma al recargar (${theme})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((value) => {
      localStorage.setItem('acciones_ud_theme', value);
    }, theme);
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ status: 401, json: { code: 'NOT_AUTHENTICATED' } }),
    );
    await page.route('https://www.tradingview-widget.com/**', (route) =>
      route.abort(),
    );
    await page.goto('/');
    const title = page.locator('#hero-title');
    for (const width of [320, 390, 1440, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(title).toContainText('Tu próxima decisión');
      await page
        .getByRole('button', { name: 'Cambiar idioma a inglés' })
        .click();
      await expect(title).toContainText('Your next decision');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page
        .getByRole('button', { name: 'Switch language to Spanish' })
        .click();
      await expect(title).toContainText('Tu próxima decisión');
    }
    await page.getByRole('button', { name: 'Cambiar idioma a inglés' }).click();
    await expect(title).toContainText('Your next decision');
    await page.reload();
    await expect(title).toContainText('Your next decision');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(
      await page.evaluate(() => localStorage.getItem('acciones_ud_locale')),
    ).toBe('en');
    expect(errors).toEqual([]);
  });
}
