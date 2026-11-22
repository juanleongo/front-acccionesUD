'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { DatePicker } from '@/components/ui/DatePicker';
import { QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
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
  const { tx } = useLocale();
  if (!trading || !open || !close)
    return (
      <span className={styles.inactive}>
        {trading
          ? tx('Horario sin publicar', 'Schedule unpublished')
          : tx('Cerrado', 'Closed')}
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
      aria-label={`${tx('Sesión', 'Session')} ${label}`}
      title={label}
    >
      <span
        style={{ left: start + '%', width: Math.max(0, end - start) + '%' }}
      />
    </div>
  );
}

export function MarketSchedule({ code }: { code: string }) {
  const { locale, tx } = useLocale();
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(() =>
    new Date(Date.parse(start) + 6 * 86400000).toISOString().slice(0, 10),
  );
  const period = Date.parse(end) - Date.parse(start);
  const valid =
    Number.isFinite(period) && period >= 0 && period <= 366 * 86400000;
  const status = useQuery({
    queryKey: queryKeys.markets.status(code, start, tz),
    queryFn: ({ signal }) => getStatus(code, start, signal),
    enabled: Boolean(start),
    staleTime: QUERY_STALE_TIMES.catalog,
  });
  const calendar = useQuery({
    queryKey: queryKeys.markets.calendar(code, start, end, tz),
    queryFn: ({ signal }) => getCalendar(code, start, end, signal),
    enabled: valid,
    staleTime: QUERY_STALE_TIMES.catalog,
  });
  return (
    <section className={styles.scheduleCard}>
      <div className={styles.scheduleHeader}>
        <div>
          <span className={styles.sectionKicker}>
            {tx('CRONOGRAMA OFICIAL DE SESIONES', 'OFFICIAL TRADING SCHEDULE')}{' '}
            ({tz})
          </span>
          <h3>{tx(`Calendario de ${code}`, `${code} Trading Calendar`)}</h3>
        </div>

        <div className={styles.filters}>
          <label className={styles.dateFilterLabel}>
            <span>{tx('Desde', 'From')}</span>
            <DatePicker
              id="market-calendar-from"
              label={tx('Desde', 'From')}
              value={start}
              onChange={setStart}
            />
          </label>
          <label className={styles.dateFilterLabel}>
            <span>{tx('Hasta', 'To')}</span>
            <DatePicker
              id="market-calendar-to"
              label={tx('Hasta', 'To')}
              min={start}
              value={end}
              onChange={setEnd}
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
            <p className={styles.dayStatusText}>
              <strong>
                {status.data.open
                  ? tx('Jornada de negociación', 'Trading day')
                  : tx('Sin negociación', 'Market closed')}
              </strong>{' '}
              · {status.data.date}
              {status.data.open && (
                <>
                  {' '}
                  · {formatInstant(status.data.open_at, locale)} –{' '}
                  {formatInstant(status.data.close_at, locale)}
                </>
              )}
              {status.data.override &&
                tx(' · Horario especial', ' · Special schedule')}
            </p>
          </div>
        )
      )}

      {!valid ? (
        <p className={styles.alertBox} role="alert">
          {tx(
            'Selecciona un intervalo válido de hasta 366 días entre las fechas.',
            'Select a valid date range of up to 366 days.',
          )}
        </p>
      ) : calendar.error ? (
        <Problem error={calendar.error} retry={calendar.refetch} />
      ) : !calendar.data ? (
        <LoadingState
          mode="compact"
          label={tx(
            'Cargando calendario bursátil…',
            'Loading market calendar…',
          )}
          detail={tx(
            `Consultando jornadas oficiales de ${code} en zona horaria ${tz}.`,
            `Fetching official ${code} sessions in timezone ${tz}.`,
          )}
        />
      ) : !calendar.data.days.length ? (
        <p className={styles.emptyNotice}>
          {tx(
            'Sin jornadas para este intervalo.',
            'No sessions found for this date range.',
          )}
        </p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.calendarTable}>
            <caption>
              {tx(
                `Jornadas bursátiles de ${code} · Zona horaria: ${calendar.data.time_zone}`,
                `${code} trading sessions · Time zone: ${calendar.data.time_zone}`,
              )}
            </caption>
            <thead>
              <tr>
                <th>{tx('Fecha', 'Date')}</th>
                <th>{tx('Jornada', 'Day type')}</th>
                <th className={styles.thSchedule}>
                  <span>
                    {tx(
                      'Horario de negociación (09:30 – 16:00 ET)',
                      'Trading hours (09:30 – 16:00 ET)',
                    )}
                  </span>
                  <div className={styles.axis}>
                    <span>00 h</span>
                    <span>12 h</span>
                    <span>24 h</span>
                  </div>
                </th>
                <th>{tx('Apertura', 'Open')}</th>
                <th>{tx('Cierre', 'Close')}</th>
              </tr>
            </thead>
            <tbody>
              {calendar.data.days.map((day) => {
                const kindLabel =
                  (
                    {
                      trading_day: tx('Negociación', 'Trading day'),
                      holiday: tx('Festivo', 'Holiday'),
                      weekend: tx('Fin de semana', 'Weekend'),
                    } as Record<string, string>
                  )[day.kind] ?? day.kind;
                return (
                  <tr key={day.date} data-kind={day.kind}>
                    <th scope="row">{day.date}</th>
                    <td className={styles.kindCell}>
                      <span className={styles.sessionBadge}>
                        {kindLabel}
                        {day.override &&
                          tx(' · Horario especial', ' · Special schedule')}
                      </span>
                    </td>
                    <td className={styles.sessionTrackCell}>
                      <SessionBar
                        day={day.date}
                        open={day.open_at}
                        close={day.close_at}
                        trading={day.kind === 'trading_day'}
                      />
                    </td>
                    <td data-label={tx('Apertura', 'Open')}>
                      {formatInstant(day.open_at, locale)}
                    </td>
                    <td data-label={tx('Cierre', 'Close')}>
                      {formatInstant(day.close_at, locale)}
                    </td>
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
