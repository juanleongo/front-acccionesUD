'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioPositions } from '@/features/portfolio';
import { AdvisorSummaryCard } from '@/features/brokers';
import { formatPersonName } from '@/lib/format-person-name';
import { formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n/locale';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { MarketSessionSummary } from '@/features/markets/client';
import type { WalletBalance } from '@/features/wallet';
import {
  setGuideDismissedPreference,
  type DashboardSection,
} from '../dashboard-constants';
import { dashboardPreview, localizeMetricText } from '../dashboard-preview';
import type { UserProfile } from '../user-api';
import styles from '../dashboard.module.css';

function getRealMetricContent(
  idx: number,
  realWallet: WalletBalance,
  locale: Locale,
) {
  const totalCash =
    realWallet.total_cash_usd ??
    realWallet.available_balance_usd + realWallet.reserved_balance_usd;
  const buyingPower =
    realWallet.buying_power_usd ?? realWallet.available_balance_usd;
  const isEn = locale === 'en';

  const cards = [
    {
      title: isEn ? 'Total Account Value' : 'Dinero total de tu cuenta',
      description: isEn
        ? 'Total cash + U.S. equities value'
        : 'Efectivo total + valor de acciones en EE. UU.',
      value: formatUsd(totalCash + realWallet.invested_equity_usd),
      note: isEn ? 'Synced with your Wallet' : 'Sincronizado con tu Billetera',
    },
    {
      title: isEn ? 'Available to Invest' : 'Disponible para invertir',
      description: isEn
        ? 'Active buying power on NYSE & NASDAQ'
        : 'Poder de compra activo en NYSE y NASDAQ',
      value: formatUsd(buyingPower),
      note: isEn
        ? 'Ready to buy U.S. stocks'
        : 'Listo para comprar acciones en EE. UU.',
    },
    {
      title: isEn ? 'Withdrawable Cash to Bank' : 'Efectivo retirable a banco',
      description: isEn
        ? 'Settled cash after ACH / T+1 clearing'
        : 'Saldo liberado tras liquidación ACH / T+1',
      value: formatUsd(realWallet.available_balance_usd),
      note:
        realWallet.reserved_balance_usd > 0
          ? isEn
            ? `In ACH clearing: ${formatUsd(realWallet.reserved_balance_usd)} USD`
            : `En liquidación bancaria: ${formatUsd(realWallet.reserved_balance_usd)} USD`
          : isEn
            ? 'Available for bank withdrawal'
            : 'Disponible para retiro bancario',
    },
    {
      title: isEn ? 'Invested in Equities' : 'Valor invertido en acciones',
      description: isEn
        ? 'Open positions on U.S. exchanges'
        : 'Posiciones abiertas en bolsas de EE. UU.',
      value: formatUsd(realWallet.invested_equity_usd),
      note: isEn
        ? 'Current portfolio market value'
        : 'Valorización actual de tu portafolio',
    },
  ];

  return cards[idx] ?? cards[0];
}

export interface DashboardOverviewSectionProps {
  user: UserProfile | undefined;
  realWallet: WalletBalance | null | undefined;
  hasRealAccount: boolean;
  isLoadingData?: boolean;
  guideDismissed: boolean;
  onNavigate: (section: DashboardSection) => void;
  onStartOrderForSymbol: (symbol: string) => void;
  onOpenKycModal: () => void;
  onExploreAdvisors?: () => void;
}

export function DashboardOverviewSection({
  user,
  realWallet,
  hasRealAccount,
  isLoadingData = false,
  guideDismissed,
  onNavigate,
  onStartOrderForSymbol,
  onOpenKycModal,
  onExploreAdvisors,
}: DashboardOverviewSectionProps) {
  const { locale, tx } = useLocale();
  const positions = useQuery({
    queryKey: ['portfolio', 'positions'],
    queryFn: ({ signal }) => fetchPortfolioPositions(signal),
    enabled: hasRealAccount,
    retry: false,
    refetchInterval: 30000,
  });
  const stocks = [...(hasRealAccount ? (positions.data?.positions ?? []) : [])]
    .sort((a, b) => Number(b.market_value) - Number(a.market_value))
    .slice(0, 5)
    .map((position) => {
      const pnl = Number(position.unrealized_pnl);
      const cost = Number(position.cost_basis);
      const pct =
        cost > 0
          ? `${((pnl / cost) * 100).toLocaleString('es-CO', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`
          : '—';
      return {
        symbol: position.symbol,
        name: position.symbol,
        sector: `${position.qty} ${tx('acciones', 'shares')} · ${position.sector ?? tx('Sector no informado', 'Sector unavailable')}`,
        exchange: position.exchange,
        price: formatUsd(Number(position.price), { withCode: true }),
        negative: pnl < 0,
        change: `${pnl > 0 ? '+' : ''}${pct} (${pnl > 0 ? '+' : ''}${formatUsd(pnl)})`,
      };
    });
  if (isLoadingData) {
    return (
      <LoadingState
        label={tx(
          'Sincronizando tu resumen financiero…',
          'Syncing your financial summary…',
        )}
        detail={tx(
          'Consultando perfil de usuario, verificación KYC y saldos reales de tu billetera.',
          'Fetching your profile, KYC status, and live wallet balances.',
        )}
      />
    );
  }

  return (
    <>
      <div className={styles.welcome}>
        <div>
          <h2>
            {tx('¡Hola,', 'Hello,')}{' '}
            {user
              ? formatPersonName(user.first_names)
              : tx('Inversionista', 'Investor')}
            !
          </h2>
        </div>
        <MarketSessionSummary />
      </div>

      {user?.investor_level !== 'experienced' &&
        (guideDismissed ? (
          <div className={styles.didacticCollapsedBar}>
            <span>
              {tx(
                '🎓 Modo Principiante activo · Guía didáctica oculta',
                '🎓 Beginner Mode active · Learning guide hidden',
              )}
            </span>
            <button
              type="button"
              className={styles.didacticToggleBtn}
              onClick={() => setGuideDismissedPreference(false)}
            >
              {tx('Mostrar Guía', 'Show Guide')}
            </button>
          </div>
        ) : (
          <section
            className={styles.didacticGuide}
            aria-label={tx(
              'Guía pedagógica para principiantes',
              'Beginner learning guide',
            )}
          >
            <div className={styles.didacticHeader}>
              <div className={styles.didacticBadge}>
                {tx(
                  '🎓 Guía Didáctica Activa · Modo Principiante',
                  '🎓 Learning Guide Active · Beginner Mode',
                )}
              </div>
              <span className={styles.didacticNote}>
                {tx(
                  'Protección activa: Activos de alta volatilidad y derivados complejos están filtrados para proteger tu curva de aprendizaje.',
                  'Active protection: High-volatility assets and complex derivatives are filtered to support your learning curve.',
                )}
              </span>
              <button
                type="button"
                className={styles.didacticDismissBtn}
                onClick={() => setGuideDismissedPreference(true)}
                title={tx('Ocultar guía didáctica', 'Hide learning guide')}
                aria-label={tx('Ocultar guía didáctica', 'Hide learning guide')}
              >
                {tx('✕ Ocultar', '✕ Hide')}
              </button>
            </div>
            <div className={styles.didacticGrid}>
              <div className={styles.didacticCard}>
                <strong>
                  {tx('1. Órdenes de Mercado (Market)', '1. Market Orders')}
                </strong>
                <p>
                  {tx(
                    'Se ejecutan al instante al mejor precio de oferta en Wall Street (NYSE/NASDAQ). Ideales para tomar posiciones de forma inmediata en USD.',
                    'Execute immediately at the best available price on Wall Street (NYSE/NASDAQ). Ideal for instant entries in USD.',
                  )}
                </p>
              </div>
              <div className={styles.didacticCard}>
                <strong>
                  {tx('2. Órdenes Límite (Limit)', '2. Limit Orders')}
                </strong>
                <p>
                  {tx(
                    'Tú estableces el precio máximo a pagar o el mínimo a recibir. La orden solo se ejecuta si el mercado toca tu cotización objetivo.',
                    'You set the maximum buy price or minimum sell price. The order executes only if the market reaches your target price.',
                  )}
                </p>
              </div>
              <div className={styles.didacticCard}>
                <strong>
                  {tx(
                    '3. Comisión del 2% y Acompañamiento',
                    '3. 2% Commission & Advisory Split',
                  )}
                </strong>
                <p>
                  {tx(
                    'Desglose transparente: 60% para la plataforma de simulación Acciones UD y 40% para tu asesor comisionista asignado.',
                    'Transparent breakdown: 60% goes to the Acciones UD platform and 40% to your assigned broker advisor.',
                  )}
                </p>
              </div>
            </div>
          </section>
        ))}

      {user && !hasRealAccount && (
        <div className={styles.kycActionBanner}>
          <div>
            <strong>
              {tx(
                '🛡️ Completa tu verificación de identidad (KYC) en EE. UU.',
                '🛡️ Complete your U.S. KYC identity verification',
              )}
            </strong>
            <p>
              {tx(
                'Tu usuario ya está activo, pero aún falta radicar el formulario KYC ante el custodio para habilitar saldo real, depósitos y envío de órdenes.',
                'Your login is active, but the custodian KYC application must still be submitted to unlock wallet balances, deposits, and live trading.',
              )}
            </p>
          </div>
          <button
            type="button"
            className={styles.primary}
            onClick={onOpenKycModal}
          >
            {tx('Completar Trámite KYC →', 'Complete KYC Form →')}
          </button>
        </div>
      )}

      <section
        className={styles.metrics}
        aria-label={tx('Resumen financiero', 'Financial summary')}
      >
        {dashboardPreview.metrics.map((metric, idx) => {
          const liveMetric = realWallet
            ? getRealMetricContent(idx, realWallet, locale)
            : null;
          const previewText = localizeMetricText(metric, locale);
          const displayTitle = liveMetric
            ? liveMetric.title
            : previewText.title;
          const displayDescription = liveMetric
            ? liveMetric.description
            : previewText.description;
          const displayValue = liveMetric ? liveMetric.value : metric.value;
          const displayNote = liveMetric ? liveMetric.note : previewText.note;
          return (
            <article
              key={metric.title}
              className={`${styles.metric} ${styles[metric.tone] ?? ''}`}
            >
              <div className={styles.metricHeading}>
                <div>
                  <h3>{displayTitle}</h3>
                  <p>{displayDescription}</p>
                </div>
                <div className={styles.metricIcon}>
                  <Icon name={metric.icon} size={18} />
                </div>
              </div>
              <div className={styles.amount}>
                {displayValue} <small>USD</small>
              </div>
              <div className={styles.metricNote}>{displayNote}</div>
            </article>
          );
        })}
      </section>

      <div className={styles.columns}>
        <div className={styles.leftColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <h2>
                <Icon name="trend" size={18} />{' '}
                {tx(
                  'Tus inversiones activas · Principales posiciones',
                  'Your active investments · Top holdings',
                )}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('markets')}
                className={styles.liveMarketsLink}
              >
                {tx('Ver cotizaciones en vivo →', 'View live quotes →')}
              </button>
            </div>
            <div className={styles.tableScroll}>
              <table>
                <thead>
                  <tr>
                    <th>{tx('Activo', 'Asset')}</th>
                    <th>{tx('Bolsa', 'Exchange')}</th>
                    <th>{tx('Precio (USD)', 'Price (USD)')}</th>
                    <th>{tx('Ganancia / pérdida', 'Profit / loss')}</th>
                    <th>{tx('Operación', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasRealAccount ? (
                    <tr>
                      <td colSpan={5}>
                        {tx(
                          'Vincula tu cuenta KYC para consultar tus inversiones.',
                          'Complete your account verification to see your investments.',
                        )}
                      </td>
                    </tr>
                  ) : positions.isPending ? (
                    <tr>
                      <td colSpan={5} role="status">
                        {tx(
                          'Consultando tus inversiones…',
                          'Loading your investments…',
                        )}
                      </td>
                    </tr>
                  ) : positions.isError && !positions.data ? (
                    <tr>
                      <td colSpan={5} role="alert">
                        No se pudieron cargar tus inversiones.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            void positions.refetch();
                          }}
                        >
                          {tx('Reintentar', 'Retry')}
                        </button>
                      </td>
                    </tr>
                  ) : stocks.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        {tx(
                          'Todavía no tienes posiciones abiertas. Tus compras aparecerán cuando se ejecuten.',
                          'You have no open positions yet. Purchases appear once executed.',
                        )}
                      </td>
                    </tr>
                  ) : null}
                  {stocks.map((stock) => (
                    <tr key={stock.symbol}>
                      <td>
                        <div className={styles.company}>
                          <span className={styles.symbol}>{stock.symbol}</span>
                          <div>
                            <strong>{stock.name}</strong>
                            <small>{stock.sector}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label={tx('Bolsa', 'Exchange')}>
                        <span className={styles.exchange}>
                          {stock.exchange}
                        </span>
                      </td>
                      <td
                        className={styles.price}
                        data-label={tx('Precio (USD)', 'Price (USD)')}
                      >
                        {stock.price}
                      </td>
                      <td
                        className={
                          stock.negative ? styles.negative : styles.positive
                        }
                        data-label={tx('Ganancia / pérdida', 'Profit / loss')}
                      >
                        {stock.change}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onStartOrderForSymbol(stock.symbol)}
                          className={styles.invest}
                        >
                          {tx('Operar', 'Trade')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {positions.data && (
              <p className={styles.investmentSummaryNote}>
                Hasta 5 posiciones, ordenadas por valor de mercado.
                Ganancia/pérdida no realizada frente al costo invertido.
                Actualizado:{' '}
                {new Date(positions.data.positions_as_of).toLocaleString(
                  'es-CO',
                  { timeZone: 'America/Bogota' },
                )}{' '}
                (Colombia).
              </p>
            )}
            {positions.isError && positions.data && (
              <p role="alert">
                {tx(
                  'No se pudo actualizar. Se conserva la última información recibida.',
                  'Could not refresh. Showing the last received information.',
                )}
              </p>
            )}
          </section>

          <section className={styles.portfolio}>
            <div>
              <h2>
                {tx(
                  '¿Quieres ver el detalle completo de tus inversiones?',
                  'Want to inspect the full breakdown of your investments?',
                )}
              </h2>
              <p>
                {tx(
                  'Consulta tus gráficos de rendimiento, la distribución de tus activos, tu perfil de riesgo y tus órdenes ejecutadas.',
                  'View your return charts, asset allocation, risk profile, and executed orders.',
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('portfolio')}
              className={styles.primary}
            >
              {tx('Ver Mi Portafolio Completo', 'Open Full Portfolio')}{' '}
              <Icon name="arrow" size={18} />
            </button>
          </section>
        </div>

        <div className={styles.rightColumn}>
          <section className={styles.panel}>
            <h2>
              <span className={styles.percent}>%</span>{' '}
              {tx(
                'Comisión de Operación (2% Total)',
                'Trading Commission (2% Total)',
              )}
            </h2>
            <p className={styles.commissionDescription}>
              {tx(
                'Cada vez que compras o vendes acciones en NYSE o NASDAQ, se aplica una comisión fija del ',
                'Every time you buy or sell stocks on NYSE or NASDAQ, a flat ',
              )}
              <strong>2.0%</strong>{' '}
              {tx(
                'distribuida de forma transparente:',
                'fee applies and is transparently allocated:',
              )}
            </p>
            <div className={styles.split}>
              <span>
                {tx(
                  'Para la Plataforma Acciones UD:',
                  'Acciones UD Platform Fee:',
                )}
              </span>
              <strong>{tx('60% (1.2% total)', '60% (1.2% of trade)')}</strong>
            </div>
            <div className={styles.split}>
              <span>
                {tx(
                  'Para tu Asesor de Inversión:',
                  'Your Investment Broker Fee:',
                )}
              </span>
              <strong>{tx('40% (0.8% total)', '40% (0.8% of trade)')}</strong>
            </div>
            <p className={styles.finePrint}>
              {tx(
                'Sin cargos sorpresa ni cobros ocultos por apertura o mantenimiento.',
                'No surprise fees or hidden account opening or maintenance charges.',
              )}
            </p>
          </section>

          <AdvisorSummaryCard
            userId={user?.user_id}
            onExplore={onExploreAdvisors ?? (() => onNavigate('advisors'))}
            onOpenAdvisor={() => onNavigate('advisors')}
          />
        </div>
      </div>
    </>
  );
}
