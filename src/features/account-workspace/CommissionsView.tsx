'use client';

import { useState } from 'react';
import { AssetLogo } from '@/components/market/AssetLogo';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { useLocale } from '@/lib/i18n';
import type {
  CommandHandler,
  CommissionFilters,
  CommissionSummary,
  CommissionTotals,
} from './types';
import {
  Amount,
  Badge,
  EmptyState,
  Field,
  Metric,
  Panel,
  Timestamp,
} from './WorkspaceUi';
import styles from './workspace.module.css';

export function CommissionsView({
  audience,
  entries,
  totals,
  initialFilters,
  investors,
  hasNext,
  hasPrevious,
  onCommand,
}: {
  audience: 'investor' | 'broker';
  entries: readonly CommissionSummary[];
  totals: CommissionTotals | null;
  initialFilters: CommissionFilters;
  investors: readonly { id: string; name: string }[];
  hasNext: boolean;
  hasPrevious: boolean;
  onCommand: CommandHandler;
}) {
  const { tx } = useLocale();
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState('');
  const broker = audience === 'broker';
  return (
    <div className={styles.stack}>
      <Panel
        title={
          broker
            ? tx('Comisiones por tu asesoría', 'Your advisory commissions')
            : tx('Tus comisiones, con detalle', 'Your commissions in detail')
        }
        hint={
          broker
            ? tx(
                'Consulta tu participación en las operaciones de tus clientes.',
                'Review your share of client trades.',
              )
            : tx(
                'Revisa qué se cobró por cada ejecución. Los importes corresponden al historial confirmado.',
                'Review charges for each execution. Amounts come from confirmed history.',
              )
        }
      >
        <form
          noValidate
          className={styles.stack}
          onSubmit={(e) => {
            e.preventDefault();
            if (!filters.from || !filters.to || filters.from > filters.to) {
              setError(
                tx(
                  'Selecciona un período válido. La fecha inicial no puede ser posterior a la final.',
                  'Choose a valid period. The start date cannot be later than the end date.',
                ),
              );
              return;
            }
            setError('');
            onCommand({ type: 'commissions.query', filters, audience });
          }}
        >
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <span>{tx('Desde', 'From')}</span>
              <DatePicker
                label={tx('Desde', 'From')}
                value={filters.from}
                onChange={(from) => setFilters({ ...filters, from })}
                max={filters.to || undefined}
              />
            </div>
            <div className={styles.field}>
              <span>{tx('Hasta', 'To')}</span>
              <DatePicker
                label={tx('Hasta', 'To')}
                value={filters.to}
                onChange={(to) => setFilters({ ...filters, to })}
                min={filters.from || undefined}
              />
            </div>
            {broker ? (
              <Field label={tx('Cliente', 'Client')}>
                <CustomSelect
                  value={filters.investorId}
                  onChange={(investorId) =>
                    setFilters({ ...filters, investorId })
                  }
                  options={[
                    {
                      value: '',
                      label: tx('Todos mis clientes', 'All my clients'),
                    },
                    ...investors.map((i) => ({ value: i.id, label: i.name })),
                  ]}
                  ariaLabel={tx('Cliente', 'Client')}
                />
              </Field>
            ) : (
              <Field
                label={tx('Símbolo de la acción', 'Stock symbol')}
                hint={tx(
                  'Opcional. Por ejemplo: AAPL.',
                  'Optional. For example: AAPL.',
                )}
              >
                <input
                  className={styles.input}
                  value={filters.symbol}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      symbol: e.target.value.toUpperCase(),
                    })
                  }
                />
              </Field>
            )}
            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                {tx('Consultar período', 'View period')}
              </button>
            </div>
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </form>
      </Panel>
      {totals && (
        <>
          <div className={styles.metrics}>
            <Metric
              label={tx('Comisiones del período', 'Period commissions')}
              value={<Amount value={totals.commission} />}
              hint={tx(
                'Importes informados por el servidor.',
                'Amounts reported by the server.',
              )}
            />
            <Metric
              label={tx('Participación de la plataforma', 'Platform share')}
              value={<Amount value={totals.platformShare} />}
              hint={tx(
                'Distribución registrada al ejecutar.',
                'Distribution recorded at execution.',
              )}
            />
            <Metric
              label={
                broker
                  ? tx('Tu participación', 'Your share')
                  : tx('Participación del comisionista', 'Broker share')
              }
              value={<Amount value={totals.brokerShare} />}
              hint={tx(
                'Según los términos de cada ejecución.',
                'Based on each execution’s terms.',
              )}
            />
          </div>
          {!totals.complete && (
            <p className={styles.note}>
              {tx(
                'Hay operaciones antiguas cuyos términos no están disponibles. Los totales pueden ser parciales; no se estiman comisiones faltantes.',
                'Some historical terms are unavailable. Totals may be partial; missing commissions are not estimated.',
              )}
            </p>
          )}
        </>
      )}
      <Panel
        title={tx('Detalle por ejecución', 'Execution details')}
        hint={tx(
          'Fechas en hora de Colombia. Un importe no disponible no significa que sea cero.',
          'Dates use Colombia time. An unavailable amount does not mean zero.',
        )}
      >
        {entries.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>
                {broker
                  ? tx(
                      'Historial de comisiones de tus clientes',
                      'Client commission history',
                    )
                  : tx(
                      'Historial de tus comisiones',
                      'Your commission history',
                    )}
              </caption>
              <thead>
                <tr>
                  {[
                    tx('Acción / fecha', 'Stock / date'),
                    ...(broker ? [tx('Cliente', 'Client')] : []),
                    tx('Operación', 'Side'),
                    tx('Valor operado', 'Trade value'),
                    tx('Comisión', 'Commission'),
                    tx('Participación', 'Share'),
                    tx('Términos', 'Terms'),
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label={tx('Acción / fecha', 'Stock / date')}>
                      <div className={styles.identity}>
                        <AssetLogo
                          symbol={entry.symbol}
                          exchange={entry.exchange}
                          size="sm"
                        />
                        <div>
                          <strong>{entry.symbol}</strong>
                          <small>
                            <Timestamp value={entry.executedAt} />
                          </small>
                        </div>
                      </div>
                    </td>
                    {broker && (
                      <td data-label={tx('Cliente', 'Client')}>
                        {entry.investorName ||
                          tx('Sin nombre disponible', 'Name unavailable')}
                      </td>
                    )}
                    <td data-label={tx('Operación', 'Side')}>
                      <Badge
                        tone={entry.side === 'buy' ? 'success' : 'neutral'}
                      >
                        {entry.side === 'buy'
                          ? tx('Compra', 'Buy')
                          : tx('Venta', 'Sell')}
                      </Badge>
                    </td>
                    <td data-label={tx('Valor operado', 'Trade value')}>
                      <Amount value={entry.gross} />
                    </td>
                    <td data-label={tx('Comisión', 'Commission')}>
                      <Amount value={entry.commission} />
                    </td>
                    <td data-label={tx('Participación', 'Share')}>
                      <div>
                        <Amount value={entry.brokerShare} />
                        <small>{tx('Comisionista', 'Broker')}</small>
                        <Amount value={entry.platformShare} />
                        <small>{tx('Plataforma', 'Platform')}</small>
                      </div>
                    </td>
                    <td data-label={tx('Términos', 'Terms')}>
                      <Badge
                        tone={
                          entry.status === 'official' ? 'success' : 'warning'
                        }
                      >
                        {entry.status === 'official'
                          ? tx('Confirmados', 'Confirmed')
                          : tx(
                              'Históricos no disponibles',
                              'Historical terms unavailable',
                            )}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={tx(
              'Sin comisiones en este período',
              'No commissions in this period',
            )}
            detail={tx(
              'Consulta otro período o espera a que se confirme una ejecución.',
              'Choose another period or wait for an execution to be confirmed.',
            )}
            icon="file"
          />
        )}
        <div className={styles.row}>
          <button
            type="button"
            className={styles.button}
            disabled={!hasPrevious}
            onClick={() => onCommand({ type: 'commissions.previous' })}
          >
            {tx('Anterior', 'Previous')}
          </button>
          <span className={styles.muted}>
            {tx(
              'Resultados del período consultado',
              'Results for the requested period',
            )}
          </span>
          <button
            type="button"
            className={styles.button}
            disabled={!hasNext}
            onClick={() => onCommand({ type: 'commissions.next' })}
          >
            {tx('Siguiente', 'Next')}
          </button>
        </div>
      </Panel>
    </div>
  );
}
