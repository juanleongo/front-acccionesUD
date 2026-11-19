import { expect, it } from 'vitest';
import { GET } from './route';

it('devuelve regiones sin descargar ciudades hasta que se solicita una región', async () => {
  const response = GET(
    new Request('http://localhost/api/catalog/locations?country=CO'),
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.states).toContainEqual({ code: 'ANT', name: 'Antioquia' });
  expect(body.cities).toEqual([]);
});
it('limita las ciudades a la región solicitada', async () => {
  const response = GET(
    new Request('http://localhost/api/catalog/locations?country=CO&state=ANT'),
  );
  const body = await response.json();
  expect(body.cities).toContain('Medellín');
  expect(body.cities).not.toContain('Bogotá');
});
it.each(['country=ZZ', 'country=CO&state=INVALID', 'country=../../etc', ''])(
  'rechaza parámetros inválidos: %s',
  (query) => {
    expect(
      GET(new Request('http://localhost/api/catalog/locations?' + query))
        .status,
    ).toBe(400);
  },
);
