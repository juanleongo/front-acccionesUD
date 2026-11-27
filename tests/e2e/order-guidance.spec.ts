import { expect, test } from '@playwright/test';

for (const locale of ['es', 'en'] as const) {
  test(`terminal muestra precios, costes y ayudas sin enviar órdenes (${locale})`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((value) => {
      localStorage.setItem('acciones_ud_locale', value);
      localStorage.setItem('acciones_ud_theme', 'light');
    }, locale);
    const instant = '2026-11-26T15:00:00Z';
    let submissions = 0;
    let previews = 0;
    let commissionRate = 0.02;
    let marketOpen = true;
    let staleQuote = false;
    await page.route('**/api/v1/**', async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      let data: unknown;
      if (path === '/api/v1/users/me')
        data = {
          user_id: 'test-user',
          first_names: 'María',
          last_names: 'Prueba',
          email: 'test@example.org',
          phone: '+573001234567',
          country: 'CO',
          account_status: 'active',
          registered_at: instant,
          is_premium: false,
          roles: ['investor'],
          kyc_status: 'ACTIVE',
          kyc_status_unavailable: false,
          interests: [],
          investor_level: 'experienced',
          mfa_enrolled: true,
        };
      else if (path === '/api/v1/kyc/status')
        data = { has_account: true, status: 'ACTIVE', can_trade: true };
      else if (path === '/api/v1/wallet/balances')
        data = {
          status: 'ACTIVE',
          currency: 'USD',
          cash: '1000',
          cash_withdrawable: '1000',
          buying_power: '1000',
          equity: '1000',
          portfolio_value: '1000',
          long_market_value: '0',
          retrieved_at: instant,
          unavailable: false,
        };
      else if (path === '/api/v1/markets')
        data = [{ code: 'NASDAQ', name: 'Nasdaq' }];
      else if (path === '/api/v1/markets/clock')
        data = {
          is_open: marketOpen,
          timestamp: new Date().toISOString(),
          next_open: instant,
          next_close: instant,
          time_zone: 'America/New_York',
        };
      else if (path.endsWith('/status'))
        data = {
          market: 'NASDAQ',
          date: '2026-11-26',
          open: marketOpen,
          open_at: instant,
          close_at: '2026-11-26T21:00:00Z',
          override: false,
        };
      else if (path === '/api/v1/instruments/search')
        data = {
          results: [
            { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
          ],
          total: 2,
          page_size: 20,
        };
      else if (
        path === '/api/v1/instruments/AAPL/quote' ||
        path === '/api/v1/instruments/NVDA/quote'
      )
        data = {
          symbol: path.includes('/NVDA/') ? 'NVDA' : 'AAPL',
          last_trade_price: '100',
          ask_price: '100.05',
          bid_price: '99.95',
          updated_at: instant,
          as_of: instant,
          currency: 'USD',
          source: 'Alpaca',
          is_delayed: true,
          is_stale: staleQuote,
        };
      else if (/\/api\/v1\/instruments\/(AAPL|NVDA)$/.test(path))
        data = {
          symbol: path.split('/').at(-1),
          tradable: true,
          fractionable: true,
          exchange: 'NASDAQ',
        };
      else if (path === '/api/v1/portfolio/positions')
        data = { positions: [], positions_as_of: instant };
      else if (path === '/api/v1/orders/preview') {
        previews++;
        const body = request.postDataJSON();
        expect(body.confirmed).toBeUndefined();
        expect(body.totp_code).toBeUndefined();
        const base = Number(body.limit_price ?? body.stop_price ?? 100);
        const gross = Number(body.qty) * base;
        data = {
          reference_price: '100',
          estimated_amount: (
            gross * (body.side === 'buy' ? 1 + commissionRate : 1)
          ).toFixed(2),
          reference_commission: (gross * commissionRate).toFixed(2),
          available_buying_power: '1000',
          requires_extra_authorization: false,
          authorization_method: 'none',
          market_open: true,
          scheduled_for: null,
        };
      } else if (path === '/api/v1/orders' && request.method() === 'POST') {
        submissions++;
        return route.fulfill({
          status: 500,
          json: { code: 'UNEXPECTED_ORDER' },
        });
      } else if (path === '/api/v1/orders')
        data = { items: [], next_cursor: null };
      else
        return route.fulfill({
          status: 503,
          json: { code: 'TEST_ENDPOINT_UNAVAILABLE' },
        });
      return route.fulfill({ json: data });
    });
    await page.goto('/dashboard');
    await expect(
      page.getByRole('banner').getByText('MP', { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await page
      .getByRole('button', {
        name: locale === 'es' ? 'Terminal de Órdenes' : 'Order Terminal',
        exact: true,
      })
      .click();
    const orderPanel = page
      .getByRole('heading', {
        name: locale === 'es' ? 'Comprar y vender' : 'Buy & sell',
        exact: true,
      })
      .locator('xpath=ancestor::section[1]');
    const quote = page.getByRole('region', {
      name: locale === 'es' ? 'Precio de AAPL' : 'AAPL price',
    });
    await expect(quote.getByText('$100.00 USD', { exact: true })).toBeVisible();
    await quote
      .getByRole('button', {
        name: locale === 'es' ? 'Actualizar precio' : 'Refresh price',
      })
      .click();
    await expect(
      quote.getByText(
        locale === 'es' ? /El precio no ha cambiado/ : /price has not changed/,
      ),
    ).toBeVisible();
    staleQuote = true;
    marketOpen = false;
    await quote
      .getByRole('button', {
        name: locale === 'es' ? 'Actualizar precio' : 'Refresh price',
      })
      .click();
    await expect(
      quote.getByText(locale === 'es' ? /^Mercado cerrado/ : /^Market closed/),
    ).toBeVisible();
    staleQuote = false;
    marketOpen = true;
    await quote
      .getByRole('button', {
        name: locale === 'es' ? 'Actualizar precio' : 'Refresh price',
      })
      .click();
    const apple = page.locator('[data-instrument="AAPL"]');
    const assertLogo = async (
      image: ReturnType<typeof page.locator>,
      file: string,
    ) => {
      await expect(image).toHaveAttribute(
        'src',
        new RegExp(`/brands/${file}\\.svg$`),
      );
      await expect
        .poll(() =>
          image.evaluate(
            (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
          ),
        )
        .toBe(true);
    };
    await apple.scrollIntoViewIfNeeded();
    await assertLogo(apple.locator('img'), 'apple');
    await assertLogo(quote.locator('img'), 'apple');
    const selectedControl = page
      .locator('#order-symbol-select')
      .locator('..')
      .getByRole('button', { name: /AAPL/ });
    await assertLogo(selectedControl.locator('img'), 'apple');
    await selectedControl.click();
    await assertLogo(
      page.getByRole('option', { name: /NVDA/ }).locator('img'),
      'nvidia',
    );
    await page.getByRole('option', { name: /NVDA/ }).click();
    await expect(page.locator('#order-symbol-select')).toHaveValue('NVDA');
    await assertLogo(
      page
        .getByRole('region', {
          name: locale === 'es' ? 'Precio de NVDA' : 'NVDA price',
        })
        .locator('img'),
      'nvidia',
    );
    await apple.click();
    await expect(page.locator('#order-symbol-select')).toHaveValue('AAPL');
    await page
      .getByRole('button', {
        name:
          locale === 'es'
            ? 'Mostrar acciones disponibles'
            : 'Show available stocks',
        exact: true,
      })
      .click();
    const suggestions = page.getByRole('listbox', {
      name: locale === 'es' ? 'Acciones disponibles' : 'Available stocks',
    });
    await assertLogo(
      suggestions.getByRole('option', { name: /AAPL/ }).locator('img'),
      'apple',
    );
    await suggestions.getByRole('option', { name: /AAPL/ }).click();

    const estimate = page.getByRole('region', {
      name: locale === 'es' ? 'Estimación automática' : 'Automatic estimate',
    });
    expect(previews).toBe(0);
    await expect(orderPanel.getByRole('alert')).toHaveCount(0);
    await page
      .getByLabel(locale === 'es' ? 'Cantidad de acciones' : 'Share quantity', {
        exact: true,
      })
      .fill('2');
    await expect(
      estimate.getByText('$204.00 USD', { exact: true }),
    ).toBeVisible();
    expect(submissions).toBe(0);
    const select = page.locator('select#order-type');
    await select.selectOption('limit', { force: true });
    await page
      .getByLabel(
        locale === 'es' ? 'Precio límite (USD)' : 'Limit price (USD)',
        { exact: true },
      )
      .fill('95');
    await expect(
      estimate.getByText('$193.80 USD', { exact: true }),
    ).toBeVisible();
    await expect(page.locator('#order-type-help')).toContainText(
      locale === 'es' ? 'precio máximo' : 'maximum price',
    );
    await page
      .locator('summary')
      .filter({
        hasText:
          locale === 'es'
            ? 'Calcular una compra por monto'
            : 'Calculate a purchase by amount',
      })
      .click();
    await expect(orderPanel.getByRole('alert')).toHaveCount(0);
    await expect(estimate).toHaveCount(0);
    await expect(
      page.getByLabel(
        locale === 'es'
          ? 'Precio máximo por acción (USD)'
          : 'Maximum price per share (USD)',
      ),
    ).toHaveCount(0);
    await page
      .getByLabel(
        locale === 'es' ? 'Presupuesto total (USD)' : 'Total budget (USD)',
        { exact: true },
      )
      .fill('100');
    await page
      .getByRole('button', {
        name: locale === 'es' ? 'Calcular compra' : 'Calculate purchase',
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        locale === 'es'
          ? /Total estimado.*incluida la comisión/
          : /Estimated total.*including commission/,
      ),
    ).toBeVisible();
    await page
      .getByRole('radio', {
        name:
          locale === 'es'
            ? /^Sumar comisión al monto/
            : /^Add commission to the amount/,
      })
      .check();
    await expect(
      page.getByLabel(
        locale === 'es' ? 'Cantidad de acciones' : 'Share quantity',
        { exact: true },
      ),
    ).toHaveCount(0);
    await page
      .getByRole('button', {
        name: locale === 'es' ? 'Calcular compra' : 'Calculate purchase',
        exact: true,
      })
      .click();
    const breakdown = page.getByRole('region', {
      name: locale === 'es' ? 'Desglose del cálculo' : 'Calculation breakdown',
    });
    await expect(
      breakdown.getByText('$100.00 USD', { exact: true }),
    ).toHaveCount(2);
    await expect(
      breakdown.getByText('$2.00 USD', { exact: true }),
    ).toBeVisible();
    await expect(
      breakdown.getByText('$102.00 USD', { exact: true }),
    ).toBeVisible();
    expect(submissions).toBe(0);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      for (const width of [320, 390, 768, 1440, 2560]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
        if ([390, 1440].includes(width)) {
          await page
            .getByRole('heading', {
              name: locale === 'es' ? 'Comprar y vender' : 'Buy & sell',
              exact: true,
            })
            .locator('xpath=ancestor::section[1]')
            .screenshot({
              path: testInfo.outputPath(`order-${theme}-${width}.png`),
              animations: 'disabled',
            });
          await quote.screenshot({
            path: testInfo.outputPath(`quote-${theme}-${width}.png`),
            animations: 'disabled',
          });
          await breakdown.screenshot({
            path: testInfo.outputPath(`estimate-${theme}-${width}.png`),
            animations: 'disabled',
          });
        }
      }
    }
    await page
      .getByRole('button', {
        name: locale === 'es' ? 'Consultar vista previa' : 'Preview order',
        exact: true,
      })
      .click();
    await expect(
      page.getByRole('button', {
        name:
          locale === 'es'
            ? 'Confirmar y enviar orden'
            : 'Confirm & submit order',
        exact: true,
      }),
    ).toBeVisible();
    commissionRate = 0.03;
    await page
      .getByRole('button', {
        name:
          locale === 'es'
            ? 'Confirmar y enviar orden'
            : 'Confirm & submit order',
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        locale === 'es'
          ? 'Los costos se actualizaron. Revisa el nuevo total y confirma de nuevo.'
          : 'Costs were updated. Review the new total and confirm again.',
        { exact: true },
      ),
    ).toBeVisible();
    expect(submissions).toBe(0);
  });
}
