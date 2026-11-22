'use client';

import { useLocale } from '@/lib/i18n';
import styles from '../registration.module.css';

export interface RegistrationStepperProps {
  steps: readonly string[];
  step: number;
}

export function RegistrationStepper({ steps, step }: RegistrationStepperProps) {
  const { tx } = useLocale();
  return (
    <div
      className={styles.stepperCard}
      aria-label={tx('Pasos del registro', 'Registration steps')}
    >
      <p className={styles.srOnly} aria-live="polite">
        {tx('Paso', 'Step')} {step + 1} {tx('de', 'of')} {steps.length} ·{' '}
        {steps[step]}
      </p>
      <progress
        className={styles.srOnly}
        aria-label={tx('Progreso del registro', 'Registration progress')}
        value={step + 1}
        max={steps.length}
      />
      <ol className={styles.stepperList}>
        {steps.map((label, idx) => {
          const done = idx < step;
          const current = idx === step;
          return (
            <li
              key={label}
              className={`${styles.stepperItem} ${done ? styles.stepperItemDone : ''} ${current ? styles.stepperItemCurrent : ''}`}
            >
              <div className={styles.stepperTrackRow}>
                <span
                  className={`${styles.stepperLine} ${idx === 0 ? styles.stepperLineHidden : ''} ${idx <= step ? styles.stepperLineActive : ''}`}
                />
                <span className={styles.stepperCircle}>
                  {done ? '✓' : idx + 1}
                </span>
                <span
                  className={`${styles.stepperLine} ${idx === steps.length - 1 ? styles.stepperLineHidden : ''} ${idx < step ? styles.stepperLineActive : ''}`}
                />
              </div>
              <span className={styles.stepperLabel}>
                {idx + 1}. {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
