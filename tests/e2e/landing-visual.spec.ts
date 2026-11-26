import { expect, test } from '@playwright/test';

for (const locale of ['es', 'en']) {
  test(`la portada mantiene sus colores por tema y distribución móvil (${locale})`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((value) => {
      localStorage.setItem('acciones_ud_locale', value);
    }, locale);
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ status: 401, json: { code: 'NOT_AUTHENTICATED' } }),
    );
    await page.route('https://www.tradingview-widget.com/**', (route) =>
      route.abort(),
    );
    await page.goto('/');
    await expect(page.locator('#hero-title')).toBeVisible();
    const sections = await page
      .locator('main > section')
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(sections.indexOf('comisionistas')).toBeGreaterThanOrEqual(0);
    expect(sections.indexOf('comisionistas')).toBeLessThan(
      sections.indexOf('mercados'),
    );
    await expect(page.locator('#dispositivos figcaption')).toHaveText(
      locale === 'es'
        ? 'Vista ilustrativa de la plataforma'
        : 'Platform illustration',
    );
    await expect(page.locator('#seguridad')).not.toContainText(
      /2FA|two-factor|dos pasos/i,
    );
    await expect
      .poll(() =>
        page.locator('img[src*="market-life"]').evaluate((node) => {
          const image = node as HTMLImageElement;
          return image.complete && image.naturalWidth > 0;
        }),
      )
      .toBe(true);
    const title = page.locator('#hero-title');
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await expect(title).toHaveCSS(
        'color',
        theme === 'light' ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)',
      );
      await expect(title.locator('em')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
      await expect(title.locator('em')).toHaveCSS('background-clip', 'text');
      await expect(title.locator('em')).toHaveCSS(
        'background-image',
        theme === 'light'
          ? 'linear-gradient(100deg, rgb(29, 78, 216), rgb(59, 130, 246), rgb(6, 95, 70))'
          : 'linear-gradient(100deg, rgb(189, 194, 255), rgb(223, 224, 255), rgb(180, 215, 45))',
      );
      for (const width of [320, 390, 768, 1440, 2560, 3440]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
        if ([390, 1440, 2560, 3440].includes(width)) {
          await page
            .locator('section[aria-labelledby="hero-title"]')
            .screenshot({
              path: testInfo.outputPath(`hero-${theme}-${width}.png`),
              animations: 'disabled',
            });
        }
        if ([390, 1440].includes(width)) {
          await page.screenshot({
            path: testInfo.outputPath(`viewport-${theme}-${width}.png`),
            animations: 'disabled',
          });
        }
        if ([390, 1440, 2560].includes(width)) {
          await page.locator('#seguridad').screenshot({
            path: testInfo.outputPath(`security-${theme}-${width}.png`),
            animations: 'disabled',
          });
        }
      }
    }
    await page
      .getByRole('button', {
        name: locale === 'es' ? 'Móvil' : 'Phone',
        exact: true,
      })
      .click();
    await expect(page.locator('#dispositivos figure')).toHaveAttribute(
      'data-device',
      'phone',
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const photo = page.locator('img[src*="market-life"]').locator('..');
    await expect(photo).toHaveCSS('animation-name', 'none');
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(title.locator('em')).toHaveCSS('background-image', 'none');
    await expect(title.locator('em')).not.toHaveCSS(
      'color',
      'rgba(0, 0, 0, 0)',
    );
  });
}
