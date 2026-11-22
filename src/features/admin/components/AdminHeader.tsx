'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLocale } from '@/lib/i18n';
import styles from '../admin.module.css';

export interface AdminHeaderProps {
  onToggleTheme: () => void;
}

export function AdminHeader({ onToggleTheme }: AdminHeaderProps) {
  const { tx } = useLocale();
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label={tx('Inicio Acciones UD', 'Acciones UD Home')}
        >
          <Image
            src="/logo-acciones-ud.png"
            alt={tx('Logo Acciones UD', 'Acciones UD Logo')}
            width={38}
            height={38}
            className={styles.brandLogo}
            priority
          />
          <div className={styles.brandText}>
            <strong>Acciones UD · SysAdmin</strong>
            <span>
              {tx(
                'Portal de Control Institucional & RBAC',
                'Institutional Control & RBAC Portal',
              )}
            </span>
          </div>
        </Link>

        <div className={styles.adminBadge}>
          <Icon name="shield" size={14} />{' '}
          {tx('Modo Administrador Activo', 'Administrator Mode Active')}
        </div>

        <div className={styles.topActions}>
          <LanguageToggle className={styles.themeButton} size={14} />
          <button
            type="button"
            className={styles.themeButton}
            onClick={onToggleTheme}
            aria-label={tx('Cambiar tema', 'Toggle color theme')}
          >
            <Icon name="sun" size={14} /> {tx('Tema', 'Theme')}
          </button>
          <Link href="/dashboard" className={styles.linkDashboard}>
            {tx('← Ir a Vista Inversor (Dashboard)', '← Investor Dashboard')}
          </Link>
        </div>
      </div>
    </header>
  );
}
