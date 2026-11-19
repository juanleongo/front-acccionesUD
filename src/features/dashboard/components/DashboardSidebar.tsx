'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { navItems, type DashboardSection } from '../dashboard-constants';
import styles from '../dashboard.module.css';

export interface DashboardSidebarProps {
  activeSection: DashboardSection;
  collapsed: boolean;
  mobile: boolean;
  mobileOpen: boolean;
  isAdmin: boolean;
  loggingOut: boolean;
  onNavigate: (section: DashboardSection) => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export function DashboardSidebar({
  activeSection,
  collapsed,
  mobile,
  mobileOpen,
  isAdmin,
  loggingOut,
  onNavigate,
  onToggleCollapse,
  onCloseMobile,
  onOpenProfile,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <aside
      id="dashboard-navigation"
      className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCloseMobile();
      }}
    >
      <div className={styles.sidebarHeader}>
        <button
          type="button"
          className={styles.brandButton}
          onClick={() => onNavigate('dashboard')}
          aria-label="Acciones UD, inicio"
        >
          <Image
            src="/logo-acciones-ud.png"
            alt="Logo Acciones UD"
            width={36}
            height={36}
            className={styles.brandLogoImg}
            priority
          />
          <span className={styles.sidebarText}>
            <strong>Acciones UD</strong>
            <span>Simulador Bursátil USA</span>
          </span>
        </button>
        <button
          type="button"
          className={styles.sidebarToggle}
          aria-label={
            collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'
          }
          onClick={onToggleCollapse}
        >
          <Icon name="menu" size={18} />
        </button>
      </div>

      <div className={styles.sideMain}>
        <button
          type="button"
          className={styles.newOrder}
          onClick={() => onNavigate('orders')}
        >
          <span aria-hidden="true">⊕</span>
          <span className={styles.sidebarText}>Nueva Orden</span>
        </button>

        <nav aria-label="Navegación del dashboard">
          {navItems.map((item) => {
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={isSelected ? styles.selected : styles.navButton}
                onClick={() => onNavigate(item.id)}
                title={item.label}
              >
                <Icon name={item.icon} size={18} />
                <span className={styles.sidebarText}>{item.label}</span>
                <span
                  className={styles.collapsedLabel}
                  aria-hidden={!collapsed || mobile}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className={styles.sideBottom}>
        {isAdmin && (
          <Link
            href="/admin"
            className={`${styles.navButton} ${styles.adminNavLink}`}
          >
            <Icon name="shield" />
            <span className={styles.sidebarText}>Panel Administrador</span>
            <span
              className={styles.collapsedLabel}
              aria-hidden={!collapsed || mobile}
            >
              Panel Administrador
            </span>
          </Link>
        )}
        <button
          type="button"
          className={styles.navButton}
          onClick={onOpenProfile}
        >
          <Icon name="user" />
          <span className={styles.sidebarText}>Mi Perfil &amp; KYC</span>
          <span
            className={styles.collapsedLabel}
            aria-hidden={!collapsed || mobile}
          >
            Mi Perfil &amp; KYC
          </span>
        </button>
        <button
          type="button"
          className={styles.navButton}
          onClick={onLogout}
          disabled={loggingOut}
        >
          <Icon name="arrow" />
          <span className={styles.sidebarText}>
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar Sesión'}
          </span>
          <span
            className={styles.collapsedLabel}
            aria-hidden={!collapsed || mobile}
          >
            Cerrar Sesión
          </span>
        </button>
        <Link href="/" className={styles.homeLink}>
          ← Volver a la portada
        </Link>
      </div>
    </aside>
  );
}
