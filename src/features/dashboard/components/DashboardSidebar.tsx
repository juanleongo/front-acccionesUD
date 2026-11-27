'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
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
  const { locale, tx } = useLocale();
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
          aria-label={tx('Acciones UD, inicio', 'Acciones UD, home')}
        >
          <Image
            src="/logo-acciones-ud.png"
            alt={tx('Logo Acciones UD', 'Acciones UD Logo')}
            width={36}
            height={36}
            className={styles.brandLogoImg}
            priority
          />
          <span className={styles.sidebarText}>
            <strong>Acciones UD</strong>
          </span>
        </button>
        <button
          type="button"
          className={styles.sidebarToggle}
          aria-label={
            collapsed
              ? tx('Expandir menú lateral', 'Expand sidebar menu')
              : tx('Colapsar menú lateral', 'Collapse sidebar menu')
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
          <span className={styles.sidebarText}>
            {tx('Nueva Orden', 'New Order')}
          </span>
        </button>

        <nav
          aria-label={tx('Navegación del dashboard', 'Dashboard navigation')}
        >
          {navItems.map((item) => {
            const isSelected = activeSection === item.id;
            const itemLabel = locale === 'en' ? item.labelEn : item.label;
            return (
              <button
                key={item.id}
                type="button"
                className={isSelected ? styles.selected : styles.navButton}
                aria-current={isSelected ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
                title={itemLabel}
              >
                <Icon name={item.icon} size={18} />
                <span className={styles.sidebarText}>{itemLabel}</span>
                <span
                  className={styles.collapsedLabel}
                  aria-hidden={!collapsed || mobile}
                >
                  {itemLabel}
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
            <span className={styles.sidebarText}>
              {tx('Panel Administrador', 'Admin Panel')}
            </span>
            <span
              className={styles.collapsedLabel}
              aria-hidden={!collapsed || mobile}
            >
              {tx('Panel Administrador', 'Admin Panel')}
            </span>
          </Link>
        )}
        <button
          type="button"
          className={styles.navButton}
          onClick={() => {
            if (mobile) onCloseMobile();
            onOpenProfile();
          }}
        >
          <Icon name="user" />
          <span className={styles.sidebarText}>
            {tx('Mi Perfil & KYC', 'My Profile & KYC')}
          </span>
          <span
            className={styles.collapsedLabel}
            aria-hidden={!collapsed || mobile}
          >
            {tx('Mi Perfil & KYC', 'My Profile & KYC')}
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
            {loggingOut
              ? tx('Cerrando sesión…', 'Signing out…')
              : tx('Cerrar Sesión', 'Sign Out')}
          </span>
          <span
            className={styles.collapsedLabel}
            aria-hidden={!collapsed || mobile}
          >
            {tx('Cerrar Sesión', 'Sign Out')}
          </span>
        </button>
        <Link href="/" className={styles.homeLink}>
          {tx('← Volver a la portada', '← Back to landing page')}
        </Link>
      </div>
    </aside>
  );
}
