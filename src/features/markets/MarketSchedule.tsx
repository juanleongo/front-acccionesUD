'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { getCalendar, getStatus, tz } from './api';
import { formatInstant, localDay, localTime, today } from './marketDates';
import { Problem } from './MarketProblem';
import styles from './markets.module.css';

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

export function MarketSchedule({ code }: { code: string }) {
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
    <section className={styles.scheduleCard}>
      <div className={styles.scheduleHeader}>
        <div>
          <span className={styles.sectionKicker}>
            CRONOGRAMA OFICIAL DE SESIONES ({tz})
          </span>
          <h3>Calendario de {code}</h3>
        </div>

        <div className={styles.filters}>
          <label className={styles.dateFilterLabel}>
            <span>Desde</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className={styles.dateFilterLabel}>
            <span>Hasta</span>
            <input
              type="date"
              min={start}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
      </div>

      {status.error ? (
        <Problem error={status.error} retry={status.refetch} />
      ) : (
        status.data && (
          <div
            className={`${styles.dayStatusBanner} ${
              status.data.open ? styles.dayStatusOpen : styles.dayStatusClosed
            }`}
          >
            <span className={styles.dayStatusDot} />
            <p style={{ margin: 0 }}>
              <strong>
                {status.data.open
                  ? 'Jornada de negociación'
                  : 'Sin negociación'}
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
          </div>
        )
      )}

      {!valid ? (
        <p className={styles.alertBox} role="alert">
          Selecciona un intervalo válido de hasta 366 días entre las fechas.
        </p>
      ) : calendar.error ? (
        <Problem error={calendar.error} retry={calendar.refetch} />
      ) : !calendar.data ? (
        <LoadingState
          mode="compact"
          label="Cargando calendario bursátil…"
          detail={`Consultando jornadas oficiales de ${code} en zona horaria ${tz}.`}
        />
      ) : !calendar.data.days.length ? (
        <p className={styles.emptyNotice}>Sin jornadas para este intervalo.</p>
      ) : (
        <div className={styles.scroll}>
          <table>
            <caption>
              Jornadas bursátiles de {code} · Zona horaria:{' '}
              {calendar.data.time_zone}
            </caption>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Jornada</th>
                <th className={styles.thSchedule}>
                  <span>Horario de negociación (09:30 – 16:00 ET)</span>
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
              {calendar.data.days.map((day) => {
                const kindLabel =
                  (
                    {
                      trading_day: 'Negociación',
                      holiday: 'Festivo',
                      weekend: 'Fin de semana',
                    } as Record<string, string>
                  )[day.kind] ?? day.kind;
                return (
                  <tr key={day.date} data-kind={day.kind}>
                    <th scope="row">{day.date}</th>
                    <td className={styles.kindCell}>
                      {kindLabel}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
