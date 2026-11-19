'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import styles from '../admin.module.css';

export interface AdminHeaderProps {
  onToggleTheme: () => void;
}

export function AdminHeader({ onToggleTheme }: AdminHeaderProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <Link href="/" className={styles.brand} aria-label="Inicio Acciones UD">
          <Image
            src="/logo-acciones-ud.png"
            alt="Logo Acciones UD"
            width={38}
            height={38}
            className={styles.brandLogo}
            priority
          />
          <div className={styles.brandText}>
            <strong>Acciones UD · SysAdmin</strong>
            <span>Portal de Control Institucional &amp; RBAC</span>
          </div>
        </Link>

        <div className={styles.adminBadge}>
          <Icon name="shield" size={14} /> Modo Administrador Activo
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.themeButton}
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
          >
            <Icon name="sun" size={14} /> Tema
          </button>
          <Link href="/dashboard" className={styles.linkDashboard}>
            ← Ir a Vista Inversor (Dashboard)
          </Link>
        </div>
      </div>
    </header>
  );
}
