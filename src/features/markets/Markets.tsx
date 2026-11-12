'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { getMarkets, getClock, getCalendar, getStatus, tz } from './api';
import styles from './markets.module.css';
import { PriceChart } from './PriceChart';

function Problem({ error, retry }: { error: Error; retry: () => void }) {
  const status = error instanceof ApiError && error.metadata.status;
  if (status === 401)
    return (
      <p role="alert">
        <Link href="/login">Inicia sesión</Link> para consultar los mercados.
      </p>
    );
  if (status === 403)
    return (
      <p role="alert">Tu cuenta no tiene permiso para consultar mercados.</p>
    );
  return (
    <div role="alert">
      <p>
        {status === 404
          ? 'No se encontró el mercado solicitado.'
          : status === 422
            ? 'Revisa las fechas de la consulta.'
            : 'No se pudieron cargar los datos de mercado.'}
      </p>
      <button onClick={retry}>Reintentar</button>
    </div>
  );
}

const formatInstant = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-CO', {
        timeZone: tz,
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

function MarketClock() {
  const clock = useQuery({
    queryKey: ['markets', 'clock', tz],
    queryFn: ({ signal }) => getClock(signal),
    refetchInterval: 60000,
  });
  return (
    <section>
      <h3>Reloj bursátil</h3>
      {clock.error ? (
        <Problem error={clock.error} retry={clock.refetch} />
      ) : clock.data ? (
        <>
          <p>
            <strong>{clock.data.is_open ? 'Abierto' : 'Cerrado'}</strong> ·
            Actualizado el {formatInstant(clock.data.timestamp)}
          </p>
          <p>
            Próxima apertura: {formatInstant(clock.data.next_open)} · Próximo
            cierre: {formatInstant(clock.data.next_close)}
          </p>
        </>
      ) : (
        <p role="status">Consultando reloj…</p>
      )}
    </section>
  );
}

const localDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: tz,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const localTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: tz,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function positionOnDay(value: string, day: string) {
  const date = new Date(value);
  const calendarDate = localDay.format(date);
  if (calendarDate < day) return 0;
  if (calendarDate > day) return 100;
  const [hours, minutes] = localTime.format(date).split(':');
  return ((Number(hours) * 60 + Number(minutes)) / 1440) * 100;
}

function SessionBar({
  day,
  open,
  close,
  trading,
}: {
  day: string;
  open: string | null;
  close: string | null;
  trading: boolean;
}) {
  if (!trading || !open || !close)
    return (
      <span className={styles.inactive}>
        {trading ? 'Horario sin publicar' : 'Cerrado'}
      </span>
    );
  const start = positionOnDay(open, day);
  const end = positionOnDay(close, day);
  const label =
    localTime.format(new Date(open)) +
    ' – ' +
    localTime.format(new Date(close));
  return (
    <div
      className={styles.track}
      role="img"
      aria-label={'Sesión ' + label}
      title={label}
    >
      <span
        style={{ left: start + '%', width: Math.max(0, end - start) + '%' }}
      />
    </div>
  );
}

function MarketSchedule({ code }: { code: string }) {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(() =>
    new Date(Date.parse(start) + 6 * 86400000).toISOString().slice(0, 10),
  );
  const period = Date.parse(end) - Date.parse(start);
  const valid =
    Number.isFinite(period) && period >= 0 && period <= 366 * 86400000;
  const status = useQuery({
    queryKey: ['markets', 'status', code, start, tz],
    queryFn: ({ signal }) => getStatus(code, start, signal),
    enabled: Boolean(start),
  });
  const calendar = useQuery({
    queryKey: ['markets', 'calendar', code, start, end, tz],
    queryFn: ({ signal }) => getCalendar(code, start, end, signal),
    enabled: valid,
  });
  return (
    <section>
      <h3>Calendario de {code}</h3>
      <div className={styles.filters}>
        <label>
          Desde
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            min={start}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      {status.error ? (
        <Problem error={status.error} retry={status.refetch} />
      ) : (
        status.data && (
          <p>
            <strong>
              {status.data.open ? 'Jornada de negociación' : 'Sin negociación'}
            </strong>{' '}
            · {status.data.date}
            {status.data.open && (
              <>
                {' '}
                · {formatInstant(status.data.open_at)} –{' '}
                {formatInstant(status.data.close_at)}
              </>
            )}
            {status.data.override && ' · Horario especial'}
          </p>
        )
      )}
      {!valid ? (
        <p role="alert">
          Selecciona un intervalo válido de hasta 366 días entre las fechas.
        </p>
      ) : calendar.error ? (
        <Problem error={calendar.error} retry={calendar.refetch} />
      ) : !calendar.data ? (
        <p role="status">Cargando calendario…</p>
      ) : !calendar.data.days.length ? (
        <p>Sin jornadas para este intervalo.</p>
      ) : (
        <div className={styles.scroll}>
          <table>
            <caption>Jornadas · {calendar.data.time_zone}</caption>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Jornada</th>
                <th>
                  Horario de negociación
                  <div className={styles.axis}>
                    <span>00 h</span>
                    <span>12 h</span>
                    <span>24 h</span>
                  </div>
                </th>
                <th>Apertura</th>
                <th>Cierre</th>
              </tr>
            </thead>
            <tbody>
              {calendar.data.days.map((day) => (
                <tr key={day.date}>
                  <th scope="row">{day.date}</th>
                  <td>
                    {(
                      {
                        trading_day: 'Negociación',
                        holiday: 'Festivo',
                        weekend: 'Fin de semana',
                      } as Record<string, string>
                    )[day.kind] ?? day.kind}
                    {day.override && ' · Horario especial'}
                  </td>
                  <td>
                    <SessionBar
                      day={day.date}
                      open={day.open_at}
                      close={day.close_at}
                      trading={day.kind === 'trading_day'}
                    />
                  </td>
                  <td>{formatInstant(day.open_at)}</td>
                  <td>{formatInstant(day.close_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function Markets() {
  const list = useQuery({
    queryKey: ['markets', 'list'],
    queryFn: ({ signal }) => getMarkets(signal),
  });
  const [selected, setSelected] = useState('');
  const current = list.data?.find((m) => m.code === selected) ?? list.data?.[0];
  return (
    <section className={styles.panel} aria-label="Mercados bursátiles">
      <h2>Mercados bursátiles</h2>
      {list.error ? (
        <Problem error={list.error} retry={list.refetch} />
      ) : !list.data ? (
        <p role="status">Consultando mercados…</p>
      ) : (
        <>
          {current ? (
            <>
              <label>
                Mercado
                <select
                  aria-label="Mercado"
                  value={current.code}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {list.data.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </label>
              <PriceChart key={current.code} exchange={current.code} />
              <p>Horarios en {tz}.</p>
              <MarketClock />
              <MarketSchedule code={current.code} />
            </>
          ) : (
            <p>No hay mercados disponibles.</p>
          )}
        </>
      )}
    </section>
  );
}
