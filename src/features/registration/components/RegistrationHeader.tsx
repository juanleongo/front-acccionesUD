'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLocale } from '@/lib/i18n';
import {
  getDocumentTheme,
  subscribeDocumentTheme,
  type Theme,
} from '@/lib/theme';
import styles from '../registration.module.css';

function getServerThemeSnapshot(): Theme {
  return 'dark';
}

export interface RegistrationHeaderProps {
  onToggleTheme: () => void;
}

export function RegistrationHeader({ onToggleTheme }: RegistrationHeaderProps) {
  const { tx } = useLocale();
  const activeTheme = useSyncExternalStore(
    subscribeDocumentTheme,
    getDocumentTheme,
    getServerThemeSnapshot,
  );
  return (
    <header className={styles.topBar}>
      <div className={styles.topBarInner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label={tx('Acciones UD, inicio', 'Acciones UD, home')}
        >
          <Image
            src="/logo-acciones-ud.png"
            alt={tx('Logo Acciones UD', 'Acciones UD Logo')}
            width={40}
            height={40}
            className={styles.brandLogo}
            priority
          />
          <div className={styles.brandText}>
            <strong>Acciones UD</strong>
            <span>
              {tx(
                'Mercados de EE. UU. · NYSE & NASDAQ',
                'U.S. Markets · NYSE & NASDAQ',
              )}
            </span>
          </div>
        </Link>
        <div className={styles.topActions}>
          <LanguageToggle className={styles.themeButton} size={16} />
          <button
            type="button"
            className={styles.themeButton}
            onClick={onToggleTheme}
            aria-label={tx('Cambiar tema de color', 'Toggle color theme')}
          >
            {activeTheme === 'light' ? (
              <>
                <Icon name="moon" size={16} /> {tx('Oscuro', 'Dark')}
              </>
            ) : (
              <>
                <Icon name="sun" size={16} /> {tx('Claro', 'Light')}
              </>
            )}
          </button>
          <Link href="/" className={styles.back}>
            {tx('← Volver a Acciones UD', '← Back to Acciones UD')}
          </Link>
        </div>
      </div>
    </header>
  );
}
