// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { setAppLocale } from '@/lib/i18n';
import { updatePersonalProfile, type UserProfile } from '../user-api';
import { PersonalProfileForm } from './PersonalProfileForm';
vi.mock('../user-api', () => ({ updatePersonalProfile: vi.fn() }));
const user = {
  first_names: 'Daniel',
  last_names: 'Sanabria',
  phone: '+573001234567',
  country: 'CO',
} as UserProfile;
beforeEach(() => {
  setAppLocale('es');
  vi.clearAllMocks();
});
it('envía solo los datos modificados y normaliza el nombre antes de guardarlo', async () => {
  vi.mocked(updatePersonalProfile).mockResolvedValue({
    ...user,
    first_names: 'Dante',
  });
  const saved = vi.fn();
  render(<PersonalProfileForm user={user} locked={false} onSaved={saved} />);
  fireEvent.change(screen.getByLabelText('Nombres'), {
    target: { value: '  DANTE ' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar datos personales' }),
  );
  await waitFor(() =>
    expect(updatePersonalProfile).toHaveBeenCalledWith({
      first_names: 'Dante',
    }),
  );
  expect(await screen.findByText('Datos personales guardados.')).toBeVisible();
  expect(saved).toHaveBeenCalledOnce();
});
it('respeta el bloqueo del servidor sin simular un guardado exitoso', async () => {
  vi.mocked(updatePersonalProfile).mockRejectedValue(
    new ApiError('http', 'Locked', { status: 409, code: 'PROFILE_KYC_LOCKED' }),
  );
  render(<PersonalProfileForm user={user} locked={false} onSaved={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Nombres'), {
    target: { value: 'Dante' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Guardar datos personales' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'La verificación de identidad ya comenzó',
  );
  expect(screen.getByLabelText('Nombres')).toBeDisabled();
  expect(
    screen.queryByText('Datos personales guardados.'),
  ).not.toBeInTheDocument();
});
