'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import { Brand } from './Header';
import { UpcomingButton } from './LandingActions';
import styles from '../landing.module.css';

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
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerIntro}>
            <div className={styles.footerBrand}>
              <Brand />
              <span className={styles.version}>{tx('EE. UU.', 'USA')}</span>
            </div>
            <p className={styles.footerTagline}>
              {tx('Aprende. Explora. Simula.', 'Learn. Explore. Simulate.')}
            </p>
            <p className={styles.footerDescription}>
              {tx(
                'Explora acciones y practica tus decisiones de inversión en un entorno educativo de simulación de los mercados de Estados Unidos.',
                'Explore stocks and practise investment decisions in an educational simulation of U.S. markets.',
              )}
            </p>
          </div>
          <div>
            <h2 className={styles.footerHeading}>
              <Icon name="globe" size={16} />{' '}
              {tx('Bolsas de Estados Unidos', 'U.S. Stock Exchanges')}
            </h2>
            <ul className={styles.footerMarkets}>
              {[
                'New York Stock Exchange (NYSE)',
                'NASDAQ',
                'NYSE Arca / NYSE American',
              ].map((name) => (
                <li key={name}>
                  <span className={styles.footerMarketName}>{name}</span>
                </li>
              ))}
            </ul>
            <p className={styles.footerMarketNote}>
              {tx(
                'Consulta el estado y los horarios de negociación en Mercados.',
                'Check trading hours and market status in Markets.',
              )}
            </p>
          </div>
          <div>
            <h2 className={styles.footerHeading}>
              <Icon name="grid" size={16} />{' '}
              {tx('Módulos del sistema', 'Platform modules')}
            </h2>
            <ul className={styles.footerLinks}>
              {modules.map((mod, index) => {
                const label = locale === 'en' ? mod.en : mod.es;
                return (
                  <li key={mod.es}>
                    <Icon name="arrow" size={14} />
                    {index === 0 ? (
                      <Link href="/dashboard">{label}</Link>
                    ) : index === 1 ? (
                      <Link href="/markets">{label}</Link>
                    ) : (
                      <UpcomingButton feature={label}>{label}</UpcomingButton>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h2 className={styles.footerHeading}>
              <Icon name="shield" size={16} />{' '}
              {tx(
                'Seguridad y uso de la plataforma',
                'Security and platform use',
              )}
            </h2>
            <ul className={styles.footerLinks}>
              <li>
                <Icon name="lock" size={16} />
                <span>
                  {tx(
                    'Verificación en dos pasos (2FA)',
                    'Two-factor authentication (2FA)',
                  )}
                </span>
              </li>
              <li>
                <Icon name="pie" size={16} />
                <span>
                  {tx(
                    'Consulta los costos antes de operar',
                    'Review costs before placing an order',
                  )}
                </span>
              </li>
              <li>
                <Icon name="shield" size={16} />
                <span>
                  {tx(
                    'Seguimiento de movimientos y operaciones',
                    'Transaction and trading history',
                  )}
                </span>
              </li>
              <li>
                <Icon name="file" size={16} />
                <UpcomingButton
                  feature={tx('Condiciones de uso', 'Terms of use')}
                >
                  {tx('Condiciones de uso', 'Terms of use')}
                </UpcomingButton>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.footerCopyright}>
            <strong>© 2026 Acciones UD</strong> ·{' '}
            {tx('Todos los derechos reservados.', 'All rights reserved.')}
          </p>
          <nav
            className={styles.footerNav}
            aria-label={tx('Enlaces del pie', 'Footer links')}
          >
            <Link href="/markets">{tx('Mercados', 'Markets')}</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/registro">{tx('Registro', 'Sign up')}</Link>
            <Link href="/login">{tx('Iniciar sesión', 'Sign in')}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
