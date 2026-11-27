import { expect, test } from '@playwright/test';

for (const locale of ['es', 'en'] as const) {
  test(`administración M07 consulta datos y revisa operaciones sin aplicarlas (${locale})`, async ({
    page,
  }, testInfo) => {
    const instant = '2026-11-26T15:00:00Z';
    const fee = {
      id: '00000000-0000-4000-8000-000000000701',
      scope: 'default',
      version_no: 1,
      commission_rate_pct: '2',
      platform_share_pct: '60',
      broker_share_pct: '40',
      effective_from: instant,
      status: 'in_force',
      reason: 'Tarifa vigente',
      created_at: instant,
    };
    const market = {
      code: 'NYSE',
      name: 'New York Stock Exchange',
      timezone: 'America/New_York',
      default_schedule: { open_time: '09:30', close_time: '16:00' },
      overrides: [],
      commission_terms: {
        fee_version_id: fee.id,
        commission_rate_pct: '2',
        platform_share_pct: '60',
      },
      fee_origin: 'default',
      trading_halts: [],
    };
    let writes = 0;
    await page.addInitScript((value) => {
      localStorage.setItem('acciones_ud_locale', value);
      localStorage.setItem('acciones_ud_theme', 'light');
    }, locale);
    await page.route('**/api/v1/admin/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      if (request.method() !== 'GET') {
        writes++;
        return route.fulfill({
          status: 409,
          json: { code: 'FEE_VERSION_CONFLICT' },
        });
      }
      let data: unknown = { items: [], next_cursor: null };
      if (path === '/api/v1/admin/users' || path === '/api/v1/admin/audit-log')
        data = { items: [], total: 0, offset: 0, limit: 50 };
      else if (path === '/api/v1/admin/kpis') {
        expect(url.searchParams.get('from')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        data = {
          period: {},
          definitions_version: 'kpi-v1',
          computed_at: instant,
          as_of: instant,
          cache_hit: false,
          stale: false,
          metrics: {
            registered_users: {
              value: 12,
              unit: 'users',
              definition: 'kpi-v1.registered_users',
            },
            traded_volume_usd: {
              value: '5000.25',
              unit: 'USD',
              definition: 'kpi-v1.traded_volume_usd',
            },
          },
        };
      } else if (path === '/api/v1/admin/fee-schedules')
        data = {
          items: [
            {
              scope: 'default',
              terms: market.commission_terms,
              current: fee,
              origin: 'default',
              scheduled: [],
            },
            {
              scope: 'NYSE',
              terms: market.commission_terms,
              current: fee,
              origin: 'default',
              scheduled: [],
            },
          ],
        };
      else if (path.endsWith('/versions'))
        data = { items: [fee], next_cursor: null };
      else if (path === '/api/v1/admin/markets') data = [market];
      else if (path === '/api/v1/admin/markets/NYSE') data = market;
      else if (path.endsWith('/schedule-overrides')) data = [];
      else if (path === '/api/v1/admin/commissions')
        data = {
          items: [],
          next_cursor: null,
          totals: {
            commission: '100',
            platform_share: '60',
            broker_share: '40',
            gross_amount: '5000',
            historical_terms_unknown_count: 0,
            complete: true,
          },
          by_market: {},
          by_broker: {},
        };
      return route.fulfill({ json: data });
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/admin');
    await expect(
      page.getByRole('heading', {
        name:
          locale === 'es' ? 'Indicadores de actividad' : 'Activity indicators',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('$5,000.25 USD', { exact: true }),
    ).toBeVisible();
    const tabs =
      locale === 'es'
        ? [
            'Comisiones',
            'Tarifas y versiones',
            'Pausas de negociación',
            'Cumplimiento',
            'Auditoría consolidada',
            'Horarios Bursátiles (Wall St.)',
          ]
        : [
            'Commissions',
            'Fees and versions',
            'Trading halts',
            'Compliance',
            'Consolidated audit',
            'Market Hours (Wall St.)',
          ];
    for (const tab of tabs) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await expect(page.locator('main table').first()).toBeVisible();
      await expect(
        page.getByText(
          locale === 'es' ? 'Consultando registros…' : 'Loading records…',
        ),
      ).toHaveCount(0);
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
          if (width === 390 || width === 1440)
            await page.locator('main').screenshot({
              path: testInfo.outputPath(
                `${tabs.indexOf(tab)}-${theme}-${width}.png`,
              ),
              animations: 'disabled',
            });
        }
      }
    }
    await page
      .getByRole('button', {
        name: locale === 'es' ? 'Tarifas y versiones' : 'Fees and versions',
        exact: true,
      })
      .click();
    await page
      .getByLabel(
        locale === 'es'
          ? 'Comisión total (%) · 0 a 10'
          : 'Total commission (%) · 0 to 10',
        { exact: true },
      )
      .fill('2.5');
    await page
      .getByLabel(
        locale === 'es'
          ? 'Parte de plataforma (%) · 0 a 100'
          : 'Platform share (%) · 0 to 100',
        { exact: true },
      )
      .fill('60');
    await page
      .getByLabel(
        locale === 'es'
          ? 'Motivo de la operación'
          : 'Reason for this operation',
        { exact: true },
      )
      .fill('Revisión de tarifas');
    await page
      .getByLabel(
        locale === 'es'
          ? 'Código de autenticación (6 dígitos)'
          : 'Authentication code (6 digits)',
        { exact: true },
      )
      .fill('123456');
    await page
      .getByRole('button', {
        name: locale === 'es' ? 'Revisar operación' : 'Review operation',
        exact: true,
      })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: locale === 'es' ? 'Confirmar operación' : 'Confirm operation',
        exact: true,
      }),
    ).toBeDisabled();
    expect(writes).toBe(0);
    await page.getByRole('dialog').screenshot({
      path: testInfo.outputPath('fee-review.png'),
      animations: 'disabled',
    });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
