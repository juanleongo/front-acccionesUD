'use client';

import { useLocale } from '@/lib/i18n';
import landing from '../landing.module.css';
import styles from '../visual-landing.module.css';

export function Benefits() {
  const { tx } = useLocale();
  const cards = [
    {
      value: '2%',
      title: tx('Una comisión de referencia.', 'A reference commission.'),
      text: tx(
        'Conoce el costo estimado de tu operación antes de confirmarla. Información clara para decidir.',
        'Review the estimated cost of your order before confirming. Clear information to make decisions.',
      ),
    },
    {
      value: '60%',
      title: tx('Para la plataforma.', 'For the platform.'),
      text: tx(
        'Del total de la comisión, la participación de Acciones UD se presenta de forma transparente.',
        'The share of the total commission allocated to Acciones UD is presented transparently.',
      ),
    },
    {
      value: '40%',
      title: tx('Para tu comisionista.', 'For your broker.'),
      text: tx(
        'La participación del asesor también forma parte del desglose. Entiende cómo se distribuye cada comisión.',
        'The advisor share is also included in the breakdown. Understand how each commission is distributed.',
      ),
    },
  ];
  return (
    <section
      className={`${landing.container} ${styles.commissionSection}`}
      aria-labelledby="benefits-title"
    >
      <div className={styles.commissionIntro}>
        <span className={landing.eyebrow}>
          {tx('Claridad en cada decisión', 'Clarity in every decision')}
        </span>
        <h2 id="benefits-title">
          {tx('Las cuentas claras.', 'Clear costs.')}
          <br />
          {tx('Desde el principio.', 'From the start.')}
        </h2>
        <p>
          {tx(
            'Aprender también es entender lo que cuesta operar. Sin letra pequeña en el desglose de tu orden.',
            'Learning also means understanding trading costs. Review your order breakdown before you decide.',
          )}
        </p>
      </div>
      <div className={styles.commissionGrid}>
        {cards.map((card) => (
          <article className={styles.commissionCard} key={card.value}>
            <span className={styles.commissionValue}>{card.value}</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
      <p className={styles.commissionNote}>
        {tx(
          'El 60/40 corresponde a la distribución de la comisión, no a cargos adicionales. Revisa las condiciones y el importe definitivo en la vista previa de cada orden.',
          'The 60/40 split distributes the commission; these are not extra charges. Review the terms and final amount in each order preview.',
        )}
      </p>
    </section>
  );
}
