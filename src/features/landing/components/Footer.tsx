'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import { Brand } from './Header';
import { UpcomingButton } from './LandingActions';
import landing from '../landing.module.css';
import styles from '../footer.module.css';

const modules = [
  {
    es: 'Resumen de cuenta y saldos',
    en: 'Account overview and balances',
  },
  {
    es: 'Explorador de acciones de EE. UU.',
    en: 'U.S. Stock Explorer',
  },
  {
    es: 'Terminal de Órdenes & Trading',
    en: 'Order Terminal & Trading',
  },
  {
    es: 'Depósitos y retiros simulados',
    en: 'Simulated deposits and withdrawals',
  },
  {
    es: 'Red de Comisionistas Calificados',
    en: 'Certified Brokers Network',
  },
  {
    es: 'Administración Central & Auditoría',
    en: 'Central Administration & Audit',
  },
];

export function Footer() {
  const { locale, tx } = useLocale();
  return (
    <footer
      className={styles.footer}
      aria-label={tx('Acerca de Acciones UD', 'About Acciones UD')}
    >
      <div className={landing.container}>
        <div className={styles.shell}>
          <div className={styles.intro}>
            <div className={styles.introText}>
              <div className={styles.brandArea}>
                <Brand />
                <span className={styles.region}>
                  <Icon name="globe" size={13} />
                  {tx('EE. UU. · USD', 'USA · USD')}
                </span>
              </div>
              <h2>
                {tx('Aprende. Explora.', 'Learn. Explore.')}{' '}
                <span>{tx('Simula.', 'Simulate.')}</span>
              </h2>
              <p>
                {tx(
                  'Explora empresas de Estados Unidos y dale contexto a tus decisiones. Un entorno educativo para practicar a tu ritmo.',
                  'Explore U.S. companies and give context to your decisions. An educational environment to practise at your own pace.',
                )}
              </p>
            </div>
            <div className={styles.startCard}>
              <span className={styles.cardIcon}>
                <Icon name="trend" size={25} />
              </span>
              <div>
                <strong>
                  {tx(
                    'Tu próximo paso empieza aquí',
                    'Your next step starts here',
                  )}
                </strong>
                <p>
                  {tx(
                    'Descubre una empresa. Entiende su evolución.',
                    'Discover a company. Understand its journey.',
                  )}
                </p>
              </div>
              <div className={styles.actions}>
                <Link className={styles.primary} href="/markets">
                  {tx('Ver mercados disponibles', 'View available markets')}
                  <Icon name="arrow" size={17} />
                </Link>
                <Link className={styles.secondary} href="/registro">
                  {tx('Crear mi cuenta', 'Create my account')}
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.columns}>
            <section className={styles.column}>
              <h3>
                <span>
                  <Icon name="globe" size={18} />
                </span>
                {tx('Un mercado de posibilidades', 'A market of possibilities')}
              </h3>
              <div className={styles.markets}>
                {[
                  { code: 'NYSE', name: 'New York Stock Exchange' },
                  { code: 'NASDAQ', name: 'Nasdaq Stock Market' },
                  { code: 'ARCA / AMEX', name: 'NYSE Arca · NYSE American' },
                ].map((m) => (
                  <Link key={m.code} href="/markets">
                    <span>
                      <strong>{m.code}</strong>
                      <small>{m.name}</small>
                    </span>
                    <Icon name="arrow" size={16} />
                  </Link>
                ))}
              </div>
              <p className={styles.marketNote}>
                {tx(
                  'Consulta las sesiones y los horarios oficiales en Mercados.',
                  'Check official sessions and trading hours in Markets.',
                )}
              </p>
            </section>
            <nav
              className={styles.column}
              aria-label={tx('Módulos de Acciones UD', 'Acciones UD modules')}
            >
              <h3>
                <span>
                  <Icon name="grid" size={18} />
                </span>
                {tx('Todo en un mismo lugar', 'Everything in one place')}
              </h3>
              <ul className={styles.links}>
                {modules.map((mod, index) => {
                  const label = locale === 'en' ? mod.en : mod.es;
                  return (
                    <li key={mod.es}>
                      <Icon name="arrow" size={14} />
                      {index < 2 ? (
                        <Link href={index === 0 ? '/dashboard' : '/markets'}>
                          {label}
                        </Link>
                      ) : (
                        <UpcomingButton feature={label}>{label}</UpcomingButton>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            <section className={`${styles.column} ${styles.trust}`}>
              <h3>
                <span>
                  <Icon name="shield" size={18} />
                </span>
                {tx('Practica con confianza', 'Practise with confidence')}
              </h3>
              <ul className={styles.links}>
                <li>
                  <Icon name="lock" size={17} />
                  <span>
                    {tx(
                      'Verificación en dos pasos (2FA)',
                      'Two-factor authentication (2FA)',
                    )}
                  </span>
                </li>
                <li>
                  <Icon name="pie" size={17} />
                  <span>
                    {tx(
                      'Costos claros antes de operar',
                      'Clear costs before you trade',
                    )}
                  </span>
                </li>
                <li>
                  <Icon name="file" size={17} />
                  <span>
                    {tx(
                      'Historial de movimientos y operaciones',
                      'Transaction and trading history',
                    )}
                  </span>
                </li>
              </ul>
              <span className={styles.education}>
                <Icon name="info" size={16} />
                {tx(
                  'Entorno educativo de simulación',
                  'Educational simulation environment',
                )}
              </span>
              <UpcomingButton
                className={styles.terms}
                feature={tx('Condiciones de uso', 'Terms of use')}
              >
                {tx('Condiciones de uso', 'Terms of use')}
                <Icon name="arrow" size={14} />
              </UpcomingButton>
            </section>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>
            <strong>© 2026 Acciones UD</strong>
            <span>
              {tx('Todos los derechos reservados.', 'All rights reserved.')}
            </span>
          </p>
          <nav aria-label={tx('Enlaces del pie', 'Footer links')}>
            <Link href="/markets">{tx('Mercados', 'Markets')}</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/registro">{tx('Registro', 'Sign up')}</Link>
            <Link href="/login">{tx('Iniciar sesión', 'Sign in')}</Link>
            <a
              href="#inicio"
              className={styles.backTop}
              aria-label={tx('Volver al inicio', 'Back to top')}
            >
              <Icon name="arrow" size={16} />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
