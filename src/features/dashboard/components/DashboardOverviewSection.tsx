'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioPositions } from '@/features/portfolio';
import { formatPersonName } from '@/lib/format-person-name';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import type { WalletBalance } from '@/features/wallet';
import {
  setGuideDismissedPreference,
  type DashboardSection,
} from '../dashboard-constants';
import { dashboardPreview } from '../dashboard-preview';
import type { UserProfile } from '../user-api';
import styles from '../dashboard.module.css';

export interface DashboardOverviewSectionProps {
  user: UserProfile | undefined;
  realWallet: WalletBalance | null | undefined;
  hasRealAccount: boolean;
  isLoadingData?: boolean;
  guideDismissed: boolean;
  onNavigate: (section: DashboardSection) => void;
  onStartOrderForSymbol: (symbol: string) => void;
  onOpenKycModal: () => void;
}

function formatUsdValue(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
}: DashboardOverviewSectionProps) {
  const positions = useQuery({
    queryKey: ['portfolio', 'positions'],
    queryFn: ({ signal }) => fetchPortfolioPositions(signal),
    enabled: hasRealAccount,
    retry: false,
    refetchInterval: 30000,
  });
  const stocks = [...(positions.data?.positions ?? [])]
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
        sector: `${position.qty} acciones · ${position.sector ?? 'Sector no informado'}`,
        exchange: position.exchange,
        price: formatUsdValue(Number(position.price)) + ' USD',
        negative: pnl < 0,
        change: `${pnl > 0 ? '+' : ''}${pct} (${pnl > 0 ? '+' : ''}${formatUsdValue(pnl)})`,
      };
    });
  if (isLoadingData) {
    return (
      <LoadingState
        label="Sincronizando tu resumen financiero…"
        detail="Consultando perfil de usuario, verificación KYC y saldos reales de tu billetera."
      />
    );
  }

  return (
    <>
      <div className={styles.welcome}>
        <div>
          <h2>
            ¡Hola, {user ? formatPersonName(user.first_names) : 'Inversionista'}
            !
          </h2>
          <p>
            Cuenta de Inversión y Trading · Supervisión en vivo de tu actividad
            en mercados de EE. UU.
          </p>
        </div>
        <div className={styles.marketStatus}>
          <span className={styles.statusPillLive}>
            Wall Street (NYSE / NASDAQ): Abierta ahora
          </span>
          <span className={styles.statusPillNeutral}>
            Operación simulada en USD
          </span>
          <span className={styles.statusPillLevel}>
            Nivel:{' '}
            {user?.investor_level === 'experienced'
              ? 'Con experiencia'
              : 'Principiante'}
          </span>
        </div>
      </div>

      {user?.investor_level !== 'experienced' &&
        (guideDismissed ? (
          <div className={styles.didacticCollapsedBar}>
            <span>🎓 Modo Principiante activo · Guía didáctica oculta</span>
            <button
              type="button"
              className={styles.didacticToggleBtn}
              onClick={() => setGuideDismissedPreference(false)}
            >
              Mostrar Guía
            </button>
          </div>
        ) : (
          <section
            className={styles.didacticGuide}
            aria-label="Guía pedagógica para principiantes"
          >
            <div className={styles.didacticHeader}>
              <div className={styles.didacticBadge}>
                🎓 Guía Didáctica Activa · Modo Principiante
              </div>
              <span className={styles.didacticNote}>
                Protección activa: Activos de alta volatilidad y derivados
                complejos están filtrados para proteger tu curva de aprendizaje.
              </span>
              <button
                type="button"
                className={styles.didacticDismissBtn}
                onClick={() => setGuideDismissedPreference(true)}
                title="Ocultar guía didáctica"
                aria-label="Ocultar guía didáctica"
              >
                ✕ Ocultar
              </button>
            </div>
            <div className={styles.didacticGrid}>
              <div className={styles.didacticCard}>
                <strong>1. Órdenes de Mercado (Market)</strong>
                <p>
                  Se ejecutan al instante al mejor precio de oferta en Wall
                  Street (NYSE/NASDAQ). Ideales para tomar posiciones de forma
                  inmediata en USD.
                </p>
              </div>
              <div className={styles.didacticCard}>
                <strong>2. Órdenes Límite (Limit)</strong>
                <p>
                  Tú estableces el precio máximo a pagar o el mínimo a recibir.
                  La orden solo se ejecuta si el mercado toca tu cotización
                  objetivo.
                </p>
              </div>
              <div className={styles.didacticCard}>
                <strong>3. Comisión del 2% y Acompañamiento</strong>
                <p>
                  Desglose transparente: 60% para la plataforma de simulación
                  Acciones UD y 40% para tu asesor comisionista asignado.
                </p>
              </div>
            </div>
          </section>
        ))}

      {user && !hasRealAccount && (
        <div className={styles.kycActionBanner}>
          <div>
            <strong>
              🛡️ Completa tu verificación de identidad (KYC) en EE. UU.
            </strong>
            <p>
              Tu usuario ya está activo, pero aún falta radicar el formulario
              KYC ante el custodio para habilitar saldo real, depósitos y envío
              de órdenes.
            </p>
          </div>
          <button
            type="button"
            className={styles.primary}
            onClick={onOpenKycModal}
          >
            Completar Trámite KYC →
          </button>
        </div>
      )}

      <section className={styles.metrics} aria-label="Resumen financiero">
        {dashboardPreview.metrics.map((metric, idx) => {
          const displayValue = realWallet
            ? idx === 0
              ? formatUsdValue(
                  realWallet.available_balance_usd +
                    realWallet.reserved_balance_usd +
                    realWallet.invested_equity_usd,
                )
              : idx === 1
                ? formatUsdValue(realWallet.available_balance_usd)
                : idx === 2
                  ? formatUsdValue(realWallet.reserved_balance_usd)
                  : formatUsdValue(realWallet.invested_equity_usd)
            : metric.value;
          const displayTitle =
            realWallet && idx === 3
              ? 'VALOR INVERTIDO EN ACCIONES'
              : metric.title;
          return (
            <article
              key={metric.title}
              className={`${styles.metric} ${styles[metric.tone] ?? ''}`}
            >
              <div className={styles.metricHeading}>
                <div>
                  <h3>{displayTitle}</h3>
                  <p>{metric.description}</p>
                </div>
                <div className={styles.metricIcon}>
                  <Icon name={metric.icon} size={18} />
                </div>
              </div>
              <div className={styles.amount}>
                {displayValue} <small>USD</small>
              </div>
              <div className={styles.metricNote}>
                {realWallet ? 'Sincronizado con tu Billetera' : metric.note}
              </div>
            </article>
          );
        })}
      </section>

      <div className={styles.columns}>
        <div className={styles.leftColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <h2>
                <Icon name="trend" size={18} /> Tus Inversiones Activas ·
                Principales posiciones de tu portafolio
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('markets')}
                className={styles.liveMarketsLink}
              >
                Ver cotizaciones en vivo →
              </button>
            </div>
            <div className={styles.tableScroll}>
              <table>
                <thead>
                  <tr>
                    <th>Activo</th>
                    <th>Bolsa</th>
                    <th>Precio (USD)</th>
                    <th>Ganancia / pérdida</th>
                    <th>Operación</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasRealAccount ? (
                    <tr>
                      <td colSpan={5}>
                        Vincula tu cuenta KYC para consultar tus inversiones.
                      </td>
                    </tr>
                  ) : positions.isPending ? (
                    <tr>
                      <td colSpan={5} role="status">
                        Consultando tus inversiones…
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
                          Reintentar
                        </button>
                      </td>
                    </tr>
                  ) : stocks.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        Todavía no tienes posiciones abiertas. Tus compras
                        aparecerán cuando se ejecuten.
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
                      <td>
                        <span className={styles.exchange}>
                          {stock.exchange}
                        </span>
                      </td>
                      <td className={styles.price}>{stock.price}</td>
                      <td
                        className={
                          stock.negative ? styles.negative : styles.positive
                        }
                      >
                        {stock.change}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onStartOrderForSymbol(stock.symbol)}
                          className={styles.invest}
                        >
                          Operar
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
                No se pudo actualizar. Se conserva la última información
                recibida.
              </p>
            )}
          </section>

          <section className={styles.portfolio}>
            <div>
              <h2>¿Quieres ver el detalle completo de tus inversiones?</h2>
              <p>
                Consulta tus gráficos de rendimiento, la distribución de tus
                activos, tu perfil de riesgo y tus órdenes ejecutadas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('portfolio')}
              className={styles.primary}
            >
              Ver Mi Portafolio Completo <Icon name="arrow" size={18} />
            </button>
          </section>
        </div>

        <div className={styles.rightColumn}>
          <section className={styles.panel}>
            <h2>
              <span className={styles.percent}>%</span> Comisión de Operación
              (2% Total)
            </h2>
            <p className={styles.commissionDescription}>
              Cada vez que compras o vendes acciones en NYSE o NASDAQ, se aplica
              una comisión fija del <strong>2.0%</strong> distribuida de forma
              transparente:
            </p>
            <div className={styles.split}>
              <span>Para la Plataforma Acciones UD:</span>
              <strong>60% (1.2% total)</strong>
            </div>
            <div className={styles.split}>
              <span>Para tu Asesor de Inversión:</span>
              <strong>40% (0.8% total)</strong>
            </div>
            <p className={styles.finePrint}>
              Sin cargos sorpresa ni cobros ocultos por apertura o
              mantenimiento.
            </p>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <h2>Tu Asesor Bursátil</h2>
              <span className={styles.assigned}>Asignado</span>
            </div>
            <div className={styles.advisor}>
              <span>CR</span>
              <div>
                <strong>Carlos Rodríguez, CFA</strong>
                <small>Registro Oficial #UD-ADV-042</small>
                <b>★ 4.9 de 5.0 (184 propuestas exitosas)</b>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('advisors')}
              className={styles.advisorButton}
            >
              Consultar Asesores &amp; Estrategias
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
