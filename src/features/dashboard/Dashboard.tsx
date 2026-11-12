'use client';
import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { Markets } from '@/features/markets';
import styles from './dashboard.module.css';
import { DashboardRecoveryCodes } from '@/features/login';

const navigation: { label: string; icon: IconName }[] = [
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

export function Dashboard() {
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
            <strong>Acciones UD</strong>
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
            <Link href="/markets" title="Mercados">
              <Icon name="trend" />
              <span className={styles.sidebarText}>Mercados</span>
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
          </div>
        </header>
        <main id="dashboard-content" className={styles.content}>
          <DashboardRecoveryCodes />
          <Markets />
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
          Esta función estará disponible en una próxima etapa.
        </p>
        <form method="dialog">
          <button className={styles.primary}>Entendido</button>
        </form>
      </dialog>
    </div>
  );
}
