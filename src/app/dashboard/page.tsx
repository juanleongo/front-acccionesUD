import type { Metadata } from 'next';
import { Dashboard } from '@/features/dashboard';
export const metadata: Metadata = {
  title: 'Dashboard | Acciones UD',
  description: 'Panel de mercados de Acciones UD.',
};
export default function DashboardPage() {
  return <Dashboard />;
}
