import { expect, type Page, type TestInfo } from '@playwright/test';

export const responsiveWidths = [320, 390, 768, 1440, 2560];

/** Report overflow at the page boundary; wide tables must own their scrolling. */
export async function checkLayout(page: Page, label: string, info: TestInfo) {
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      })),
    )
    .toMatchObject({
      width: page.viewportSize()!.width,
      content: page.viewportSize()!.width,
    });
  const clipped = await page
    .locator(
      'main input:not([type="hidden"]), main textarea, main button, dialog[open] button, dialog[open] input:not([type="hidden"])',
    )
    .evaluateAll((nodes) =>
      nodes.flatMap((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        if (rect.width < 2 || rect.height < 2 || style.visibility === 'hidden')
          return [];
        // Firefox can retain geometry for descendants of a collapsed <details>.
        if (node.closest('details:not([open])') && !node.closest('summary'))
          return [];
        // Horizontal scroll regions (tables, tab strips) deliberately expose more content.
        for (
          let parent = node.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          const css = getComputedStyle(parent);
          if (
            ['auto', 'scroll'].includes(css.overflowX) &&
            parent.scrollWidth > parent.clientWidth + 1
          )
            return [];
        }
        return rect.left < -1 || rect.right > innerWidth + 1
          ? [
              {
                text:
                  node.getAttribute('aria-label') ||
                  node.textContent?.slice(0, 80) ||
                  node.id,
                left: rect.left,
                right: rect.right,
              },
            ]
          : [];
      }),
    );
  expect(clipped, label).toEqual([]);
  await info.attach(label, {
    body: JSON.stringify({ viewport: page.viewportSize(), clipped }),
    contentType: 'application/json',
  });
}

export async function checkMatrix(
  page: Page,
  label: string,
  info: TestInfo,
  inspectPopovers = true,
) {
  for (const width of responsiveWidths) {
    await page.setViewportSize({ width, height: width < 400 ? 740 : 1000 });
    await checkLayout(page, `${label}-${width}`, info);
    if (inspectPopovers && (width === 320 || width === 768)) {
      await checkPopovers(page, label);
    }
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await checkLayout(page, `${label}-landscape`, info);
  if (inspectPopovers) await checkPopovers(page, `${label}-landscape`);
  for (const dialog of await page.locator('dialog[open]').all()) {
    const box = (await dialog.boundingBox())!;
    expect(box.y, `${label} dialog top`).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, `${label} dialog bottom`).toBeLessThanOrEqual(
      391,
    );
    const lastButton = dialog.getByRole('button').last();
    if (await lastButton.count()) {
      await lastButton.scrollIntoViewIfNeeded();
      if (await lastButton.isEnabled()) await lastButton.focus();
      const last = (await lastButton.boundingBox())!;
      expect(last.y, `${label} last action top`).toBeGreaterThanOrEqual(box.y);
      expect(
        last.y + last.height,
        `${label} last action bottom`,
      ).toBeLessThanOrEqual(box.y + box.height + 1);
    }
  }
}

async function checkPopovers(page: Page, label: string) {
  const scope = (await page.locator('dialog[open]').count())
    ? page.locator('dialog[open]')
    : page.locator('body');
  const triggers = scope.locator(
    'button[aria-haspopup="listbox"]:not(:disabled), button[aria-haspopup="dialog"]:not(:disabled)',
  );
  for (let i = 0; i < (await triggers.count()); i++) {
    const trigger = triggers.nth(i);
    if (!(await trigger.isVisible())) continue;
    await trigger.click();
    const popup = page
      .locator(
        '[role="listbox"]:visible, [role="dialog"][id$="-calendar"]:visible',
      )
      .last();
    await expect(popup).toBeVisible();
    const box = (await popup.boundingBox())!;
    expect(box.x, `${label} popup left`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `${label} popup right`).toBeLessThanOrEqual(
      page.viewportSize()!.width + 1,
    );
    expect(box.y, `${label} popup top`).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, `${label} popup bottom`).toBeLessThanOrEqual(
      page.viewportSize()!.height + 1,
    );
    await page.keyboard.press('Escape');
    await expect(popup).not.toBeVisible();
  }
}

export async function navigateWorkspace(page: Page, name: string) {
  if (page.viewportSize()!.width <= 1024)
    await page
      .getByRole('button', {
        name: /Abrir menú de navegación|Open navigation menu/,
      })
      .click();
  await page
    .locator('#dashboard-navigation')
    .getByRole('button', { name, exact: true })
    .click();
}
