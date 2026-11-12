'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import styles from './login.module.css';

const PendingCodes = createContext<{
  codes: string[] | null;
  setCodes: (codes: string[] | null) => void;
} | null>(null);

export function RecoveryCodesProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [previousPath, setPreviousPath] = useState(path);
  const [codes, setCodes] = useState<string[] | null>(null);
  if (path !== previousPath) {
    setPreviousPath(path);
    if (path !== '/dashboard') setCodes(null);
  }
  return (
    <PendingCodes.Provider value={{ codes, setCodes }}>
      {children}
    </PendingCodes.Provider>
  );
}

export function usePendingCodes() {
  const ref = useContext(PendingCodes);
  if (!ref) throw new Error('RecoveryCodesProvider required');
  return ref;
}

export function RecoveryCodesDisplay({
  codes,
  onDismiss,
  dismissText = 'Ya guardé mis códigos',
}: {
  codes: string[];
  onDismiss?: () => void;
  dismissText?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    const text =
      `CÓDIGOS DE RECUPERACIÓN (2FA) - ACCIONES UD\n` +
      `Generados: ${new Date().toLocaleString()}\n\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function downloadBackup() {
    const content = `=============================================================
 ACCIONES UD · SIMULADOR BURSÁTIL DE ESTADOS UNIDOS (USD)
 CÓDIGOS DE RECUPERACIÓN DE EMERGENCIA (AUTENTICACIÓN 2FA)
=============================================================
Fecha de emisión: ${new Date().toLocaleString()}

INSTRUCCIONES DE SEGURIDAD:
1. Cada código de recuperación permite un único acceso en caso
   de extraviar tu aplicación de autenticación (Google Authenticator / Authy).
2. Una vez usado un código, queda invalidado automáticamente.
3. Guarda este archivo en un lugar seguro y protegido.
-------------------------------------------------------------
${codes.map((c, i) => `[ ${String(i + 1).padStart(2, '0')} ]  ${c}`).join('\n')}
=============================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acciones-ud-codigos-recuperacion-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className={styles.recoveryBanner}
      aria-labelledby="recovery-heading"
    >
      <div className={styles.recoveryHeader}>
        <div className={styles.recoveryIcon} aria-hidden="true">
          🛡️
        </div>
        <div className={styles.recoveryTitle}>
          <h2 id="recovery-heading">
            Guarda tus códigos de recuperación de emergencia
          </h2>
          <p>
            Estos códigos son tu única forma de recuperar el acceso a tu cuenta
            si pierdes tu celular. Cópialos o descarga un respaldo ahora.
          </p>
        </div>
      </div>

      <ul
        className={styles.recoveryGrid}
        aria-label="Lista de códigos de recuperación"
      >
        {codes.map((code, index) => (
          <li key={code} className={styles.recoveryItem}>
            <small>{index + 1}.</small>
            <code>{code}</code>
          </li>
        ))}
      </ul>

      <div className={styles.recoveryActions}>
        <button
          type="button"
          onClick={copyAll}
          className={styles.recoveryBtnAction}
        >
          {copied ? '✓ ¡Copiados al portapapeles!' : '📋 Copiar códigos'}
        </button>
        <button
          type="button"
          onClick={downloadBackup}
          className={styles.recoveryBtnAction}
        >
          ⬇ Descargar respaldo (.txt)
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={styles.recoveryBtnPrimary}
          >
            {dismissText}
          </button>
        )}
      </div>
    </section>
  );
}

export function DashboardRecoveryCodes() {
  const { codes, setCodes } = usePendingCodes();
  if (!codes?.length) return null;
  return (
    <RecoveryCodesDisplay codes={codes} onDismiss={() => setCodes(null)} />
  );
}
