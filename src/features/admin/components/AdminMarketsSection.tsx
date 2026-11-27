'use client';

import type { FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type { ScheduleOverride } from '../admin-api';
import styles from '../admin.module.css';

export interface AdminMarketsSectionProps {
  selectedMarket: string;
  openTime: string;
  closeTime: string;
  newOverrideDate: string;
  newOverrideClosed: boolean;
  newOverrideOpenTime: string;
  newOverrideCloseTime: string;
  overrides: ScheduleOverride[];
  onChangeMarket: (val: string) => void;
  onChangeOpenTime: (val: string) => void;
  onChangeCloseTime: (val: string) => void;
  onChangeOverrideDate: (val: string) => void;
  onChangeOverrideClosed: (closed: boolean) => void;
  onChangeOverrideOpenTime: (val: string) => void;
  onChangeOverrideCloseTime: (val: string) => void;
  onSaveSchedule: (e: FormEvent) => void;
  onCreateOverride: (e: FormEvent) => void;
  onDeleteOverride: (overrideId: string) => void;
}

export function AdminMarketsSection({
  selectedMarket,
  openTime,
  closeTime,
  newOverrideDate,
  newOverrideClosed,
  newOverrideOpenTime,
  newOverrideCloseTime,
  overrides,
  onChangeMarket,
  onChangeOpenTime,
  onChangeCloseTime,
  onChangeOverrideDate,
  onChangeOverrideClosed,
  onChangeOverrideOpenTime,
  onChangeOverrideCloseTime,
  onSaveSchedule,
  onCreateOverride,
  onDeleteOverride,
}: AdminMarketsSectionProps) {
  const { tx } = useLocale();
  return (
    <div>
      <div className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>
          {tx(
            'Bolsas EE. UU. · América/New_York',
            'US Exchanges · America/New_York',
          )}
        </span>
        <h1>
          {tx(
            'Supervisión de Horarios y Calendario Bursátil (Wall Street)',
            'Market Hours & Trading Calendar Supervision (Wall Street)',
          )}
        </h1>
        <p>
          {tx(
            'Consulta y configura los horarios de operación, los días festivos y los cierres anticipados de los mercados de Estados Unidos.',
            'Inspect and configure default operating hours, holidays, and early closes across US exchanges.',
          )}
        </p>
      </div>

      {/* Horario por defecto */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>
            {tx('Horario Estándar de Negociación', 'Standard Trading Schedule')}
          </h2>
          <span className={styles.headerMeta}>
            {tx(
              'Zona Horaria: Eastern Standard Time (EST / New York)',
              'Time Zone: Eastern Standard Time (EST / New York)',
            )}
          </span>
        </div>

        <form onSubmit={onSaveSchedule} noValidate>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="admin-market-target">
                {tx('Mercado Objetivo', 'Target Exchange')}
              </label>
              <CustomSelect
                id="admin-market-target"
                value={selectedMarket}
                onChange={onChangeMarket}
                options={[
                  { value: 'NYSE', label: 'NYSE (New York Stock Exchange)' },
                  { value: 'NASDAQ', label: 'NASDAQ Stock Market' },
                  { value: 'AMEX', label: 'NYSE American (AMEX)' },
                ]}
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-market-open">
                {tx('Hora de Apertura (EST)', 'Opening Time (EST)')}
              </label>
              <input
                id="admin-market-open"
                type="time"
                value={openTime}
                onChange={(e) => onChangeOpenTime(e.target.value)}
                required
              />
              <small>
                {tx(
                  'Campana de apertura habitual: 09:30 AM',
                  'Regular opening bell: 09:30 AM',
                )}
              </small>
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-market-close">
                {tx('Hora de Cierre (EST)', 'Closing Time (EST)')}
              </label>
              <input
                id="admin-market-close"
                type="time"
                value={closeTime}
                onChange={(e) => onChangeCloseTime(e.target.value)}
                required
              />
              <small>
                {tx(
                  'Campana de cierre habitual: 04:00 PM (16:00)',
                  'Regular closing bell: 04:00 PM (16:00)',
                )}
              </small>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>
              <Icon name="check" size={14} />{' '}
              {tx(
                'Guardar Horario Estándar para',
                'Save Standard Schedule for',
              )}{' '}
              {selectedMarket}
            </button>
          </div>
        </form>
      </div>

      {/* Registro de excepciones / Feriados */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>
            {tx(
              'Excepciones de Calendario Bursátil (Feriados y Cierres Anticipados)',
              'Trading Calendar Overrides (Holidays & Early Closes)',
            )}
          </h2>
          <span className={styles.headerMeta}>
            {overrides.length} {tx('registros', 'overrides')}
          </span>
        </div>

        <form
          onSubmit={onCreateOverride}
          className={styles.overrideForm}
          noValidate
        >
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="admin-override-date">
                {tx('Fecha de la Excepción', 'Override Date')}
              </label>
              <input
                id="admin-override-date"
                type="date"
                value={newOverrideDate}
                onChange={(e) => onChangeOverrideDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-override-type">
                {tx('Tipo de Excepción', 'Override Type')}
              </label>
              <CustomSelect
                id="admin-override-type"
                value={newOverrideClosed ? 'closed' : 'early'}
                onChange={(val) => onChangeOverrideClosed(val === 'closed')}
                options={[
                  {
                    value: 'closed',
                    label: tx(
                      'Mercado Totalmente Cerrado (Feriado Oficial)',
                      'Market Fully Closed (Official Holiday)',
                    ),
                  },
                  {
                    value: 'early',
                    label: tx(
                      'Cierre Anticipado (Early Close a la 1:00 PM EST)',
                      'Early Close (1:00 PM EST)',
                    ),
                  },
                ]}
              />
            </div>

            {!newOverrideClosed && (
              <>
                <div className={styles.formField}>
                  <label htmlFor="admin-override-open">
                    {tx('Hora Apertura', 'Open Time')}
                  </label>
                  <input
                    id="admin-override-open"
                    type="time"
                    value={newOverrideOpenTime}
                    onChange={(e) => onChangeOverrideOpenTime(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="admin-override-close">
                    {tx('Hora Cierre', 'Close Time')}
                  </label>
                  <input
                    id="admin-override-close"
                    type="time"
                    value={newOverrideCloseTime}
                    onChange={(e) => onChangeOverrideCloseTime(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnSecondary}>
              {tx(
                '+ Agregar Excepción al Calendario',
                '+ Add Calendar Override',
              )}
            </button>
          </div>
        </form>

        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>{tx('Mercado', 'Exchange')}</th>
                <th>{tx('Fecha Programada', 'Scheduled Date')}</th>
                <th>{tx('Estado de la Bolsa', 'Market Status')}</th>
                <th>{tx('Horario Aplicable', 'Effective Hours')}</th>
                <th>{tx('Acción', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((ov) => (
                <tr key={ov.id}>
                  <td data-label={tx('Mercado', 'Exchange')}>
                    <span className={styles.roleCode}>{ov.market}</span>
                  </td>
                  <td data-label={tx('Fecha Programada', 'Scheduled Date')}>
                    {ov.date}
                  </td>
                  <td data-label={tx('Estado de la Bolsa', 'Market Status')}>
                    {ov.closed ? (
                      <span className={styles.statusPending}>
                        {tx('Bolsa Cerrada', 'Market Closed')}
                      </span>
                    ) : (
                      <span className={styles.statusActive}>
                        {tx('Cierre Anticipado', 'Early Close')}
                      </span>
                    )}
                  </td>
                  <td data-label={tx('Horario Aplicable', 'Effective Hours')}>
                    {ov.closed
                      ? tx('Sin operaciones', 'No trading')
                      : `${ov.open_time} - ${ov.close_time} EST`}
                  </td>
                  <td data-label={tx('Acción', 'Action')}>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => onDeleteOverride(ov.id)}
                    >
                      {tx('Eliminar', 'Remove')}
                    </button>
                  </td>
                </tr>
              ))}
              {overrides.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    {tx(
                      'No hay excepciones de calendario registradas actualmente.',
                      'No calendar overrides are currently scheduled.',
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
