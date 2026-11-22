'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { useLocale } from '@/lib/i18n';
import { getDocumentTheme, subscribeDocumentTheme } from '@/lib/theme';
import { tradingViewWidgetUrl, type MarketView } from '../tradingview';
import type { Locale } from '@/lib/i18n';
import type { Theme } from '@/lib/theme';
import landing from '../landing.module.css';
import styles from '../market-explorer.module.css';

const serverTheme = (): Theme => 'dark';

function TradingViewFrame({
  locale,
  theme,
  view,
}: {
  locale: Locale;
  theme: Theme;
  view: MarketView;
}) {
  const { tx } = useLocale();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [url] = useState(() =>
    tradingViewWidgetUrl(locale, theme, window.location.origin, view),
  );
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setStatus('error'), 25000);
    return () => clearTimeout(timer);
  }, [status]);
  if (status === 'error')
    return (
      <div className={styles.feedback} role="alert">
        <Icon name="globe" size={28} />
        <strong>
          {tx('No pudimos abrir TradingView', 'Could not open TradingView')}
        </strong>
        <p>
          {tx(
            'Puedes reintentar o abrir el explorador directamente en TradingView.',
            'Try again or open the screener directly on TradingView.',
          )}
        </p>
      </div>
    );
  return (
    <>
      {status === 'loading' && (
        <div className={styles.feedback}>
          <LoadingState
            mode="compact"
            label={tx('Cargando mercados…', 'Loading markets…')}
          />
        </div>
      )}
      <iframe
        title={
          view === 'chart'
            ? tx(
                'Gráfico y búsqueda de acciones de TradingView',
                'TradingView chart and stock search',
              )
            : tx(
                'Explorador de acciones de TradingView',
                'TradingView stock screener',
              )
        }
        src={url}
        className={`${styles.frame} ${view === 'screener' ? styles.screenerFrame : ''} ${status === 'loading' ? styles.pending : ''}`}
        aria-busy={status === 'loading'}
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
      />
    </>
  );
}

export function MarketExplorer() {
  const { locale, tx } = useLocale();
  const theme = useSyncExternalStore(
    subscribeDocumentTheme,
    getDocumentTheme,
    serverTheme,
  );
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<MarketView>('screener');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => setActive(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return (
    <section
      id="mercados"
      className={`${landing.container} ${landing.marketSection}`}
      aria-labelledby="markets-title"
    >
      <div className={landing.marketPanel}>
        <header className={styles.header}>
          <div className={landing.marketHeadingGroup}>
            <span className={landing.marketEyebrow}>
              {tx(
                'Exploración bursátil · Estados Unidos',
                'Market exploration · United States',
              )}
            </span>
            <h2 id="markets-title" className={landing.marketTitle}>
              <Icon name="trend" size={24} />
              {tx('Explorador de mercados de EE. UU.', 'U.S. market explorer')}
            </h2>
            <p className={landing.marketSubtitle}>
              {tx(
                'Consulta acciones, compara su evolución y encuentra nuevas oportunidades de análisis.',
                'Explore stocks, compare their performance and discover more instruments to analyze.',
              )}
            </p>
          </div>
          <span className={styles.provider}>
            <Icon name="globe" size={16} />
            TradingView
          </span>
        </header>
        <div className={styles.viewBar}>
          <div
            className={styles.views}
            role="group"
            aria-label={tx('Vista del explorador', 'Market explorer view')}
          >
            <button
              type="button"
              aria-pressed={view === 'screener'}
              onClick={() => setView('screener')}
            >
              <Icon name="grid" size={16} />
              {tx('Explorar acciones', 'Explore stocks')}
            </button>
            <button
              type="button"
              aria-pressed={view === 'chart'}
              onClick={() => setView('chart')}
            >
              <Icon name="search" size={16} />
              {tx('Buscar y analizar', 'Search and analyze')}
            </button>
          </div>
          <p className={styles.hint}>
            {view === 'chart'
              ? tx(
                  'Pulsa el símbolo en la parte superior del gráfico para buscar una empresa o acción.',
                  'Select the symbol at the top of the chart to search for a company or stock.',
                )
              : tx(
                  'Usa «Filtros» para explorar por bolsa, sector y otras características.',
                  'Use Filters to explore by exchange, sector and other criteria.',
                )}
            {view === 'screener' && (
              <span className={styles.mobileHint}>
                {tx(
                  'Desliza la tabla para consultar precios y más columnas.',
                  'Swipe the table to see prices and more columns.',
                )}
              </span>
            )}
          </p>
        </div>
        <div
          ref={host}
          className={`${styles.widget} ${view === 'screener' ? styles.scrollable : ''}`}
          role="region"
          aria-label={tx(
            'Contenido de mercado de TradingView',
            'TradingView market content',
          )}
          tabIndex={view === 'screener' ? 0 : -1}
        >
          {active ? (
            <TradingViewFrame
              key={`${locale}-${theme}-${view}-${attempt}`}
              locale={locale}
              theme={theme}
              view={view}
            />
          ) : (
            <div className={styles.feedback}>
              <p>
                {tx(
                  'Explora las acciones del mercado estadounidense.',
                  'Explore U.S. stock markets.',
                )}
              </p>
            </div>
          )}
        </div>
        <div className={styles.tools}>
          <a
            href={
              view === 'chart'
                ? 'https://www.tradingview.com/chart/'
                : 'https://www.tradingview.com/screener/'
            }
            target="_blank"
            rel="noopener noreferrer"
            className={styles.credit}
          >
            {view === 'chart'
              ? tx('Gráficos por TradingView ↗', 'Charts by TradingView ↗')
              : tx(
                  'Analizador de acciones por TradingView ↗',
                  'Stock Screener by TradingView ↗',
                )}
          </a>
          <button
            type="button"
            className={landing.secondaryButton}
            onClick={() => {
              setActive(true);
              setAttempt(attempt + 1);
            }}
          >
            <Icon name="exchange" size={15} />
            {tx('Recargar vista', 'Reload view')}
          </button>
        </div>
        <footer className={landing.marketNote}>
          <span className={landing.marketNoteText}>
            <Icon name="info" size={16} />
            {tx(
              'Cotizaciones con demora según la bolsa. Consulta la información del proveedor antes de operar.',
              'Quotes may be delayed depending on the exchange. Check provider information before trading.',
            )}
          </span>
          <Link href="/login" className={landing.liveMarketsLink}>
            {tx('Operar en Acciones UD →', 'Trade on Acciones UD →')}
          </Link>
        </footer>
      </div>
    </section>
  );
}
