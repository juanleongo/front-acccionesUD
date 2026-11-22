import type { Metadata } from 'next';
import { RegistrationForm } from '@/features/registration';

export const metadata: Metadata = {
  title: 'Registro de comisionista | Acciones UD',
  description:
    'Postula tu perfil profesional de comisionista bursátil en Acciones UD y gestiona propuestas de inversión en EE. UU.',
};

export default function Page() {
  return <RegistrationForm kind="broker" />;
}
