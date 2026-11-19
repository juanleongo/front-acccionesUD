import { City, Country, State } from 'country-state-city';
import { z } from 'zod';

export const runtime = 'nodejs';

const paramsSchema = z.object({
  country: z.string().regex(/^[A-Z]{2}$/),
  state: z.string().min(1).max(10).optional(),
});

// Local reference data only: no accounts, credentials or backend business API.
export function GET(request: Request) {
  const parsed = paramsSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success || !Country.getCountryByCode(parsed.data.country)) {
    return Response.json({ message: 'País no válido.' }, { status: 400 });
  }
  const { country, state } = parsed.data;
  const states = State.getStatesOfCountry(country);
  if (state && !states.some((item) => item.isoCode === state)) {
    return Response.json({ message: 'Región no válida.' }, { status: 400 });
  }
  return Response.json(
    {
      states: states.map(({ isoCode, name }) => ({ code: isoCode, name })),
      cities: state
        ? [
            ...new Set(
              City.getCitiesOfState(country, state).map(({ name }) => name),
            ),
          ]
        : [],
    },
    { headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
