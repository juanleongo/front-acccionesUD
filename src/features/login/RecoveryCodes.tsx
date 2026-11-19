'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import styles from './login.module.css';

const STORAGE_KEY = 'acciones_ud_pending_recovery_codes';
const CHANGE_EVENT = 'acciones_ud_recovery_codes_change';

let cachedRaw: string | null = null;
let cachedParsed: string[] | null = null;

function subscribeRecoveryStore(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getRecoverySnapshot(): string[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedParsed;
    cachedRaw = raw;
    if (!raw) {
      cachedParsed = null;
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    cachedParsed =
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === 'string') &&
      parsed.length > 0
        ? parsed
        : null;
    return cachedParsed;
  } catch {
    return null;
  }
}

function getRecoveryServerSnapshot(): string[] | null {
  return null;
}

const PendingCodes = createContext<{
  codes: string[] | null;
  setCodes: (codes: string[] | null) => void;
} | null>(null);

export function RecoveryCodesProvider({ children }: { children: ReactNode }) {
  const codes = useSyncExternalStore(
    subscribeRecoveryStore,
    getRecoverySnapshot,
    getRecoveryServerSnapshot,
  );

  const setCodes = useCallback((next: string[] | null) => {
    try {
      if (next && next.length > 0) {
        const serialized = JSON.stringify(next);
        sessionStorage.setItem(STORAGE_KEY, serialized);
        cachedRaw = serialized;
        cachedParsed = next;
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        cachedRaw = null;
        cachedParsed = null;
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      /* sessionStorage opcional */
    }
  }, []);

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
  dismissHref,
  dismissText = 'Continuar al panel',
}: {
  codes: string[];
  onDismiss?: () => void;
  dismissHref?: string;
  dismissText?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  async function copyAll() {
    const text =
      `CÓDIGOS DE RECUPERACIÓN (2FA) - ACCIONES UD\n` +
      `Generados: ${new Date().toLocaleString()}\n\n` +
      codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      /* Portapapeles opcional */
    }
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
    setDownloaded(true);
  }

  return (
    <section
      className={styles.recoveryBanner}
      aria-labelledby="recovery-heading"
    >
      <div className={styles.recoveryHeader}>
        <div className={styles.recoveryIcon} aria-hidden="true">
          <Icon name="shield" size={24} />
        </div>
        <div className={styles.recoveryTitle}>
          <span className={styles.recoveryBadge}>
            Último paso · Respaldo de acceso
          </span>
          <h2 id="recovery-heading">Guarda tus códigos de recuperación</h2>
          <p>
            Estos <strong>{codes.length} códigos de un solo uso</strong> son la
            forma de recuperar el acceso si pierdes tu autenticador. Esta
            pantalla permanecerá disponible hasta que pulses Continuar. Cópialos
            o descárgalos antes de continuar.
          </p>
        </div>
      </div>

      <ul
        className={styles.recoveryGrid}
        aria-label="Lista de códigos de recuperación"
      >
        {codes.map((code, index) => (
          <li key={code} className={styles.recoveryItem}>
            <small>{String(index + 1).padStart(2, '0')}.</small>
            <code>{code}</code>
          </li>
        ))}
      </ul>

      <p className={styles.backupHint}>
        Guárdalos en un lugar privado. Cada código se puede utilizar una sola
        vez.
      </p>
      <div className={styles.recoveryActions}>
        <button
          type="button"
          onClick={copyAll}
          className={styles.recoveryBtnAction}
        >
          <Icon name="file" size={16} />{' '}
          {copied ? 'Códigos copiados' : 'Copiar todos'}
        </button>
        <button
          type="button"
          onClick={downloadBackup}
          className={styles.recoveryBtnAction}
        >
          {downloaded
            ? '✓ Archivo .txt descargado'
            : 'Descargar respaldo (.txt)'}
        </button>
        {dismissHref ? (
          <Link
            href={dismissHref}
            onClick={() => onDismiss?.()}
            className={styles.recoveryBtnPrimary}
          >
            {dismissText}
          </Link>
        ) : onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className={styles.recoveryBtnPrimary}
          >
            {dismissText}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function DashboardRecoveryCodes() {
  const { codes, setCodes } = usePendingCodes();
  if (!codes?.length) return null;
  return (
    <div className={styles.recoveryOverlayWrapper}>
      <RecoveryCodesDisplay codes={codes} onDismiss={() => setCodes(null)} />
    </div>
  );
}
