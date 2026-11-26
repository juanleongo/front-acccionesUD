'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import landing from '../landing.module.css';
import styles from '../visual-landing.module.css';

export function Hero() {
  const { tx } = useLocale();
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.photo} aria-hidden="true">
        <Image
          src="/images/landing/market-life.webp"
          alt=""
          fill
          sizes="(max-width: 768px) 1400px, (min-width: 1920px) 1920px, 100vw"
          preload
          className={styles.heroImage}
        />
      </div>
      <div className={styles.scrim} aria-hidden="true" />
      <div className={`${landing.container} ${styles.heroContent}`}>
        <div className={styles.heroCopy}>
          <p className={styles.photoEyebrow}>
            <span />
            {tx('Tu curiosidad tiene futuro', 'Your curiosity has a future')}
          </p>
          <h1 id="hero-title">
            {tx('Tu próxima decisión', 'Your next decision')}
            <br />
            <em>{tx('empieza aquí.', 'starts here.')}</em>
          </h1>
          <p className={styles.heroDescription}>
            {tx(
              'Acércate a las empresas que mueven el mundo. Aprende a invertir en acciones de Estados Unidos, a tu ritmo y sin arriesgar capital real.',
              'Get closer to the companies moving the world. Learn to invest in U.S. stocks at your own pace, without risking real capital.',
            )}
          </p>
          <div className={styles.heroActions}>
            <Link href="/login" className={landing.primaryButton}>
              {tx('Explorar mercados', 'Explore markets')}
              <Icon name="arrow" size={19} />
            </Link>
            <Link href="/registro" className={styles.photoButton}>
              {tx('Crear mi cuenta', 'Create my account')}
            </Link>
          </div>
          <p className={styles.heroDisclaimer}>
            <Icon name="shield" size={16} />
            {tx(
              'Empresas reales. Un entorno de práctica.',
              'Real companies. A practice environment.',
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
