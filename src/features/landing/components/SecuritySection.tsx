'use client';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import landing from '../landing.module.css';
import styles from '../security.module.css';

export function Security() {
  const { tx } = useLocale();
  const safeguards: { icon: IconName; title: string; description: string }[] = [
    {
      icon: 'users',
      title: tx('Autorizaciones claras', 'Clear permissions'),
      description: tx(
        'Tú decides si tu comisionista puede operar y si sus órdenes requieren tu revisión.',
        'You decide whether your broker can trade and whether their orders require your review.',
      ),
    },
    {
      icon: 'file',
      title: tx('Tu actividad, a la vista', 'Your activity, in view'),
      description: tx(
        'Consulta el historial de órdenes, depósitos y retiros desde tu cuenta.',
        'Review your order, deposit and withdrawal history from your account.',
      ),
    },
    {
      icon: 'user',
      title: tx('Verificación de identidad', 'Identity verification'),
      description: tx(
        'Completa tus datos y consulta tu estado de verificación en Mi perfil y KYC.',
        'Complete your details and check your verification status in My profile & KYC.',
      ),
    },
  ];

  return (
    <section
      id="seguridad"
      className={`${landing.container} ${styles.section}`}
      aria-labelledby="security-title"
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.intro}>
            <p className={landing.eyebrow}>
              {tx('Seguridad y transparencia', 'Security & transparency')}
            </p>
            <h2 id="security-title" className={styles.title}>
              {tx('Tu cuenta, bajo tu control.', 'Your account. Your control.')}
            </h2>
            <p className={styles.description}>
              {tx(
                'Decide qué autorizas, consulta tus movimientos y conoce el alcance de tu cuenta de práctica.',
                'Choose what you authorize, review your activity and understand how your practice account works.',
              )}
            </p>
          </div>
          <span className={styles.emblem} aria-hidden="true">
            <Icon name="shield" size={38} />
          </span>
        </div>
        <ul className={styles.cards}>
          {safeguards.map((item) => (
            <li key={item.icon} className={styles.card}>
              <span className={styles.icon}>
                <Icon name={item.icon} size={23} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          <Icon name="info" size={17} />
          {tx(
            'Entorno de simulación: los fondos de práctica no representan dinero real.',
            'Simulation environment: practice funds do not represent real money.',
          )}
        </p>
      </div>
    </section>
  );
}
