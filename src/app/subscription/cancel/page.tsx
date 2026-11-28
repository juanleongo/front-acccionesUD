import Link from 'next/link';
import { PremiumPanel } from '@/features/premium';
export default function SubscriptionReturn() {
  return (
    <main style={{ padding: '1rem' }}>
      <Link href="/dashboard">Dashboard</Link>
      <PremiumPanel returnStatus="cancel" />
    </main>
  );
}
