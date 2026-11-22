'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import styles from '../landing.module.css';

export function Hero() {
  const { tx } = useLocale();
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.container}>
        <p className={styles.heroBadge}>
          {tx(
            'Acciones UD Trading · Mercados Bursátiles de Estados Unidos',
            'Acciones UD Trading · U.S. Stock Markets',
          )}
        </p>
        <h1 id="hero-title" className={styles.heroTitle}>
          {tx(
            'De tener curiosidad por la bolsa a operar en los ',
            'From stock market curiosity to trading in ',
          )}
          <span>{tx('mercados de EE. UU.', 'U.S. markets')}</span>
        </h1>
        <p className={styles.heroDescription}>
          {tx(
            'Simulación bursátil profesional en tiempo real para operar en Wall Street con cotizaciones oficiales y cero riesgo de capital.',
            'Real-time professional stock trading simulation on Wall Street with live quotes and zero capital risk.',
          )}
        </p>
        <div className={styles.heroActions}>
          <Link href="/login" className={styles.primaryButton}>
            {tx('Explorar mercados', 'Explore markets')}
          </Link>
          <a href="#comisionistas" className={styles.secondaryButton}>
            {tx('Conocer Comisionistas', 'Meet Brokers')}{' '}
            <Icon name="users" size={18} />
          </a>
        </div>
        <ul className={styles.trustList}>
          <li>
            <Icon name="check" size={16} />{' '}
            {tx('Sin depósito mínimo inicial', 'No minimum initial deposit')}
          </li>
          <li>
            <Icon name="bolt" size={16} />{' '}
            {tx(
              'Ejecución de órdenes en tiempo real',
              'Real-time order execution',
            )}
          </li>
          <li>
            <Icon name="shield" size={16} />{' '}
            {tx(
              'Cuentas segregadas y protegidas',
              'Segregated & protected accounts',
            )}
          </li>
        </ul>
      </div>
    </section>
  );
}

const benefits: {
  icon: IconName;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  label: string;
  labelEn: string;
  value: string;
  valueEn: string;
  id?: string;
}[] = [
  {
    icon: 'coin',
    title: 'Depósitos en tu moneda local',
    titleEn: 'Local currency deposits',
    description:
      'Deposite en pesos colombianos (COP) y convierta automáticamente a dólares (USD) para operar en Wall Street sin fricción ni recargos opacos.',
    descriptionEn:
      'Deposit in Colombian pesos (COP) and automatically convert to USD to trade on Wall Street without friction or hidden fees.',
    label: 'Tasa TRM oficial',
    labelEn: 'Official FX rate',
    value: 'COP → USD',
    valueEn: 'COP → USD',
  },
  {
    icon: 'pie',
    title: 'Comisiones claras y justas',
    titleEn: 'Clear and fair commissions',
    description:
      '2.0% paramétrico controlado por el Administrador (split transparente 60% plataforma / 40% comisionista). Cero comisiones ocultas.',
    descriptionEn:
      'Admin-controlled 2.0% rate (transparent 60% platform / 40% broker split). Zero hidden charges.',
    label: 'División reglada',
    labelEn: 'Transparent split',
    value: '60 / 40 split',
    valueEn: '60 / 40 split',
  },
  {
    icon: 'exchange',
    title: 'Órdenes a tu medida en EE. UU.',
    titleEn: 'Custom U.S. order types',
    description:
      'Market, Limit, Stop Loss y Take Profit ejecutadas en tiempo real en NYSE y NASDAQ o encoladas para la siguiente apertura en Nueva York.',
    descriptionEn:
      'Market, Limit, Stop Loss, and Take Profit orders executed live on NYSE and NASDAQ or queued for the next New York open.',
    label: 'Motor de ejecución',
    labelEn: 'Execution engine',
    value: 'Wall Street en vivo',
    valueEn: 'Wall Street Live',
  },
  {
    icon: 'star',
    title: 'Comisionistas calificados',
    titleEn: 'Certified licensed brokers',
    description:
      'Asesores bursátiles con reputación pública, estrellas de calificación (★ 4.9) y propuestas de inversión directas en acciones estadounidenses.',
    descriptionEn:
      'Stock advisors with public reputation ratings (★ 4.9) delivering direct investment proposals in U.S. equities.',
    label: 'Calificación pública',
    labelEn: 'Public rating',
    value: '★ 4.9 rating',
    valueEn: '★ 4.9 rating',
  },
];

