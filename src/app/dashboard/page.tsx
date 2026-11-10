import type { Metadata } from 'next';
import { Dashboard } from '@/features/dashboard';
export const metadata: Metadata = {
  title: 'Dashboard | Acciones UD',
  description: 'Resumen de cuenta y mercados de Acciones UD. Vista previa.',
};
export default function DashboardPage() {
  return <Dashboard />;
}
