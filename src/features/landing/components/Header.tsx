'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { LinkPendingIndicator } from '@/components/ui/LinkPendingIndicator';
import { getCurrentUser } from '@/features/dashboard/client';
import { formatPersonName } from '@/lib/format-person-name';
import { useLocale } from '@/lib/i18n';
import {
  getDocumentTheme,
  subscribeDocumentTheme,
  toggleDocumentTheme,
  type Theme,
} from '@/lib/theme';
import styles from '../landing.module.css';

function getServerThemeSnapshot(): Theme {
  return 'dark';
}

export function Brand() {
  const { tx } = useLocale();
  return (
    <a
      href="#inicio"
      className={styles.brand}
      aria-label={tx('Acciones UD, inicio', 'Acciones UD, home')}
    >
      <Image
        src="/logo-acciones-ud.png"
        alt={tx('Logo Acciones UD', 'Acciones UD Logo')}
        width={42}
        height={42}
        className={styles.brandLogo}
        priority
      />
      <span className={styles.brandName}>Acciones UD</span>
    </a>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { tx } = useLocale();
  const activeTheme = useSyncExternalStore(
    subscribeDocumentTheme,
    getDocumentTheme,
    getServerThemeSnapshot,
  );
  const userQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
  });
  const user = userQuery.data;

  return (
    <>
      <a href="#contenido" className={styles.skipLink}>
        {tx('Saltar al contenido', 'Skip to content')}
      </a>
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Brand />
          <nav
            id="main-navigation"
            aria-label={tx('Navegación principal', 'Main navigation')}
            className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ''}`}
            onClick={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('a')
              ) {
                setMenuOpen(false);
              }
            }}
          >
            <a href="#comisionistas" className={styles.navLink}>
              <Icon name="check" size={17} /> {tx('Comisionistas', 'Brokers')}
            </a>
            <a href="#mercados" className={styles.navLink}>
              <Icon name="trend" size={17} />{' '}
              {tx('Mercados EE. UU.', 'U.S. Markets')}
            </a>
            <a href="#como-funciona" className={styles.navLink}>
              <Icon name="exchange" size={17} />{' '}
              {tx('Cómo Funciona', 'How It Works')}
            </a>
            <a href="#seguridad" className={styles.navLink}>
              <Icon name="shield" size={17} />{' '}
              {tx('Seguridad & Confianza', 'Security & Trust')}
            </a>
            <div className={styles.mobileAccount}>
              {user ? (
                <Link href="/dashboard" className={styles.primaryButton}>
                  {tx('Ir al Dashboard', 'Go to Dashboard')} (
                  {formatPersonName(user.first_names).split(' ')[0] ||
                    tx('Inversionista', 'Investor')}
                  )
                </Link>
              ) : (
                <>
                  <Link href="/login" className={styles.loginButton}>
                    {tx('Iniciar sesión', 'Sign in')}
                  </Link>
                  <Link href="/registro" className={styles.primaryButton}>
                    {tx('Abrir cuenta de práctica', 'Open practice account')}
                    <LinkPendingIndicator />
                  </Link>
                </>
              )}
            </div>
          </nav>
          <div className={styles.headerActions}>
            <LanguageToggle className={styles.language} size={16} />
            <button
              type="button"
              className={styles.themeButton}
              onClick={() => {
                toggleDocumentTheme();
              }}
              aria-label={tx('Cambiar tema de color', 'Toggle color theme')}
            >
              {activeTheme === 'light' ? (
                <>
                  <Icon name="moon" size={16} />{' '}
                  <span className={styles.themeLabel}>
                    {tx('Oscuro', 'Dark')}
                  </span>
                </>
              ) : (
                <>
                  <Icon name="sun" size={16} />{' '}
                  <span className={styles.themeLabel}>
                    {tx('Claro', 'Light')}
                  </span>
                </>
              )}
            </button>
            {user ? (
              <Link
                href="/dashboard"
                className={`${styles.primaryButton} ${styles.headerCta}`}
              >
                <span>{tx('Ir al Dashboard', 'Go to Dashboard')}</span>
                <Icon name="arrow" size={17} />
              </Link>
            ) : (
              <>
                <Link href="/login" className={styles.loginButton}>
                  {tx('Iniciar sesión', 'Sign in')}
                </Link>
                <Link
                  href="/registro"
                  className={`${styles.primaryButton} ${styles.headerCta}`}
                >
                  {tx('Abrir cuenta de práctica', 'Open practice account')}{' '}
                  <LinkPendingIndicator>
                    <Icon name="arrow" size={17} />
                  </LinkPendingIndicator>
                </Link>
              </>
            )}
            <button
              type="button"
              className={`${styles.iconButton} ${styles.menuButton}`}
              aria-label={
                menuOpen
                  ? tx('Cerrar menú', 'Close menu')
                  : tx('Abrir menú', 'Open menu')
              }
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
