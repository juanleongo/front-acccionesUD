import Link from 'next/link';
import styles from '../landing.module.css';
export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <h1>
          Explora los <span>mercados bursátiles</span>
        </h1>
        <p className={styles.heroDescription}>
          Consulta las bolsas disponibles, sus horarios y el calendario de
          negociación.
        </p>
        <div className={styles.heroActions}>
          <Link href="/markets" className={styles.primaryButton}>
            Explorar mercados
          </Link>
          <Link href="/registro" className={styles.secondaryButton}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}
export function GettingStarted() {
  return (
    <section id="como-funciona" className={styles.steps}>
      <div className={styles.container}>
        <h2>Cómo funciona</h2>
        <p>
          Registra tu cuenta, configura tu autenticador y consulta los mercados
          desde tu dashboard.
        </p>
      </div>
    </section>
  );
}
export function Security() {
  return (
    <section id="seguridad" className={styles.container}>
      <h2>Seguridad de la cuenta</h2>
      <p>
        Confirma tu acceso con el código de tu autenticador. Guarda tus códigos
        de recuperación para acceder si pierdes el dispositivo.
      </p>
    </section>
  );
}
