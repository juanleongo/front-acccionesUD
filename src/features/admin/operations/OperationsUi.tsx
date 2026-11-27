'use client';

import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { ApiError } from '@/lib/api';
import { formatMarketDateTime, formatUsd } from '@/lib/formatters';
import { useLocale, type Locale } from '@/lib/i18n';
import { adminRead } from './operations-api';
import styles from './operations.module.css';

export type Row = Record<string, unknown>;
export type Column<T> = { label: string; render: (row: T) => ReactNode };
export const textValue = (value: unknown): string =>
  value == null
    ? '—'
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
export const dateValue = (value: unknown, locale: Locale = 'es') =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? `${formatMarketDateTime(value, locale, { timeZone: 'America/New_York' })} ET`
    : '—';
export const moneyValue = (value: unknown) =>
  value == null
    ? '—'
    : typeof value === 'string' || typeof value === 'number'
      ? formatUsd(value, { withCode: true })
      : '—';
export const uuidValid = (value: string) => z.uuid().safeParse(value).success;
export function AdminError({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { tx } = useLocale();
  const status = error instanceof ApiError ? error.metadata.status : undefined;
  const code = error instanceof ApiError ? error.metadata.code : undefined;
  const message =
    code === 'FEE_VERSION_CONFLICT'
      ? tx(
          'Otra persona cambió la tarifa. Actualiza el historial y vuelve a preparar la versión.',
          'The fee was changed by someone else. Refresh history and prepare the version again.',
        )
      : status === 403
        ? tx(
            'Tu cuenta no tiene permiso para esta operación.',
            'Your account does not have permission for this operation.',
          )
        : status === 401
          ? tx(
              'Verifica tu sesión y el código de autenticación.',
              'Check your session and authentication code.',
            )
          : status === 404
            ? tx(
                'El recurso o servicio no está disponible en el servidor conectado.',
                'The resource or service is not available on the connected server.',
              )
            : status === 422
              ? tx(
                  'Revisa los campos, el período y el código de autenticación.',
                  'Review the fields, period and authentication code.',
                )
              : status === 409
                ? tx(
                    'El estado cambió o la operación ya no está permitida. Actualiza los datos antes de reintentar.',
                    'The state changed or this operation is no longer allowed. Refresh the data before retrying.',
                  )
                : tx(
                    'No pudimos completar la consulta. Revisa la conexión e inténtalo de nuevo.',
                    'Could not complete the request. Check the connection and try again.',
                  );
  return (
    <div className={styles.error} role="alert">
      {message}
      {retry && (
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={retry}>
            {tx('Reintentar', 'Retry')}
          </button>
        </div>
      )}
    </div>
  );
}
export function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {hint && <p className={styles.hint}>{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
export function Table<T>({
  rows,
  columns,
  label,
}: {
  rows: T[];
  columns: Column<T>[];
  label: string;
}) {
  const { tx } = useLocale();
  return (
    <div
      className={styles.tableWrap}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table className={styles.table}>
        <caption className={styles.caption}>{label}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column.label}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.label} data-label={column.label}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                {tx(
                  'No hay registros para esta consulta.',
                  'No records for this query.',
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function QueryTable<
  P extends { items: unknown[]; next_cursor?: string | null | undefined },
>({
  path,
  params = {},
  schema,
  columns,
  title,
  children,
}: {
  path: string;
  params?: Record<string, string>;
  schema: z.ZodType<P>;
  columns: Column<NoInfer<P>['items'][number]>[];
  title: string;
  children?: (data: P) => ReactNode;
}) {
  const { tx } = useLocale();
  const [cursors, setCursors] = useState<string[]>(['']);
  const cursor = cursors.at(-1) ?? '';
  const query = useQuery({
    queryKey: ['admin07', path, params, cursor],
    queryFn: ({ signal }) =>
      adminRead(path, schema, { ...params, cursor }, signal),
    staleTime: 15_000,
    retry: false,
  });
  return (
    <>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {tx('Actualizar consulta', 'Refresh query')}
        </button>
      </div>
      {query.isPending ? (
        <LoadingState
          mode="compact"
          label={tx('Consultando registros…', 'Loading records…')}
        />
      ) : query.isError ? (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          {children?.(query.data)}
          <Table rows={query.data.items} columns={columns} label={title} />
          <nav
            aria-label={tx('Paginación', 'Pagination')}
            className={styles.actions}
          >
            <button
              type="button"
              className={styles.button}
              disabled={cursors.length < 2}
              onClick={() => setCursors(cursors.slice(0, -1))}
            >
              {tx('Anterior', 'Previous')}
            </button>
            <span className={styles.hint}>
              {tx(`Página ${cursors.length}`, `Page ${cursors.length}`)}
            </span>
            <button
              type="button"
              className={styles.button}
              disabled={!query.data.next_cursor}
              onClick={() => {
                if (query.data.next_cursor)
                  setCursors([...cursors, query.data.next_cursor]);
              }}
            >
              {tx('Siguiente', 'Next')}
            </button>
          </nav>
        </>
      )}
    </>
  );
}
export function usePeriod() {
  const [period, setPeriod] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    const iso = (date: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    return { from: iso(start), to: iso(end) };
  });
  return [period, setPeriod] as const;
}
export function PeriodFields({
  value,
  onChange,
}: {
  value: { from: string; to: string };
  onChange: (period: { from: string; to: string }) => void;
}) {
  const { tx } = useLocale();
  const id = useId();
  return (
    <div className={styles.grid}>
      <div className={styles.field}>
        <span>{tx('Desde', 'From')}</span>
        <DatePicker
          id={`${id}-from`}
          label={tx('Desde', 'From')}
          value={value.from}
          max={value.to}
          onChange={(from) => onChange({ ...value, from })}
        />
      </div>
      <div className={styles.field}>
        <span>{tx('Hasta', 'To')}</span>
        <DatePicker
          id={`${id}-to`}
          label={tx('Hasta', 'To')}
          value={value.to}
          min={value.from}
          onChange={(to) => onChange({ ...value, to })}
        />
      </div>
    </div>
  );
}
export type ActionField = {
  name: string;
  label: string;
  options?: { value: string; label: string }[];
  kind?: 'text' | 'decimal' | 'datetime' | 'textarea';
  required?: boolean;
  maxLength?: number;
};
export function AdminAction({
  title,
  description,
  fields = [],
  validate,
  onConfirm,
  evidence = false,
  disabled = false,
}: {
  title: string;
  description: string;
  fields?: ActionField[];
  validate?: (values: Record<string, string>) => string | null;
  onConfirm: (values: Record<string, string>) => Promise<unknown>;
  evidence?: boolean;
  disabled?: boolean;
}) {
  const { tx } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const flight = useRef(false);
  const id = useId();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [validation, setValidation] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const allFields: ActionField[] = [
    ...fields,
    ...(evidence
      ? [
          {
            name: 'evidence_text',
            label: tx('Evidencia y contexto', 'Evidence and context'),
            kind: 'textarea' as const,
            required: true,
            maxLength: 2000,
          },
        ]
      : []),
    {
      name: 'reason',
      label: tx('Motivo de la operación', 'Reason for this operation'),
      kind: 'textarea',
      required: true,
      maxLength: 500,
    },
    {
      name: 'totp_code',
      label: tx(
        'Código de autenticación (6 dígitos)',
        'Authentication code (6 digits)',
      ),
      required: true,
      maxLength: 6,
    },
  ];
  const update = (name: string, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setSuccess(false);
  };
  function review(event: FormEvent) {
    event.preventDefault();
    if (busy || disabled) return;
    const missing = allFields.find(
      (field) => field.required && !values[field.name]?.trim(),
    );
    const invalid = missing
      ? tx(`Completa: ${missing.label}.`, `Complete: ${missing.label}.`)
      : !/^\d{6}$/.test(values.totp_code ?? '')
        ? tx(
            'Ingresa un código de autenticación de 6 dígitos.',
            'Enter a 6-digit authentication code.',
          )
        : validate?.(values);
    setValidation(invalid ?? '');
    setError(null);
    if (invalid) return;
    setConsent(false);
    dialog.current?.showModal();
  }
  async function confirm() {
    if (flight.current || !consent) return;
    flight.current = true;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(values);
      setSuccess(true);
      setValues({});
      dialog.current?.close();
      await queryClient.invalidateQueries({ queryKey: ['admin07'] });
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
      flight.current = false;
    }
  }
  return (
    <section className={styles.evidence}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.hint}>{description}</p>
      <form noValidate onSubmit={review}>
        <div className={styles.grid}>
          {allFields.map((field) => (
            <div className={styles.field} key={field.name}>
              <label htmlFor={`${id}-${field.name}`}>{field.label}</label>
              {field.options ? (
                <CustomSelect
                  id={`${id}-${field.name}`}
                  disabled={disabled || busy}
                  value={values[field.name] ?? ''}
                  onChange={(value) => update(field.name, value)}
                  options={[
                    {
                      value: '',
                      label: tx('Selecciona una opción', 'Select an option'),
                    },
                    ...field.options,
                  ]}
                />
              ) : field.kind === 'textarea' ? (
                <textarea
                  id={`${id}-${field.name}`}
                  maxLength={field.maxLength}
                  disabled={busy || disabled}
                  value={values[field.name] ?? ''}
                  onChange={(e) => update(field.name, e.target.value)}
                />
              ) : field.kind === 'datetime' ? (
                <div className={styles.grid}>
                  <DatePicker
                    id={`${id}-${field.name}`}
                    disabled={disabled || busy}
                    label={field.label}
                    value={(values[field.name] ?? '').slice(0, 10)}
                    onChange={(date) =>
                      update(
                        field.name,
                        date
                          ? `${date}T${(values[field.name] ?? '').slice(11) || '09:30'}`
                          : '',
                      )
                    }
                  />
                  <input
                    aria-label={`${field.label} · ${tx('Hora de Colombia', 'Colombia time')}`}
                    type="time"
                    disabled={busy || disabled}
                    value={(values[field.name] ?? '').slice(11)}
                    onChange={(e) => {
                      const date = (values[field.name] ?? '').slice(0, 10);
                      if (date) update(field.name, `${date}T${e.target.value}`);
                    }}
                  />
                </div>
              ) : (
                <input
                  id={`${id}-${field.name}`}
                  inputMode={
                    field.kind === 'decimal' || field.name === 'totp_code'
                      ? 'decimal'
                      : 'text'
                  }
                  autoComplete={
                    field.name === 'totp_code' ? 'one-time-code' : 'off'
                  }
                  maxLength={field.maxLength}
                  disabled={busy || disabled}
                  value={values[field.name] ?? ''}
                  onChange={(e) => update(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        {validation && (
          <p className={styles.error} role="alert">
            {validation}
          </p>
        )}
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.button}
            disabled={busy || disabled}
          >
            {tx('Revisar operación', 'Review operation')}
          </button>
        </div>
      </form>
      {success && (
        <p className={styles.success} role="status">
          {tx(
            'Operación completada. La consulta se ha actualizado.',
            'Operation completed. The query has been refreshed.',
          )}
        </p>
      )}
      <dialog
        ref={dialog}
        className={styles.dialog}
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <header className={styles.header}>
          <Icon name="shield" size={28} />
          <h3 className={styles.title}>{title}</h3>
          <button
            type="button"
            className={styles.button}
            disabled={busy}
            aria-label={tx('Cerrar confirmación', 'Close confirmation')}
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" size={18} />
          </button>
        </header>
        <p className={styles.hint}>{description}</p>
        <dl className={styles.evidence}>
          {allFields
            .filter((field) => field.name !== 'totp_code')
            .map((field) => (
              <div key={field.name}>
                <dt className={styles.hint}>{field.label}</dt>
                <dd>
                  {field.options?.find(
                    (option) => option.value === values[field.name],
                  )?.label ??
                    values[field.name] ??
                    '—'}
                </dd>
              </div>
            ))}
        </dl>
        <label className={styles.consent}>
          <input
            type="checkbox"
            checked={consent}
            disabled={busy}
            onChange={(e) => setConsent(e.target.checked)}
          />
          {tx(
            'He revisado el alcance y los datos. Confirmo esta operación administrativa.',
            'I have reviewed the scope and details. I confirm this administrative operation.',
          )}
        </label>
        {error != null && <AdminError error={error} />}
        <footer className={styles.actions}>
          <button
            type="button"
            className={styles.button}
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            {tx('Volver', 'Back')}
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled={busy || !consent}
            onClick={() => void confirm()}
          >
            {busy
              ? tx('Procesando…', 'Processing…')
              : tx('Confirmar operación', 'Confirm operation')}
          </button>
        </footer>
      </dialog>
    </section>
  );
}
export function Evidence({ value, title }: { value: Row; title: string }) {
  return (
    <details className={styles.evidence}>
      <summary className={styles.hint}>{title}</summary>
      <dl>
        {Object.entries(value).map(([key, content]) => (
          <div key={key}>
            <dt>{key.replaceAll('_', ' ')}</dt>
            <dd>{textValue(content)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
