import type { Metadata } from 'next';
import { RegistrationForm } from '@/features/registration';

export const metadata: Metadata = {
  title: 'Registro de inversionista | Acciones UD',
  description:
    'Abre tu cuenta de práctica en Acciones UD para operar en mercados estadounidenses (NYSE y NASDAQ) con verificación KYC.',
};

export default function Page() {
  return <RegistrationForm kind="investor" />;
}
