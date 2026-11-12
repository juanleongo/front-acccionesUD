import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import styles from '../landing.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.container}>
        <p className={styles.heroBadge}>
          Acciones UD Trading · Mercados Bursátiles de Estados Unidos
        </p>
        <h1 id="hero-title">
          De tener curiosidad por la bolsa a operar en los{' '}
          <span>mercados de EE. UU.</span>
        </h1>
        <p className={styles.heroDescription}>
          Simulación bursátil profesional en tiempo real para operar en Wall
          Street con cotizaciones oficiales y cero riesgo de capital.
        </p>
        <div className={styles.heroActions}>
          <Link href="/markets" className={styles.primaryButton}>
            Explorar mercados
          </Link>
          <a href="#comisionistas" className={styles.secondaryButton}>
            Conocer Comisionistas <Icon name="users" size={18} />
          </a>
        </div>
        <ul className={styles.trustList}>
          <li>
            <Icon name="check" size={16} /> Sin depósito mínimo inicial
          </li>
          <li>
            <Icon name="bolt" size={16} /> Ejecución de órdenes en tiempo real
          </li>
          <li>
            <Icon name="shield" size={16} /> Cuentas segregadas y protegidas
          </li>
        </ul>
      </div>
    </section>
  );
}

const benefits: {
  icon: IconName;
  title: string;
  description: string;
  label: string;
  value: string;
  id?: string;
}[] = [
  {
    icon: 'coin',
    title: 'Depósitos en tu moneda local',
    description:
      'Deposite en pesos colombianos (COP) y convierta automáticamente a dólares (USD) para operar en Wall Street sin fricción ni recargos opacos.',
    label: 'Tasa TRM oficial',
    value: 'COP → USD',
  },
  {
    icon: 'pie',
    title: 'Comisiones claras y justas',
    description:
      '2.0% paramétrico controlado por el Administrador (split transparente 60% plataforma / 40% comisionista). Cero comisiones ocultas.',
    label: 'División reglada',
    value: '60 / 40 split',
  },
  {
    icon: 'exchange',
    title: 'Órdenes a tu medida en EE. UU.',
    description:
      'Market, Limit, Stop Loss y Take Profit ejecutadas en tiempo real en NYSE y NASDAQ o encoladas para la siguiente apertura en Nueva York.',
    label: 'Motor de ejecución',
    value: 'Wall Street en vivo',
  },
  {
    icon: 'star',
    title: 'Comisionistas calificados',
    description:
      'Asesores bursátiles con reputación pública, estrellas de calificación (★ 4.9) y propuestas de inversión directas en acciones estadounidenses.',
    label: 'Calificación pública',
    value: '★ 4.9 rating',
  },
];

export function Benefits() {
  return (
    <section className={styles.benefits} aria-labelledby="benefits-title">
      <div className={styles.container}>
        <p className={styles.eyebrow}>Nuestras ventajas de inversión</p>
        <h2 id="benefits-title" className={styles.sectionTitle}>
          ¿Por qué operar con Acciones UD?
        </h2>
        <div className={styles.cardGrid}>
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              id={benefit.id}
              className={styles.benefitCard}
            >
              <span className={styles.cardIcon}>
                <Icon name={benefit.icon} size={26} />
              </span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
              <div className={styles.cardMeta}>
                <span>{benefit.label}</span>
                <span>{benefit.value}</span>
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
  description: string;
  label: string;
  value: string;
}[] = [
  {
    icon: 'user',
    title: 'Crea tu cuenta de trading',
    description:
      'Registro seguro y confidencial con verificación MFA de dos factores y credenciales de acceso protegidas.',
    label: 'Estado: activo inmediato',
    value: '',
  },
  {
    icon: 'wallet',
    title: 'Fondea tu cuenta sandbox',
    description:
      'Asignación inmediata de saldo virtual inicial ($100,000 USD) para paper trading en bolsas de EE. UU. sin arriesgar capital real.',
    label: 'Balance ficticio',
    value: '$100,000 USD',
  },
  {
    icon: 'users',
    title: 'Conéctate con comisionistas',
    description:
      'Recibe propuestas de inversión fundamentadas de asesores SCB certificados o analiza el mercado estadounidense con gráficos en vivo.',
    label: 'Asesoría auditada',
    value: 'Verificado SCB',
  },
  {
    icon: 'devices',
    title: 'Opera donde y cuando quieras',
    description:
      'Plataforma 100% responsiva para ejecutar órdenes en NYSE, NASDAQ y NYSE Arca desde cualquier dispositivo.',
    label: 'US Exchanges',
    value: 'NYSE · NASDAQ',
  },
];

export function GettingStarted() {
  return (
    <section
      id="como-funciona"
      className={styles.steps}
      aria-labelledby="steps-title"
    >
      <div className={styles.container}>
        <div className={styles.centeredHeading}>
          <h2 id="steps-title" className={styles.sectionTitle}>
            Menos pasos. Más inversión.
          </h2>
          <p>
            Comience su trayectoria en los mercados bursátiles de Estados Unidos
            en menos de 3 minutos.
          </p>
        </div>
        <ol className={styles.cardGrid}>
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={`${styles.stepCard} ${index === 0 ? styles.highlightCard : ''}`}
            >
              <div className={styles.stepTop}>
                <span>Paso 0{index + 1}</span>
                <Icon name={step.icon} size={19} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <div className={styles.cardMeta}>
                <span>{step.label}</span>
                <strong>{step.value}</strong>
              </div>
              {index === 0 && (
                <span className={styles.stepWatermark} aria-hidden="true">
                  01
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Security() {
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
              Seguridad y protección de datos
            </p>
            <h2 id="security-title">
              Tu tranquilidad es lo primero: tecnología y respaldo de nivel
              corporativo
            </h2>
            <p className={styles.securityDescription}>
              Tus datos personales, tus fondos de simulación en dólares y cada
              orden bursátil están protegidos las 24 horas. Disfruta de acceso
              seguro con autenticación en dos pasos (código en tu celular),
              información encriptada y el respaldo corporativo de Acciones UD
              para que aprendas a invertir en Estados Unidos con total
              confianza.
            </p>
          </div>
        </div>
        <ul className={styles.securityBadges}>
          <li>
            <span className={styles.dot} /> Acceso seguro en 2 pasos (2FA)
          </li>
          <li>
            <Icon name="lock" size={15} /> Datos encriptados 24/7
          </li>
          <li>
            <Icon name="shield" size={15} /> Seguridad y respaldo financiero
          </li>
        </ul>
      </div>
    </section>
  );
}
