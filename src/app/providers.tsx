'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/api/query-client';
import { LocaleProvider } from '@/lib/i18n';
import { applyTheme, getStoredTheme, subscribeThemeStorage } from '@/lib/theme';
import { RecoveryCodesProvider } from '@/features/login/client';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    const saved = getStoredTheme();
    if (saved) applyTheme(saved, false);
    return subscribeThemeStorage((next) => applyTheme(next, false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <RecoveryCodesProvider>{children}</RecoveryCodesProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
