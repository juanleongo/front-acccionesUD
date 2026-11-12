import Link from 'next/link';
import { Brand } from './Header';
import styles from '../landing.module.css';
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerBottom}>
          <Brand />
          <nav aria-label="Enlaces del pie">
            <Link href="/markets">Mercados</Link> ·{' '}
            <Link href="/dashboard">Dashboard</Link> ·{' '}
            <Link href="/registro">Registro</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
