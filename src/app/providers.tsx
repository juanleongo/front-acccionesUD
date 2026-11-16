'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/query-client';
import { RecoveryCodesProvider } from '@/features/login';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('acciones_ud_theme');
      if (saved === 'light' || saved === 'dark') {
        document.documentElement.dataset.theme = saved;
      }
    } catch {
      /* Preferencia opcional */
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RecoveryCodesProvider>{children}</RecoveryCodesProvider>
    </QueryClientProvider>
  );
}
