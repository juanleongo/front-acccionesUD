'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import styles from '../landing.module.css';

export function Brand() {
  return (
    <a href="#inicio" className={styles.brand} aria-label="Acciones UD, inicio">
      <span className={styles.monogram}>
        <span>U</span>
        <span>D</span>
      </span>
      <span>Acciones UD</span>
    </a>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link href="/markets">
            <Icon name="trend" size={17} /> Mercados
          </Link>
          <a href="#como-funciona">
            <Icon name="exchange" size={17} /> Cómo Funciona
          </a>
          <a href="#seguridad">
            <Icon name="shield" size={17} /> Seguridad &amp; Confianza
          </a>
          <div className={styles.mobileAccount}>
            <Link href="/login" className={styles.loginButton}>
              Iniciar sesión
            </Link>
            <Link href="/registro" className={styles.primaryButton}>
              Abrir cuenta de práctica
            </Link>
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
          <Link href="/login" className={styles.loginButton}>
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className={`${styles.primaryButton} ${styles.headerCta}`}
          >
            Abrir cuenta de práctica <Icon name="arrow" size={17} />
          </Link>
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
