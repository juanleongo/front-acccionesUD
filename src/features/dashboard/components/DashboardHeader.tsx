'use client';

import type { RefObject } from 'react';
import { Icon } from '@/components/ui/Icon';
import { sectionTitles, type DashboardSection } from '../dashboard-constants';
import styles from '../dashboard.module.css';

export interface DashboardHeaderProps {
  menuRef: RefObject<HTMLButtonElement | null>;
  activeSection: DashboardSection;
  mobile: boolean;
  mobileOpen: boolean;
  collapsed: boolean;
  isLoadingAccount?: boolean;
  hasRealWallet: boolean;
  headerAccountTotal: string;
  displayName: string;
  userInitials: string;
  onToggleMobileMenu: () => void;
  onOpenProfile: () => void;
  onToggleTheme: () => void;
}

export function DashboardHeader({
  menuRef,
  activeSection,
  mobile,
  mobileOpen,
  collapsed,
  isLoadingAccount = false,
  hasRealWallet,
  headerAccountTotal,
  displayName,
  userInitials,
  onToggleMobileMenu,
  onOpenProfile,
  onToggleTheme,
}: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <button
        ref={menuRef}
        className={styles.menu}
        aria-label="Abrir menú de navegación"
        aria-controls="dashboard-navigation"
        aria-expanded={mobile ? mobileOpen : !collapsed}
        onClick={onToggleMobileMenu}
      >
        <Icon name="menu" size={20} />
      </button>
      <h1>{sectionTitles[activeSection]}</h1>
      <div className={styles.headerActions}>
        <div className={styles.account}>
          <span>
            {isLoadingAccount
              ? 'Sincronizando Cuenta'
              : hasRealWallet
                ? 'Valor Real Cuenta (USD)'
                : 'Valor Cuenta Simulación'}
          </span>
          <strong>
            {isLoadingAccount ? 'Cargando…' : `${headerAccountTotal} USD`}
          </strong>
        </div>

        <button
          type="button"
          className={styles.avatar}
          title={`Ver perfil de ${displayName}`}
          onClick={onOpenProfile}
        >
          {isLoadingAccount ? '••' : userInitials}
        </button>

        <span className={styles.language}>
          <Icon name="globe" size={17} /> ES
        </span>
        <button
          type="button"
          onClick={onToggleTheme}
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
  );
}
