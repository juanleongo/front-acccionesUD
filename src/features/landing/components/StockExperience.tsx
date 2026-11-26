'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import landing from '../landing.module.css';
import styles from '../visual-landing.module.css';

export function StockExperience() {
  const { tx } = useLocale();
  const features = [
    {
      value: 'USD',
      icon: 'globe' as const,
      title: tx('Empresas de Estados Unidos', 'U.S. companies'),
      text: tx(
        'Explora acciones por empresa y bolsa.',
        'Explore stocks by company and exchange.',
      ),
    },
    {
      value: '2FA',
      icon: 'shield' as const,
      title: tx('Tu acceso, protegido', 'Your access, protected'),
      text: tx(
        'Una segunda verificación para entrar a tu cuenta.',
        'A second verification step to access your account.',
      ),
    },
    {
      value: tx('A tu ritmo', 'Your pace'),
      icon: 'trend' as const,
      title: tx('Decisiones con contexto', 'Decisions with context'),
      text: tx(
        'Gráficos, históricos y herramientas para aprender.',
        'Charts, price history and tools to learn.',
      ),
    },
    {
      value: tx('Contigo', 'With you'),
      icon: 'users' as const,
      title: tx('Acompañamiento profesional', 'Professional guidance'),
      text: tx(
        'Encuentra un comisionista y revisa sus propuestas.',
        'Find a broker and review their proposals.',
      ),
    },
  ];
  return (
    <section
      className={`${landing.container} ${styles.stockSection}`}
      aria-labelledby="stocks-title"
    >
      <div className={styles.stockIntro}>
        <span className={landing.eyebrow}>
          {tx(
            'Solo acciones. Más posibilidades.',
            'Just stocks. More possibilities.',
          )}
        </span>
        <h2 id="stocks-title">
          {tx('Entender el mercado', 'Understand the market')}
          <br />
          <span>
            {tx('cambia tu perspectiva.', 'change your perspective.')}
          </span>
        </h2>
        <p>
          {tx(
            'De una empresa que te interesa a una decisión que entiendes. Reúne exploración, análisis y práctica en un mismo lugar.',
            'From a company that interests you to a decision you understand. Bring exploration, analysis and practice together in one place.',
          )}
        </p>
        <Link href="#mercados" className={styles.textLink}>
          {tx('Descubrir acciones', 'Discover stocks')}
          <Icon name="arrow" size={19} />
        </Link>
        <div className={styles.stockVisual} aria-hidden="true">
          <span className={styles.bigArrow}>↗</span>
          <span className={styles.stockWord}>
            Acciones<span>UD</span>
          </span>
          <div className={styles.visualLines}>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      <div className={styles.featureGrid}>
        {features.map((feature) => (
          <article key={feature.value} className={styles.featureCard}>
            <div className={styles.featureTop}>
              <span>{feature.value}</span>
              <Icon name={feature.icon} size={25} />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
