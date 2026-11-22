'use client';

import { useSyncExternalStore, type RefObject } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLocale } from '@/lib/i18n';
import {
  getDocumentTheme,
  subscribeThemeStorage,
  type Theme,
} from '@/lib/theme';
import { getSectionTitle, type DashboardSection } from '../dashboard-constants';
import styles from '../dashboard.module.css';

function subscribeDocumentTheme(onThemeChange: () => void): () => void {
  const stopStorage = subscribeThemeStorage(() => onThemeChange());
  if (
    typeof document === 'undefined' ||
    typeof MutationObserver === 'undefined'
  ) {
    return stopStorage;
  }
  const observer = new MutationObserver(onThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => {
    observer.disconnect();
    stopStorage();
  };
}

function getServerThemeSnapshot(): Theme {
  return 'dark';
}

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
  const { locale, tx } = useLocale();
  const activeTheme = useSyncExternalStore(
    subscribeDocumentTheme,
    getDocumentTheme,
    getServerThemeSnapshot,
  );

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <button
          ref={menuRef}
          type="button"
          className={styles.menu}
          aria-label={tx('Abrir menú de navegación', 'Open navigation menu')}
          aria-controls="dashboard-navigation"
          aria-expanded={mobile ? mobileOpen : !collapsed}
          onClick={onToggleMobileMenu}
        >
          <Icon name="menu" size={20} />
        </button>
        <h1>{getSectionTitle(activeSection, locale)}</h1>
        <div className={styles.headerActions}>
          <div className={styles.account}>
            <span>
              {isLoadingAccount
                ? tx('Sincronizando Cuenta', 'Syncing Account')
                : hasRealWallet
                  ? tx('Valor Real Cuenta (USD)', 'Real Account Value (USD)')
                  : tx('Valor Cuenta Simulación', 'Simulation Account Value')}
            </span>
            <strong>
              {isLoadingAccount
                ? tx('Cargando…', 'Loading…')
                : `${headerAccountTotal} USD`}
            </strong>
          </div>

          <button
            type="button"
            className={styles.avatar}
            title={tx(
              `Ver perfil de ${displayName}`,
              `View ${displayName} profile`,
            )}
            onClick={onOpenProfile}
          >
            {isLoadingAccount ? '••' : userInitials}
          </button>

          <LanguageToggle className={styles.language} size={17} />
          <button
            type="button"
            onClick={onToggleTheme}
            className={styles.theme}
            aria-label={tx('Cambiar tema de color', 'Toggle color theme')}
          >
            {activeTheme === 'light' ? (
              <>
                <Icon name="moon" size={18} /> {tx('Oscuro', 'Dark')}
              </>
            ) : (
              <>
                <Icon name="sun" size={18} /> {tx('Claro', 'Light')}
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
