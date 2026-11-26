'use client';

import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import styles from '../landing.module.css';

export { Hero } from './Hero';
export { Benefits } from './CommissionSection';
export { Security } from './SecuritySection';

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
    label: 'Acceso protegido',
    labelEn: 'Protected access',
    value: '',
    valueEn: '',
  },
  {
    icon: 'wallet',
    title: 'Prepara tu cuenta de práctica',
    titleEn: 'Set up your practice account',
    description:
      'Completa la verificación de identidad y utiliza las opciones de fondos simulados disponibles en tu cuenta.',
    descriptionEn:
      'Complete identity verification and use the simulated funding options available in your account.',
    label: 'Balance ficticio',
    labelEn: 'Paper balance',
    value: 'USD',
    valueEn: 'USD',
  },
  {
    icon: 'users',
    title: 'Conéctate con comisionistas',
    titleEn: 'Connect with licensed brokers',
    description:
      'Recibe propuestas de inversión fundamentadas de comisionistas disponibles o analiza el mercado estadounidense con gráficos en vivo.',
    descriptionEn:
      'Receive research-backed investment proposals from brokers or analyze U.S. markets with live charts.',
    label: 'Asesoría auditada',
    labelEn: 'Audited advisory',
    value: 'Propuestas',
    valueEn: 'Proposals',
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
              'Abre tu cuenta, completa tu perfil y empieza a conocer el mercado con herramientas de práctica.',
              'Create your account, complete your profile and get to know the market with practice tools.',
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
