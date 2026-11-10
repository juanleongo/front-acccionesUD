'use client';
import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { dashboardPreview } from './dashboard-preview';
import type { DashboardView } from './dashboard-preview';
import styles from './dashboard.module.css';

const navigation: { label: string; icon: IconName }[] = [
  { label: 'Mercados', icon: 'trend' },
  { label: 'Terminal de Órdenes', icon: 'devices' },
  { label: 'Portafolio', icon: 'pie' },
  { label: 'Depósitos & Retiros', icon: 'wallet' },
  { label: 'Comisionistas', icon: 'users' },
];

function subscribeMobile(callback: () => void) {
  const query = window.matchMedia('(max-width: 64rem)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
function isMobile() {
  return window.matchMedia('(max-width: 64rem)').matches;
}

export function Dashboard({
  data = dashboardPreview,
}: {
  data?: DashboardView;
}) {
  const mobile = useSyncExternalStore(subscribeMobile, isMobile, () => false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, setPending] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  function action(title: string, children: ReactNode, className?: string) {
    return (
      <button
        type="button"
        className={className}
        aria-label={className === styles.newOrder ? title : undefined}
        onClick={(event) => {
          event.currentTarget.focus();
          setPending(title);
          dialog.current?.showModal();
        }}
      >
        {children}
      </button>
    );
  }
  function theme() {
    const value =
      document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem('acciones_ud_theme', value);
    } catch {
      /* Preferencia opcional. */
    }
  }
  function closeMenu() {
    setMobileOpen(false);
    menu.current?.focus();
  }
  return (
    <div className={`${styles.dashboard} ${collapsed ? styles.collapsed : ''}`}>
      <a className={styles.skip} href="#dashboard-content">
        Saltar al contenido
      </a>
      {mobileOpen && (
        <button
          className={styles.backdrop}
          aria-label="Cerrar navegación"
          onClick={closeMenu}
        />
      )}
      <aside
        id="dashboard-navigation"
        className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') closeMenu();
        }}
      >
        <Link
          href="/"
          className={styles.brand}
          aria-label="Acciones UD, inicio"
        >
          <span className={styles.logo}>UD</span>
          <span className={styles.sidebarText}>
            <strong>
              Acciones UD <small>v2.4</small>
            </strong>
            <span>Simulador Bursátil</span>
          </span>
        </Link>
        <div className={styles.sideMain}>
          {action(
            'Nueva orden',
            <>
              <span aria-hidden="true">⊕</span>
              <span className={styles.sidebarText}>Nueva Orden</span>
            </>,
            styles.newOrder,
          )}
          <nav aria-label="Navegación del dashboard">
            <Link
              href="/dashboard"
              className={styles.selected}
              aria-current="page"
              title="Dashboard"
            >
              <Icon name="grid" />
              <span className={styles.sidebarText}>Dashboard</span>
            </Link>
            {navigation.map((item) => (
              <div key={item.label}>
                {action(
                  item.label,
                  <>
                    <Icon name={item.icon} />
                    <span className={styles.sidebarText}>{item.label}</span>
                    <span
                      className={styles.collapsedLabel}
                      aria-hidden={!collapsed || mobile}
                    >
                      {item.label}
                    </span>
                  </>,
                  styles.navButton,
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className={styles.sideBottom}>
          {action(
            'Mi Perfil & KYC',
            <>
              <Icon name="user" />
              <span className={styles.sidebarText}>Mi Perfil & KYC</span>
              <span
                className={styles.collapsedLabel}
                aria-hidden={!collapsed || mobile}
              >
                Mi Perfil & KYC
              </span>
            </>,
            styles.navButton,
          )}
          {action(
            'Cerrar sesión',
            <>
              <Icon name="arrow" />
              <span className={styles.sidebarText}>Cerrar Sesión</span>
              <span
                className={styles.collapsedLabel}
                aria-hidden={!collapsed || mobile}
              >
                Cerrar Sesión
              </span>
            </>,
            styles.navButton,
          )}
          <Link href="/" className={styles.homeLink}>
            Volver al inicio
          </Link>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <button
            ref={menu}
            className={styles.menu}
            aria-label="Alternar menú lateral"
            aria-controls="dashboard-navigation"
            aria-expanded={mobile ? mobileOpen : !collapsed}
            onClick={() => {
              if (window.matchMedia('(max-width: 64rem)').matches)
                setMobileOpen(!mobileOpen);
              else setCollapsed(!collapsed);
            }}
          >
            <Icon name="menu" />
          </button>
          <h1>Panel de Control · Resumen General</h1>
          <div className={styles.headerActions}>
            <span className={styles.preview}>● Vista previa</span>
            <div className={styles.account}>
              <span>Valor cuenta</span>
              <strong>
                {data.accountValue} <small>USD</small>
              </strong>
            </div>
            <span className={styles.language}>
              <Icon name="globe" size={17} /> ES
            </span>
            <button
              onClick={theme}
              className={styles.theme}
              aria-label="Cambiar tema de color"
            >
              <span className={styles.darkLabel}>
                <Icon name="sun" size={18} /> Claro
              </span>
              <span className={styles.lightLabel}>
                <Icon name="moon" size={18} /> Oscuro
              </span>
            </button>
            {action('Mi perfil', data.user.initials, styles.avatar)}
          </div>
        </header>
        <main id="dashboard-content" className={styles.content}>
          <div className={styles.welcome}>
            <div>
              <h2>Bienvenido, {data.user.name}</h2>
              <p>Cuenta de Inversión y Trading · Resumen de tu actividad</p>
            </div>
            <div className={styles.marketStatus}>
              <span>● Nueva York (NYSE / NASDAQ): Abierta ahora</span>
              <span>● Londres / Tokio: Cerradas (Órdenes en cola)</span>
            </div>
          </div>
          <p className={styles.notice}>
            Datos de demostración: usuario, saldos, precios y estados
            ilustrativos. Sin sesión autenticada ni operaciones reales.
          </p>
          <section className={styles.metrics} aria-label="Resumen financiero">
            {data.metrics.map((metric) => (
              <article
                className={`${styles.metric} ${styles[metric.tone]}`}
                key={metric.title}
              >
                <div className={styles.metricHeading}>
                  <div>
                    <h3>{metric.title}</h3>
                    <p>{metric.description}</p>
                  </div>
                  <span className={styles.metricIcon}>
                    <Icon name={metric.icon} size={24} />
                  </span>
                </div>
                <p className={styles.amount}>
                  {metric.value} <small>USD</small>
                </p>
                <div className={styles.metricNote}>
                  {metric.note}
                  {metric.tone === 'accent' && (
                    <span className={styles.liquid}>100% Líquido</span>
                  )}
                </div>
              </article>
            ))}
          </section>
          <div className={styles.columns}>
            <div>
              <section className={styles.panel} aria-labelledby="stocks-title">
                <div className={styles.panelHeading}>
                  <div>
                    <h2 id="stocks-title">
                      <Icon name="trend" /> Acciones Populares
                    </h2>
                    <p>Vista de mercado · Cotizaciones de demostración</p>
                  </div>
                  {action(
                    'Mercados',
                    <>
                      Ver todas las acciones <Icon name="arrow" size={16} />
                    </>,
                    styles.textButton,
                  )}
                </div>
                <div
                  className={styles.tableScroll}
                  role="region"
                  aria-label="Acciones populares, tabla desplazable"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Empresa / Acción</th>
                        <th scope="col">Bolsa</th>
                        <th scope="col">Precio actual</th>
                        <th scope="col">Subida / Bajada hoy</th>
                        <th scope="col">Operar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stocks.map((stock) => (
                        <tr key={stock.symbol}>
                          <th scope="row">
                            <div className={styles.company}>
                              <span className={styles.symbol}>
                                {stock.symbol}
                              </span>
                              <div>
                                <strong>{stock.name}</strong>
                                <small>{stock.sector}</small>
                              </div>
                            </div>
                          </th>
                          <td>
                            <span
                              className={
                                stock.negative
                                  ? styles.exchangeWarning
                                  : styles.exchange
                              }
                            >
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
                            {action(
                              `Invertir en ${stock.symbol}`,
                              'Invertir',
                              styles.invest,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className={styles.portfolio}>
                <div>
                  <h2>¿Quieres ver el detalle completo de tus inversiones?</h2>
                  <p>
                    Consulta tus gráficos de rendimiento, el reparto de tus
                    activos y tus ganancias acumuladas.
                  </p>
                </div>
                {action(
                  'Portafolio',
                  <>
                    Ver mi Portafolio <Icon name="arrow" size={18} />
                  </>,
                  styles.primary,
                )}
              </section>
            </div>
            <div className={styles.rightColumn}>
              <section className={styles.panel}>
                <h2>
                  <span className={styles.percent}>%</span> Comisión de
                  Operación (2% Total)
                </h2>
                <p className={styles.commissionDescription}>
                  Cada vez que compras o vendes, se aplica una comisión fija y
                  transparente del <strong>2.0%</strong> sobre el valor de la
                  operación, distribuida de forma equitativa:
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
                {action(
                  'Asesores & Estrategias',
                  'Consultar Asesores & Estrategias',
                  styles.advisorButton,
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="dashboard-dialog-title"
        aria-describedby="dashboard-dialog-description"
      >
        <span className={styles.preview}>Próximamente</span>
        <h2 id="dashboard-dialog-title">{pending}</h2>
        <p id="dashboard-dialog-description">
          Esta función estará disponible en una próxima etapa. Este dashboard es
          una vista de demostración; no se han realizado operaciones ni cambios
          de sesión.
        </p>
        <form method="dialog">
          <button className={styles.primary}>Entendido</button>
        </form>
      </dialog>
    </div>
  );
}
