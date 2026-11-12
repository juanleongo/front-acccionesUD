import type { Metadata } from 'next';
import { Dashboard } from '@/features/dashboard';

export const metadata: Metadata = {
  title: 'Mercados en Vivo | Acciones UD',
  description:
    'Explorador bursátil en tiempo real de mercados de EE. UU. (NYSE, NASDAQ y AMEX).',
};

export default function MarketsPage() {
  return <Dashboard initialSection="markets" />;
}
