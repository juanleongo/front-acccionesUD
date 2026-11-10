import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { UpcomingButton } from './LandingActions';
import styles from '../landing.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.container}>
        <p className={styles.heroBadge}>
          Acciones UD Global Trading · Mercados bursátiles internacionales
        </p>
        <h1 id="hero-title">
          De tener curiosidad por la bolsa a operar en los{' '}
          <span>mercados globales</span>
        </h1>
        <p className={styles.heroDescription}>
          Opere en tiempo real con inversión bursátil profesional en Nueva York,
          Londres y Tokio. Cero riesgo financiero con plataforma bursátil de
          Acciones UD.
        </p>
        <div className={styles.heroActions}>
          <UpcomingButton
            feature="Simulación bursátil"
            className={styles.primaryButton}
          >
            Comenzar Simulación Bursátil <Icon name="trend" size={18} />
          </UpcomingButton>
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
      'Deposite en pesos colombianos (COP) y convierta automáticamente a USD para operar en bolsa sin fricción ni recargos opacos.',
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
    title: 'Órdenes a tu medida',
    description:
      'Market, Limit, Stop Loss y Take Profit ejecutadas en tiempo real o encoladas para la siguiente sesión de apertura bursátil.',
    label: 'Motor de ejecución',
    value: 'Conexión en tiempo real',
  },
  {
    icon: 'star',
    title: 'Comisionistas calificados',
    description:
      'Asesores bursátiles con reputación pública, estrellas de calificación (★ 4.9) y propuestas de inversión directas aprobables en un clic.',
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
      'Asignación inmediata de saldo virtual inicial ($100,000 USD) para paper trading sin arriesgar capital real.',
    label: 'Balance ficticio',
    value: '$100,000 USD',
  },
  {
    icon: 'users',
    title: 'Conéctate con comisionistas',
    description:
      'Recibe propuestas de inversión fundamentadas de asesores SCB certificados o analiza con supergráficos.',
    label: 'Asesoría auditada',
    value: 'Verificado SCB',
  },
  {
    icon: 'devices',
    title: 'Opera donde y cuando quieras',
    description:
      'Plataforma 100% responsiva para ejecutar órdenes en Wall Street, Londres o Tokio desde cualquier dispositivo.',
    label: 'Global dispatch',
    value: 'Multi-exchange',
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
            Comience su trayectoria en los mercados bursátiles en menos de 3
            minutos.
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
              corporativo global
            </h2>
            <p className={styles.securityDescription}>
              Tus datos personales, tus fondos de simulación y cada orden
              bursátil están protegidos las 24 horas. Disfruta de acceso seguro
              con autenticación en dos pasos (código en tu celular o huella
              digital), información encriptada y el respaldo corporativo y
              fiduciario de Acciones UD para que aprendas a invertir con total
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
