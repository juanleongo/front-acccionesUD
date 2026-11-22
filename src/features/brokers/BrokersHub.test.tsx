// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { setAppLocale } from '@/lib/i18n';
import { BrokerAvatar } from './components/BrokerAvatar';
import { BrokersHub } from './BrokersHub';

beforeEach(() => {
  window.localStorage.clear();
  setAppLocale('es');
});

afterEach(() => {
  setAppLocale('es');
});

it('filtra el directorio de comisionistas, muestra contador y permite limpiar la búsqueda', () => {
  render(<BrokersHub />);

  fireEvent.click(
    screen.getByRole('tab', { name: /Directorio de Comisionistas/ }),
  );
  expect(screen.getByText('Mostrando 3 de 3 asesores')).toBeVisible();

  const searchInput = screen.getByRole('searchbox', {
    name: /Buscar comisionista/,
  });
  fireEvent.change(searchInput, { target: { value: 'Semiconductores' } });

  expect(screen.getByText('Mostrando 1 de 3 asesores')).toBeVisible();
  expect(screen.getByText('Carlos Andrés Rodríguez MSc.')).toBeInTheDocument();
  expect(screen.queryByText('Valentina Morales CFA')).not.toBeInTheDocument();

  fireEvent.change(searchInput, { target: { value: 'InexistenteXYZ' } });
  expect(
    screen.getByText('No encontramos comisionistas con ese criterio'),
  ).toBeVisible();

  fireEvent.click(
    screen.getByRole('button', { name: 'Mostrar todos los comisionistas' }),
  );
  expect(screen.getByText('Mostrando 3 de 3 asesores')).toBeVisible();
});

it('valida firma 2FA, chat noValidate y dispara onNavigateToOrder al aceptar propuesta', () => {
  const onNavigateToOrder = vi.fn();
  render(<BrokersHub onNavigateToOrder={onNavigateToOrder} />);

  fireEvent.click(
    screen.getByRole('tab', { name: /Propuestas Recibidas y Chat/ }),
  );

  fireEvent.click(screen.getByRole('button', { name: /Enviar Mensaje/ }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    /Escribe un mensaje antes de enviarlo/,
  );

  fireEvent.click(
    screen.getByRole('button', { name: /Aceptar y Firmar Propuesta/ }),
  );
  expect(
    screen.getByText(/código de verificación 2FA de 6 dígitos/),
  ).toHaveAttribute('role', 'alert');

  fireEvent.change(screen.getByLabelText(/Código 2FA/), {
    target: { value: '123456' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: /Aceptar y Firmar Propuesta/ }),
  );

  expect(screen.getByRole('status')).toHaveTextContent(
    /Propuesta de NVDA aceptada y firmada/,
  );

  fireEvent.click(screen.getByRole('button', { name: /Operar en Terminal/ }));
  expect(onNavigateToOrder).toHaveBeenCalledWith('NVDA');
});

it('alterna al Portal Comisionista y soporta cambio de idioma a inglés', () => {
  render(<BrokersHub userRoles={['broker']} />);

  fireEvent.click(screen.getByRole('button', { name: 'Portal Comisionista' }));
  expect(
    screen.getByRole('tab', { name: /1\. Solicitudes y Cartera/ }),
  ).toBeVisible();

  act(() => {
    setAppLocale('en');
  });
  expect(
    screen.getByRole('tab', { name: /1\. Requests & Clients/ }),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Investor View' }),
  ).toBeInTheDocument();
});

it('BrokerAvatar muestra iniciales de respaldo si falla la carga de la imagen', () => {
  render(
    <BrokerAvatar
      brokerId="a0112233-4455-6677-8899-aabbccddeeff"
      name="Carlos Andrés Rodríguez"
      size={56}
    />,
  );

  const img = screen.getByAltText('Foto Carlos Andrés Rodríguez');
  fireEvent.error(img);

  expect(screen.getByText('CA')).toBeInTheDocument();
});

it.each([{ roles: [] }, { roles: ['investor'] }, { roles: ['administrator'] }])(
  'oculta el portal sin rol broker: %j',
  ({ roles: userRoles }) => {
    render(<BrokersHub userRoles={userRoles} />);
    expect(
      screen.queryByRole('button', { name: 'Portal Comisionista' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: /Solicitudes y Cartera/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Mi Comisionista y Permisos/ }),
    ).toBeVisible();
  },
);

it('cierra el portal si la sesión pierde el rol broker', () => {
  const { rerender } = render(<BrokersHub userRoles={['broker']} />);
  expect(
    screen.getByRole('tab', { name: /Solicitudes y Cartera/ }),
  ).toBeVisible();
  rerender(<BrokersHub userRoles={['investor']} />);
  expect(
    screen.queryByRole('tab', { name: /Solicitudes y Cartera/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: /Mi Comisionista y Permisos/ }),
  ).toBeVisible();
});
