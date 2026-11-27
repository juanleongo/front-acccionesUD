import { expect, test } from '@playwright/test';

for (const locale of ['es', 'en'] as const) {
  for (const brokerMode of [false, true]) {
    test(`perfil y comisionistas mantienen diseño adaptable (${locale}, ${brokerMode ? 'broker' : 'investor'})`, async ({
      page,
    }, testInfo) => {
      const instant = '2026-11-26T15:00:00Z';
      const userId = '00000000-0000-4000-8000-000000000001';
      const brokerId = '00000000-0000-4000-8000-000000000002';
      const reputation = {
        broker_id: brokerId,
        name: 'María Vélez',
        average: '4.75',
        reviews_count: 1,
        converted_proposals: 3,
        distinct_investors: 2,
        years_experience: 5,
        broker_since: instant,
      };
      const broker = {
        id: brokerId,
        name: 'María Vélez',
        firm_name: 'Asesoría UD',
        specialty: 'Acciones estadounidenses',
        years_experience: 5,
        certifications: ['AMV'],
        description: 'Acompañamiento para tus decisiones de inversión.',
        reputation,
      };
      const link = {
        id: 'link-1',
        investor_id: userId,
        broker_id: brokerId,
        broker: {
          id: brokerId,
          name: broker.name,
          firm_name: broker.firm_name,
        },
        status: 'active',
        requested_at: instant,
        expires_at: instant,
        responded_at: instant,
        started_at: instant,
        ended_at: null,
        decline_reason: null,
        end_reason: null,
        consent_version: 'v1',
        consent_accepted_at: instant,
        order_review_enabled: false,
      };
      let personal = {
        first_names: 'Daniel',
        last_names: 'Prueba',
        phone: '+573001234567',
        country: 'CO',
      };
      await page.addInitScript((value) => {
        localStorage.setItem('acciones_ud_locale', value);
        localStorage.setItem('acciones_ud_theme', 'light');
      }, locale);
      await page.route('**/api/v1/**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        let data: unknown;
        if (path === '/api/v1/users/me') {
          if (request.method() === 'PATCH') {
            personal = { ...personal, ...request.postDataJSON() };
            data = personal;
          } else
            data = {
              user_id: userId,
              ...personal,
              email: 'test@example.org',
              account_status: 'active',
              registered_at: instant,
              is_premium: false,
              roles: brokerMode ? ['broker', 'investor'] : ['investor'],
              kyc_status: null,
              kyc_status_unavailable: false,
              interests: ['NASDAQ'],
              investor_level: 'experienced',
              mfa_enrolled: true,
              associated_broker: null,
            };
        } else if (path === '/api/v1/kyc/status')
          data = { has_account: false, status: null, can_trade: false };
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
        else if (path === '/api/v1/auth/interest-options')
          data = { markets: ['NYSE', 'NASDAQ'], sectors: ['Tecnología'] };
        else if (path === '/api/v1/broker-links/current')
          data = {
            link,
            trading_authorization: null,
            pending_broker_selection: false,
            suggestions: [broker],
          };
        else if (path === '/api/v1/broker-links')
          data = { items: [link], next_cursor: null };
        else if (path === '/api/v1/brokers')
          data = { items: [broker], next_cursor: null };
        else if (path === '/api/v1/brokers/suggestions') data = [broker];
        else if (path.endsWith('/reputation')) data = reputation;
        else if (path.endsWith('/reviews'))
          data = {
            items: [
              {
                stars: 5,
                comment: 'Asesoría clara y oportuna.',
                created_at: instant,
                updated_at: instant,
              },
            ],
            next_cursor: null,
          };
        else if (
          path === `/api/v1/brokers/${brokerId}` ||
          path === `/api/v1/brokers/${userId}`
        )
          data = broker;
        else if (path === '/api/v1/broker/link-requests') data = [];
        else if (path === '/api/v1/broker/clients')
          data = [
            {
              investor_id: userId,
              name: 'Daniel Prueba',
              link_id: link.id,
              since: instant,
              trading_authorized: true,
              order_review_enabled: false,
            },
          ];
        else if (
          path === `/api/v1/portfolio/broker/clients/${userId}/positions`
        )
          data = {
            currency: 'USD',
            positions: [
              {
                symbol: 'AAPL',
                qty: '2',
                market_value: '200',
                unrealized_pnl: '10',
              },
            ],
          };
        else if (path === `/api/v1/broker/clients/${userId}/orders`)
          data = {
            items: [
              {
                id: 'order-1',
                symbol: 'AAPL',
                side: 'buy',
                qty: '2',
                type: 'market',
                status: 'FILLED',
                limit_price: null,
                estimated_amount: '204',
                created_at: instant,
              },
            ],
            next_cursor: null,
          };
        else if (path === '/api/v1/portfolio/positions')
          data = { positions: [], positions_as_of: instant };
        else if (path === '/api/v1/markets') data = [];
        else
          return route.fulfill({
            status: 503,
            json: { code: 'TEST_ENDPOINT_UNAVAILABLE' },
          });
        return route.fulfill({ json: data });
      });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/dashboard');
      await page
        .getByRole('button', {
          name: locale === 'es' ? 'Mi Perfil & KYC' : 'My Profile & KYC',
          exact: true,
        })
        .click();
      const profile = page.getByRole('dialog');
      await expect(
        profile.getByRole('heading', {
          name:
            locale === 'es' ? 'Tus datos personales' : 'Your personal details',
        }),
      ).toBeVisible();
      await profile
        .getByLabel(locale === 'es' ? 'Nombres' : 'Given names', {
          exact: true,
        })
        .fill('  DANTE  ');
      await profile
        .getByRole('button', {
          name:
            locale === 'es'
              ? 'Guardar datos personales'
              : 'Save personal details',
          exact: true,
        })
        .click();
      await expect(
        profile.getByText(
          locale === 'es'
            ? 'Datos personales guardados.'
            : 'Personal details saved.',
          { exact: true },
        ),
      ).toBeVisible();
      expect(personal.first_names).toBe('Dante');
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
            await profile.screenshot({
              path: testInfo.outputPath(`profile-${theme}-${width}.png`),
              animations: 'disabled',
            });
        }
      }
      await profile
        .getByRole('button', {
          name: locale === 'es' ? 'Cerrar ventana' : 'Close dialog',
          exact: true,
        })
        .click();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page
        .getByRole('button', {
          name: locale === 'es' ? 'Comisionistas' : 'Brokers',
          exact: true,
        })
        .click();
      if (brokerMode) {
        await page
          .getByRole('button', {
            name: locale === 'es' ? 'Portal Comisionista' : 'Broker Portal',
            exact: true,
          })
          .click();
        await page
          .locator('#broker-client-inspect')
          .selectOption(userId, { force: true });
        await expect(
          page.getByRole('region', {
            name:
              locale === 'es' ? 'Posiciones del cliente' : 'Client positions',
          }),
        ).toBeVisible();
        await expect(
          page.getByRole('region', {
            name: locale === 'es' ? 'Órdenes del cliente' : 'Client orders',
          }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole('button', {
            name: 'Portal Comisionista',
            exact: true,
          }),
        ).toHaveCount(0);
        await page
          .getByRole('tab', {
            name:
              locale === 'es'
                ? 'Directorio de Comisionistas'
                : 'Broker Directory',
            exact: true,
          })
          .click();
        await page
          .getByRole('button', {
            name: locale === 'es' ? 'Perfil y reseñas' : 'Profile and reviews',
            exact: true,
          })
          .click();
        await expect(
          page
            .getByRole('dialog')
            .getByText('Asesoría clara y oportuna.', { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole('dialog').locator('time'),
        ).not.toContainText('T15:');
      }
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
            await (
              brokerMode ? page.locator('main') : page.getByRole('dialog')
            ).screenshot({
              path: testInfo.outputPath(`broker-${theme}-${width}.png`),
              animations: 'disabled',
            });
        }
      }
      expect(errors).toEqual([]);
    });
  }
}
