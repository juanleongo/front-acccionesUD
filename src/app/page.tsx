import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <section className={styles.panel} aria-labelledby="title">
        <p className={styles.eyebrow}>Aplicación frontend</p>
        <h1 id="title">Acciones UD</h1>
        <p>La infraestructura inicial está preparada.</p>
      </section>
    </main>
  );
}
