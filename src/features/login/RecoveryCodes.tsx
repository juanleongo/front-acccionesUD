'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

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

export function DashboardRecoveryCodes() {
  const { codes, setCodes } = usePendingCodes();
  if (!codes?.length) return null;
  return (
    <section aria-labelledby="recovery-heading">
      <h2 id="recovery-heading">Guarda tus códigos de recuperación</h2>
      <p>
        Cada código permite un acceso. Cópialos antes de salir de esta página.
      </p>
      <ul>
        {codes.map((code) => (
          <li key={code}>
            <code>{code}</code>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setCodes(null)}>
        Ya guardé los códigos
      </button>
    </section>
  );
}
