import { expect, test } from '@playwright/test';

for (const locale of ['es', 'en'] as const) {
  for (const destination of ['/', '/login'] as const) {
    test(`recupera sesión por documento con RSC inaccesible: ${locale} ${destination}`, async ({
      page,
    }) => {
      await page.addInitScript((savedLocale) => {
        localStorage.setItem('acciones_ud_locale', savedLocale);
        localStorage.setItem('acciones_ud_theme', 'light');
      }, locale);
      await page.route('**/api/v1/**', (route) =>
        route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED' } }),
      );
      const rscRequests: string[] = [];
      await page.route('**/*', async (route) => {
        const request = route.request();
        if (
          new URL(request.url()).pathname === destination &&
          request.headers().rsc === '1'
        ) {
          rscRequests.push(request.url());
          await route.abort('failed');
        } else await route.fallback();
      });
      await page.goto('/dashboard');
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      const label =
        destination === '/login'
          ? locale === 'es'
            ? 'Iniciar sesión de nuevo'
            : 'Sign in again'
          : locale === 'es'
            ? 'Volver a la portada'
            : 'Back to home';
      const documentResponse = page.waitForResponse(
        (response) =>
          response.request().resourceType() === 'document' &&
          new URL(response.url()).pathname === destination,
      );
      await dialog.getByRole('link', { name: label, exact: true }).click();
      expect((await documentResponse).status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      if (destination === '/login')
        await expect(page.locator('input[type="email"]')).toBeVisible();
      else
        await expect(
          page.locator('header a[href="/registro"]:visible').first(),
        ).toBeVisible();
      expect(rscRequests).toEqual([]);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      expect(
        await page.evaluate(() => localStorage.getItem('acciones_ud_locale')),
      ).toBe(locale);
    });
  }
}
