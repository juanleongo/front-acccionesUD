import type { Metadata } from 'next';
import { LoginForm } from '@/features/login';

export const metadata: Metadata = {
  title: 'Iniciar sesión | Acciones UD',
  description:
    'Acceso seguro con verificación en dos pasos (2FA) para inversionistas, comisionistas y administradores de Acciones UD.',
};

export default function Page() {
  return <LoginForm />;
}
