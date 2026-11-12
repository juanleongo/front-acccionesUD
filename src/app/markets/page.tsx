import Link from 'next/link';
import { Markets } from '@/features/markets';
export const metadata = { title: 'Mercados | Acciones UD' };
export default function MarketsPage() {
  return (
    <main style={{ maxWidth: '65rem', margin: 'auto', padding: '1.5rem' }}>
      <Link href="/dashboard">← Dashboard</Link>
      <h1>Explorador de mercados</h1>
      <Markets />
    </main>
  );
}