export function Benefits() {
  const { locale, tx } = useLocale();
  return (
    <section className={styles.benefits} aria-labelledby="benefits-title">
      <div className={styles.container}>
        <p className={styles.eyebrow}>
          {tx('Nuestras ventajas de inversión', 'Our investment advantages')}
        </p>
        <h2 id="benefits-title" className={styles.sectionTitle}>
          {tx(
            '¿Por qué operar con Acciones UD?',
            'Why trade with Acciones UD?',
          )}
        </h2>
        <div className={`${styles.cardGrid} ${styles.benefitsGrid}`}>
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              id={benefit.id}
              className={styles.benefitCard}
            >
              <span className={styles.cardIcon}>
                <Icon name={benefit.icon} size={26} />
              </span>
              <h3 className={styles.cardTitle}>
                {locale === 'en' ? benefit.titleEn : benefit.title}
              </h3>
              <p className={styles.cardDescription}>
                {locale === 'en' ? benefit.descriptionEn : benefit.description}
              </p>
              <div className={styles.cardMeta}>
                <span>{locale === 'en' ? benefit.labelEn : benefit.label}</span>
                <span>{locale === 'en' ? benefit.valueEn : benefit.value}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps: {
  icon: IconName;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  label: string;
  labelEn: string;
  value: string;
  valueEn: string;
}[] = [
  {
    icon: 'user',
    title: 'Crea tu cuenta de trading',
    titleEn: 'Create your trading account',
    description:
      'Registro seguro y confidencial con verificación MFA de dos factores y credenciales de acceso protegidas.',
    descriptionEn:
      'Secure registration with two-factor MFA verification and protected login credentials.',
    label: 'Estado: activo inmediato',
    labelEn: 'Status: instant activation',
    value: '',
    valueEn: '',
  },
  {
    icon: 'wallet',
    title: 'Fondea tu cuenta sandbox',
    titleEn: 'Fund your sandbox account',
    description:
      'Asignación inmediata de saldo virtual inicial ($100,000 USD) para paper trading en bolsas de EE. UU. sin arriesgar capital real.',
    descriptionEn:
      'Simulated USD funding and transfers to practice Wall Street investing without risking real capital.',
    label: 'Balance ficticio',
    labelEn: 'Paper balance',
    value: '$100,000 USD',
    valueEn: '$100,000 USD',
  },
  {
    icon: 'users',
    title: 'Conéctate con comisionistas',
    titleEn: 'Connect with licensed brokers',
    description:
      'Recibe propuestas de inversión fundamentadas de asesores SCB certificados o analiza el mercado estadounidense con gráficos en vivo.',
    descriptionEn:
      'Receive research-backed investment proposals from certified brokers or analyze U.S. markets with live charts.',
    label: 'Asesoría auditada',
    labelEn: 'Audited advisory',
    value: 'Verificado SCB',
    valueEn: 'SCB Verified',
  },
  {
    icon: 'devices',
    title: 'Opera donde y cuando quieras',
    titleEn: 'Trade anywhere, anytime',
    description:
      'Plataforma 100% responsiva para ejecutar órdenes en NYSE, NASDAQ y NYSE Arca desde cualquier dispositivo.',
    descriptionEn:
      'Fully responsive platform to place orders across NYSE, NASDAQ, and NYSE Arca from any device.',
    label: 'US Exchanges',
    labelEn: 'US Exchanges',
    value: 'NYSE · NASDAQ',
    valueEn: 'NYSE · NASDAQ',
  },
];

export function GettingStarted() {
  const { locale, tx } = useLocale();
  return (
    <section
      id="como-funciona"
      className={styles.steps}
      aria-labelledby="steps-title"
    >
      <div className={styles.container}>
        <div className={styles.centeredHeading}>
          <p className={styles.eyebrow}>
            {tx('Tu recorrido, paso a paso', 'Your journey, step by step')}
          </p>
          <h2 id="steps-title" className={styles.sectionTitle}>
            {tx('Menos pasos. Más inversión.', 'Fewer steps. More investing.')}
          </h2>
          <p className={styles.centeredSubtitle}>
            {tx(
              'Comience su trayectoria en los mercados bursátiles de Estados Unidos en menos de 3 minutos.',
              'Start your journey in U.S. stock markets in less than 3 minutes.',
            )}
          </p>
        </div>
        <ol className={styles.cardGrid}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.stepCard}>
              <div className={styles.stepTop}>
                <span>{tx(`Paso 0${index + 1}`, `Step 0${index + 1}`)}</span>
                <Icon name={step.icon} size={19} />
              </div>
              <h3 className={styles.cardTitle}>
                {locale === 'en' ? step.titleEn : step.title}
              </h3>
              <p className={styles.cardDescription}>
                {locale === 'en' ? step.descriptionEn : step.description}
              </p>
              <div className={styles.cardMeta}>
                <span>{locale === 'en' ? step.labelEn : step.label}</span>
                <strong>{locale === 'en' ? step.valueEn : step.value}</strong>
              </div>
              {
                <span className={styles.stepWatermark} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              }
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Security() {
  const { tx } = useLocale();
  return (
    <section
      id="seguridad"
      className={`${styles.container} ${styles.securitySection}`}
      aria-labelledby="security-title"
    >
      <div className={styles.securityPanel}>
        <div className={styles.securityIntro}>
          <span className={styles.shieldIcon}>
            <Icon name="shield" size={30} />
          </span>
          <div>
            <p className={styles.securityBadge}>
              {tx(
                'Seguridad y protección de datos',
                'Security & data protection',
              )}
            </p>
            <h2 id="security-title" className={styles.securityTitle}>
              {tx(
                'Tu tranquilidad es lo primero: tecnología y respaldo de nivel corporativo',
                'Your peace of mind comes first: enterprise-grade technology and security',
              )}
            </h2>
            <p className={styles.securityDescription}>
              {tx(
                'Tus datos personales, tus fondos de simulación en dólares y cada orden bursátil están protegidos las 24 horas. Disfruta de acceso seguro con autenticación en dos pasos (código en tu celular), información encriptada y el respaldo corporativo de Acciones UD para que aprendas a invertir en Estados Unidos con total confianza.',
                'Your personal details, USD simulation funds, and every stock order are protected 24/7. Enjoy two-factor authentication, encrypted data, and the institutional backing of Acciones UD so you can learn to invest in U.S. markets with confidence.',
              )}
            </p>
          </div>
        </div>
        <ul className={styles.securityBadges}>
          <li>
            <span className={styles.dot} />{' '}
            {tx(
              'Acceso seguro en 2 pasos (2FA)',
              'Secure 2-step authentication (2FA)',
            )}
          </li>
          <li>
            <Icon name="lock" size={15} />{' '}
            {tx('Datos encriptados 24/7', 'Encrypted data 24/7')}
          </li>
          <li>
            <Icon name="shield" size={15} />{' '}
            {tx(
              'Seguridad y respaldo financiero',
              'Financial security & safeguards',
            )}
          </li>
        </ul>
      </div>
    </section>
  );
}
