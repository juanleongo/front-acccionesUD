import { AdvisorsCarousel } from './components/AdvisorsCarousel';
import { Header } from './components/Header';
import { LandingActions } from './components/LandingActions';
import { MarketExplorer } from './components/MarketExplorer';
import {
  Benefits,
  GettingStarted,
  Hero,
  Security,
} from './components/OverviewSections';
import { Footer } from './components/Footer';
import { marketPreview } from './data/market-preview';
import styles from './landing.module.css';

export function LandingPage() {
  return (
    <LandingActions>
      <div id="inicio" className={styles.landing}>
        <a href="#contenido" className={styles.skipLink}>
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido">
          <Hero />
          <AdvisorsCarousel />
          <MarketExplorer assets={marketPreview} />
          <Benefits />
          <GettingStarted />
          <Security />
        </main>
        <Footer />
      </div>
    </LandingActions>
  );
}
