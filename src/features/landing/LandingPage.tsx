import { Header } from './components/Header';
import { GettingStarted, Hero, Security } from './components/OverviewSections';
import { Footer } from './components/Footer';
import styles from './landing.module.css';

export function LandingPage() {
  return (
    <div id="inicio" className={styles.landing}>
      <a href="#contenido" className={styles.skipLink}>
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido">
        <Hero />
        <GettingStarted />
        <Security />
      </main>
      <Footer />
    </div>
  );
}
