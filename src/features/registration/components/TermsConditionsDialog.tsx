'use client';

import type { RefObject } from 'react';
import styles from '../registration.module.css';

export interface TermsConditionsDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
}

export function TermsConditionsDialog({
  dialogRef,
}: TermsConditionsDialogProps) {
  return (
    <dialog ref={dialogRef} className={styles.termsDialog}>
      <h2>Términos y Condiciones · Acciones UD</h2>
      <p className={styles.termsIntroText}>
        Plataforma de simulación bursátil educativa en mercados de EE. UU.
        (NYSE, NASDAQ y NYSE Arca):
      </p>
      <ul className={styles.termsList}>
        <li>
          <strong>1. Naturaleza de Simulación (Paper Trading):</strong> Todos
          los fondos, saldos y órdenes operan en un entorno virtual de práctica
          y aprendizaje cuantitativo. No se captan recursos del público ni se
          compromete dinero real.
        </li>
        <li>
          <strong>
            2. Tratamiento de Datos (Habeas Data - Ley 1581 de 2012):
          </strong>{' '}
          Tu información personal (nombres, correo, teléfono y país) se almacena
          bajo estándares de cifrado y se usa exclusivamente para fines de
          autenticación, control de sesiones y trazabilidad académica en la
          Universidad Distrital Francisco José de Caldas.
        </li>
        <li>
          <strong>3. Autenticación en Dos Pasos (2FA / TOTP):</strong> Es
          obligatorio configurar un autenticador móvil basado en tiempo (TOTP de
          30 segundos) y resguardar los códigos de recuperación para la
          protección de tu cuenta.
        </li>
        <li>
          <strong>4. Datos de Mercado en Tiempo Real:</strong> Las cotizaciones
          e índices de Wall Street son provistos con fines didácticos para la
          toma de decisiones financieras simuladas.
        </li>
      </ul>
      <form method="dialog" className={styles.termsDialogActions}>
        <button type="submit" className={styles.termsAcceptBtn}>
          Entendido y cerrar
        </button>
      </form>
    </dialog>
  );
}
