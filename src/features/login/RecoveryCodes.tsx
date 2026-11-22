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
import { formatMarketDateTime } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
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
  dismissText,
}: {
  codes: string[];
  onDismiss?: () => void;
  dismissHref?: string;
  dismissText?: string;
}) {
  const { locale, tx } = useLocale();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const resolvedDismissText =
    dismissText ?? tx('Continuar al panel', 'Continue to dashboard');

  async function copyAll() {
    const text =
      tx(
        'CÓDIGOS DE RECUPERACIÓN (2FA) - ACCIONES UD\n',
        'RECOVERY CODES (2FA) - ACCIONES UD\n',
      ) +
      `${tx('Generados:', 'Generated:')} ${formatMarketDateTime(new Date(), locale)}\n\n` +
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
 ${tx('ACCIONES UD · SIMULADOR BURSÁTIL DE ESTADOS UNIDOS (USD)', 'ACCIONES UD · U.S. STOCK TRADING SIMULATOR (USD)')}
 ${tx('CÓDIGOS DE RECUPERACIÓN DE EMERGENCIA (AUTENTICACIÓN 2FA)', 'EMERGENCY RECOVERY CODES (2FA AUTHENTICATION)')}
=============================================================
${tx('Fecha de emisión:', 'Issued on:')} ${formatMarketDateTime(new Date(), locale)}

${tx('INSTRUCCIONES DE SEGURIDAD:', 'SECURITY INSTRUCTIONS:')}
1. ${tx('Cada código de recuperación permite un único acceso si pierdes tu app autenticadora.', 'Each recovery code grants single-use access if you lose your authenticator app.')}
2. ${tx('Una vez usado un código, queda invalidado automáticamente.', 'Once used, a code is automatically invalidated.')}
3. ${tx('Guarda este archivo en un lugar seguro y protegido.', 'Store this file in a safe and private place.')}
-------------------------------------------------------------
${codes.map((c, i) => `[ ${String(i + 1).padStart(2, '0')} ]  ${c}`).join('\n')}
=============================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acciones-ud-recovery-codes-${Date.now()}.txt`;
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
            {tx(
              'Último paso · Respaldo de acceso',
              'Final step · Access backup',
            )}
          </span>
          <h2 id="recovery-heading" className={styles.recoveryHeading}>
            {tx(
              'Guarda tus códigos de recuperación',
              'Save your recovery codes',
            )}
          </h2>
          <p className={styles.recoverySubtitle}>
            {tx('Estos ', 'These ')}
            <strong>
              {codes.length} {tx('códigos de un solo uso', 'single-use codes')}
            </strong>{' '}
            {tx(
              'son la forma de recuperar el acceso si pierdes tu autenticador. Esta pantalla permanecerá disponible hasta que pulses Continuar. Cópialos o descárgalos antes de continuar.',
              'let you regain access if you lose your authenticator app. This screen remains visible until you continue. Copy or download them now.',
            )}
          </p>
        </div>
      </div>

      <ul
        className={styles.recoveryGrid}
        aria-label={tx(
          'Lista de códigos de recuperación',
          'Recovery codes list',
        )}
      >
        {codes.map((code, index) => (
          <li key={code} className={styles.recoveryItem}>
            <small>{String(index + 1).padStart(2, '0')}.</small>
            <code>{code}</code>
          </li>
        ))}
      </ul>

      <p className={styles.backupHint}>
        {tx(
          'Guárdalos en un lugar privado. Cada código se puede utilizar una sola vez.',
          'Store them safely. Each code can only be used once.',
        )}
      </p>
      <div className={styles.recoveryActions}>
        <button
          type="button"
          onClick={copyAll}
          className={styles.recoveryBtnAction}
        >
          <Icon name="file" size={16} />{' '}
          {copied
            ? tx('Códigos copiados', 'Codes copied')
            : tx('Copiar todos', 'Copy all')}
        </button>
        <button
          type="button"
          onClick={downloadBackup}
          className={styles.recoveryBtnAction}
        >
          {downloaded
            ? tx('✓ Archivo .txt descargado', '✓ .txt file downloaded')
            : tx('Descargar respaldo (.txt)', 'Download backup (.txt)')}
        </button>
        {dismissHref ? (
          <Link
            href={dismissHref}
            onClick={() => onDismiss?.()}
            className={styles.recoveryBtnPrimary}
          >
            {resolvedDismissText}
          </Link>
        ) : onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className={styles.recoveryBtnPrimary}
          >
            {resolvedDismissText}
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
