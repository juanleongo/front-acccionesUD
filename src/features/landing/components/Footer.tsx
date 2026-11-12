import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Brand } from './Header';
import { UpcomingButton } from './LandingActions';
import styles from '../landing.module.css';

const modules = [
  'Dashboard Ejecutivo & Balances',
  'Explorador de Acciones & ETFs de EE. UU.',
  'Terminal de Órdenes & Trading',
  'Gestión de Fondos: Depósitos PSE y Retiros',
  'Red de Comisionistas Calificados',
  'Administración Central & Auditoría',
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.footerBrand}>
              <Brand />
              <span className={styles.version}>EE. UU.</span>
            </div>
            <p className={styles.footerTagline}>
              Plataforma Bursátil Corporativa
            </p>
            <p>
              Plataforma privada de negociación e inversión bursátil con acceso
              a los mercados de valores de Estados Unidos (NYSE y NASDAQ).
            </p>
            <div className={styles.company}>
              <strong>Acciones UD Trading S.A.</strong>
              <br />
              Servicios Bursátiles &amp; Corretaje en Mercados de EE. UU.
            </div>
          </div>
          <div>
            <h2>
              <Icon name="globe" size={16} /> Bolsas de Estados Unidos
            </h2>
            <ul className={styles.footerMarkets}>
              {[
                ['New York Stock Exchange (NYSE)', 'Abierto'],
                ['NASDAQ Stock Market', 'Abierto'],
                ['NYSE Arca & American (AMEX)', 'Abierto'],
              ].map(([name, status]) => (
                <li key={name}>
                  <span>{name}</span>
                  <span
                    className={
                      status === 'Abierto'
                        ? styles.footerOpen
                        : styles.footerClosed
                    }
                  >
                    ● {status}
                  </span>
                </li>
              ))}
            </ul>
            <p className={styles.footerMarketNote}>
              ● Horario oficial del Este (America/New_York)
            </p>
          </div>
          <div>
            <h2>
              <Icon name="grid" size={16} /> Módulos del sistema
            </h2>
            <ul className={styles.footerLinks}>
              {modules.map((module, index) => (
                <li key={module}>
                  <Icon name="arrow" size={14} />
                  {index === 0 ? (
                    <Link href="/dashboard">{module}</Link>
                  ) : index === 1 ? (
                    <Link href="/markets">{module}</Link>
                  ) : (
                    <UpcomingButton feature={module}>{module}</UpcomingButton>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>
              <Icon name="shield" size={16} /> Seguridad &amp; marco legal
            </h2>
            <ul className={styles.footerLinks}>
              <li>
                <Icon name="lock" size={16} />
                <span>Autenticación de Dos Factores (2FA) Cifrada</span>
              </li>
              <li>
                <Icon name="pie" size={16} />
                <span>Comisión Base 2% Regulada y Transparente</span>
              </li>
              <li>
                <Icon name="shield" size={16} />
                <span>Auditoría de Cumplimiento (Ventana de 30 Días)</span>
              </li>
              <li>
                <Icon name="file" size={16} />
                <UpcomingButton feature="Términos corporativos">
                  Términos Corporativos &amp; Cero Riesgo de Capital
                </UpcomingButton>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>
            <strong>© 2026 Acciones UD Trading S.A.</strong> · Todos los
            derechos reservados.
          </p>
          <nav aria-label="Enlaces del pie">
            <Link href="/markets">Mercados</Link> ·{' '}
            <Link href="/dashboard">Dashboard</Link> ·{' '}
            <Link href="/registro">Registro</Link> ·{' '}
            <Link href="/login">Iniciar sesión</Link>
          </nav>
        </div>
        <p className={styles.previewDisclaimer}>
          Plataforma educativa y de simulación bursátil enfocada en los mercados
          financieros de Estados Unidos (USD).
        </p>
      </div>
    </footer>
  );
}
