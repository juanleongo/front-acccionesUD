'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import styles from '../registration.module.css';

export interface RegistrationHeaderProps {
  onToggleTheme: () => void;
}

export function RegistrationHeader({ onToggleTheme }: RegistrationHeaderProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="Acciones UD, inicio"
        >
          <Image
            src="/logo-acciones-ud.png"
            alt="Logo Acciones UD"
            width={40}
            height={40}
            className={styles.brandLogo}
            priority
          />
          <div className={styles.brandText}>
            <strong>Acciones UD</strong>
            <span>Mercados de EE. UU. · NYSE &amp; NASDAQ</span>
          </div>
        </Link>
        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.themeButton}
            onClick={onToggleTheme}
            aria-label="Cambiar tema de color"
          >
            <span className={styles.whenDark}>
              <Icon name="sun" size={16} /> Claro
            </span>
            <span className={styles.whenLight}>
              <Icon name="moon" size={16} /> Oscuro
            </span>
          </button>
          <Link href="/" className={styles.back}>
            ← Volver a Acciones UD
          </Link>
        </div>
      </div>
    </header>
  );
}
