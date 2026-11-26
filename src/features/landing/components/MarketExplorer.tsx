'use client';
import Link from 'next/link';
import { PublicMarketTable } from '@/components/market/PublicMarketTable';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import landing from '../landing.module.css';

export function MarketExplorer() {
  const { tx } = useLocale();
  return (
    <section
      id="mercados"
      className={`${landing.container} ${landing.marketSection}`}
      aria-labelledby="markets-title"
    >
      <div className={landing.marketPanel}>
        <header
          className={landing.marketHeadingGroup}
          style={{ padding: '1.25rem' }}
        >
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
              'Busca empresas, consulta precios y descubre los instrumentos disponibles en Acciones UD.',
              'Search companies, view prices and discover instruments available on Acciones UD.',
            )}
          </p>
        </header>
        <PublicMarketTable />
        <footer className={landing.marketNote}>
          <span className={landing.marketNoteText}>
            <Icon name="info" size={16} />
            {tx(
              'Consulta gráficos y herramientas de análisis en Mercados en vivo.',
              'Find charts and analysis tools in Live markets.',
            )}
          </span>
          <Link href="/login" className={landing.liveMarketsLink}>
            {tx('Entrar a analizar →', 'Sign in to analyze →')}
          </Link>
        </footer>
      </div>
    </section>
  );
}
