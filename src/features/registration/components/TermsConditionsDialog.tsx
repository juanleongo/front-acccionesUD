'use client';

import type { RefObject } from 'react';
import { useLocale } from '@/lib/i18n';
import styles from '../registration.module.css';

export interface TermsConditionsDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
}

export function TermsConditionsDialog({
  dialogRef,
}: TermsConditionsDialogProps) {
  const { tx } = useLocale();
  return (
    <dialog
      ref={dialogRef}
      className={styles.termsModal}
      aria-labelledby="terms-conditions-dialog-title"
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          dialogRef.current.close();
        }
      }}
    >
      <div className={styles.termsModalInner}>
        <header className={styles.termsModalHeader}>
          <div>
            <span className={styles.termsBadge}>
              {tx('Simulación & Privacidad', 'Simulation & Privacy')}
            </span>
            <h2
              id="terms-conditions-dialog-title"
              className={styles.termsTitle}
            >
              {tx(
                'Términos y Condiciones · Acciones UD',
                'Terms & Conditions · Acciones UD',
              )}
            </h2>
          </div>
          <button
            type="button"
            className={styles.termsCloseBtn}
            onClick={() => dialogRef.current?.close()}
            aria-label={tx('Cerrar términos', 'Close terms')}
          >
            ✕
          </button>
        </header>
        <div className={styles.termsBody}>
          <p className={styles.termsIntroText}>
            {tx(
              'Plataforma de simulación bursátil educativa en mercados de EE. UU. (NYSE, NASDAQ y NYSE Arca):',
              'Educational stock market simulation platform focused on U.S. equities (NYSE, NASDAQ, and NYSE Arca):',
            )}
          </p>
          <ul className={styles.termsList}>
            <li>
              <strong>
                {tx(
                  '1. Naturaleza de Simulación (Paper Trading):',
                  '1. Paper Trading Simulation:',
                )}
              </strong>{' '}
              {tx(
                'Todos los fondos, saldos y órdenes operan en un entorno virtual de práctica y aprendizaje cuantitativo. No se captan recursos del público ni se compromete dinero real.',
                'All funds, balances, and orders run inside a virtual simulation environment for learning. No real capital is deposited or placed at risk.',
              )}
            </li>
            <li>
              <strong>
                {tx(
                  '2. Tratamiento de Datos (Habeas Data - Ley 1581 de 2012):',
                  '2. Data Privacy & Protection (Law 1581 of 2012):',
                )}
              </strong>{' '}
              {tx(
                'Tu información personal (nombres, correo, teléfono y país) se almacena bajo estándares de cifrado y se usa exclusivamente para fines de autenticación, control de sesiones y trazabilidad académica en la Universidad Distrital Francisco José de Caldas.',
                'Your personal information (name, email, phone, and country) is encrypted and used strictly for authentication, session control, and academic auditing at Universidad Distrital Francisco José de Caldas.',
              )}
            </li>
            <li>
              <strong>
                {tx(
                  '3. Autenticación en Dos Pasos (2FA / TOTP):',
                  '3. Two-Factor Authentication (2FA / TOTP):',
                )}
              </strong>{' '}
              {tx(
                'Es obligatorio configurar un autenticador móvil basado en tiempo (TOTP de 30 segundos) y resguardar los códigos de recuperación para la protección de tu cuenta.',
                'Setting up a 30-second time-based authenticator app (TOTP) and safely storing your recovery codes is mandatory to protect your account.',
              )}
            </li>
            <li>
              <strong>
                {tx(
                  '4. Datos de Mercado en Tiempo Real:',
                  '4. Real-Time Market Quotes:',
                )}
              </strong>{' '}
              {tx(
                'Las cotizaciones e índices de Wall Street son provistos con fines didácticos para la toma de decisiones financieras simuladas.',
                'Wall Street prices and indices are provided for educational purposes to practice simulated investment decision-making.',
              )}
            </li>
          </ul>
        </div>
        <form method="dialog" className={styles.termsFooter}>
          <button type="submit" className={styles.primary}>
            {tx('Entendido y cerrar', 'Got it and close')}
          </button>
        </form>
      </div>
    </dialog>
  );
}
