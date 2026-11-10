import { Icon } from '@/components/ui/Icon';
import { Brand } from './Header';
import { UpcomingButton } from './LandingActions';
import styles from '../landing.module.css';

const modules = [
  'Dashboard Ejecutivo & Balances',
  'Explorador de Acciones & ETFs',
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
              <span className={styles.version}>Vista previa</span>
            </div>
            <p className={styles.footerTagline}>
              Plataforma Bursátil Corporativa
            </p>
            <p>
              Plataforma privada de negociación e inversión bursátil con acceso
              simulado a mercados internacionales y ejecución algorítmica.
            </p>
            <div className={styles.company}>
              <strong>Acciones UD Global Trading S.A.</strong>
              <br />
              Servicios Bursátiles & Corretaje Internacional
            </div>
          </div>
          <div>
            <h2>
              <Icon name="globe" size={16} /> Mercados globales
            </h2>
            <ul className={styles.footerMarkets}>
              {[
                ['Wall Street (NYSE / NASDAQ)', 'Abierto'],
                ['Bolsa de Londres (LSE)', 'Encolado'],
                ['Bolsa de Tokio (TSE)', 'Encolado'],
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
              ● Estados ilustrativos de demostración
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
                  {index === 1 ? (
                    <a href="#mercados">{module}</a>
                  ) : (
                    <UpcomingButton feature={module}>{module}</UpcomingButton>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>
              <Icon name="shield" size={16} /> Seguridad & marco legal
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
                  Términos Corporativos & Cero Riesgo de Capital
                </UpcomingButton>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>
            <strong>© 2026 Acciones UD Global Trading S.A.</strong> · Todos los
            derechos reservados.
          </p>
          <span className={styles.previewBadge}>
            <span className={styles.dot} /> Entorno de demostración
          </span>
        </div>
        <p className={styles.previewDisclaimer}>
          Vista previa del producto. Funciones, cifras y condiciones del diseño
          sujetas a implementación; no hay cuentas, depósitos ni órdenes
          habilitados.
        </p>
      </div>
    </footer>
  );
}
