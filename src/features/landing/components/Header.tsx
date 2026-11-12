'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { getCurrentUser } from '@/features/dashboard/client';
import styles from '../landing.module.css';

export function Brand() {
  return (
    <a href="#inicio" className={styles.brand} aria-label="Acciones UD, inicio">
      <Image
        src="/logo-acciones-ud.png"
        alt="Logo Acciones UD"
        width={42}
        height={42}
        className={styles.brandLogo}
        priority
      />
      <span>Acciones UD</span>
    </a>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const userQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
  });
  const user = userQuery.data;

  function toggleTheme() {
    const theme =
      document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('acciones_ud_theme', theme);
    } catch {
      /* El tema sigue funcionando sin almacenamiento. */
    }
  }

  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Brand />
        <nav
          id="main-navigation"
          aria-label="Navegación principal"
          className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ''}`}
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest('a')) {
              setMenuOpen(false);
            }
          }}
        >
          <a href="#comisionistas">
            <Icon name="check" size={17} /> Comisionistas
          </a>
          <a href="#mercados">
            <Icon name="trend" size={17} /> Mercados EE. UU.
          </a>
          <a href="#como-funciona">
            <Icon name="exchange" size={17} /> Cómo Funciona
          </a>
          <a href="#seguridad">
            <Icon name="shield" size={17} /> Seguridad &amp; Confianza
          </a>
          <div className={styles.mobileAccount}>
            {user ? (
              <Link href="/dashboard" className={styles.primaryButton}>
                Ir al Dashboard (
                {user.first_names.split(' ')[0] ?? 'Inversionista'})
              </Link>
            ) : (
              <>
                <Link href="/login" className={styles.loginButton}>
                  Iniciar sesión
                </Link>
                <Link href="/registro" className={styles.primaryButton}>
                  Abrir cuenta de práctica
                </Link>
              </>
            )}
          </div>
        </nav>
        <div className={styles.headerActions}>
          <span className={styles.language} aria-label="Idioma: español">
            <Icon name="globe" size={16} /> ES
          </span>
          <button
            type="button"
            className={styles.themeButton}
            onClick={toggleTheme}
            aria-label="Cambiar tema de color"
          >
            <span className={styles.whenDark}>
              <Icon name="sun" size={16} /> Claro
            </span>
            <span className={styles.whenLight}>
              <Icon name="moon" size={16} /> Oscuro
            </span>
          </button>
          {user ? (
            <Link
              href="/dashboard"
              className={`${styles.primaryButton} ${styles.headerCta}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span>Ir al Dashboard</span>
              <Icon name="arrow" size={17} />
            </Link>
          ) : (
            <>
              <Link href="/login" className={styles.loginButton}>
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className={`${styles.primaryButton} ${styles.headerCta}`}
              >
                Abrir cuenta de práctica <Icon name="arrow" size={17} />
              </Link>
            </>
          )}
          <button
            type="button"
            className={`${styles.iconButton} ${styles.menuButton}`}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
