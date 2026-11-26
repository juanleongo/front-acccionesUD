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
import { StockExperience } from './components/StockExperience';
import { DeviceShowcase } from './components/DeviceShowcase';
import styles from './landing.module.css';

export function LandingPage() {
  return (
    <LandingActions>
      <div id="inicio" className={styles.landing}>
        <Header />
        <main id="contenido">
          <Hero />
          <StockExperience />
          <AdvisorsCarousel />
          <MarketExplorer />
          <DeviceShowcase />
          <Benefits />
          <GettingStarted />
          <Security />
        </main>
        <Footer />
      </div>
    </LandingActions>
  );
}
