import { AdminPanel } from '@/features/admin';

export const metadata = {
  title: 'Panel de Administración | Acciones UD',
  description:
    'Portal de control y administración RBAC, validación de comisionistas AMV y supervisión de mercados de Wall Street.',
};

export default function AdminPage() {
  return <AdminPanel />;
}
