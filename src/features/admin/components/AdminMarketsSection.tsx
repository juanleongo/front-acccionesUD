'use client';

import type { FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
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
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Supervisión de Horarios y Calendario Bursátil (Wall Street)</h1>
        <p>
          Consulta y configura los horarios de operación, los días festivos y
          los cierres anticipados de los mercados de Estados Unidos.
        </p>
      </div>

      {/* Horario por defecto */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Horario Estándar de Negociación</h2>
          <span className={styles.headerMeta}>
            Zona Horaria: Eastern Standard Time (EST / New York)
          </span>
        </div>

        <form onSubmit={onSaveSchedule}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Mercado Objetivo</label>
              <select
                value={selectedMarket}
                onChange={(e) => onChangeMarket(e.target.value)}
              >
                <option value="NYSE">NYSE (New York Stock Exchange)</option>
                <option value="NASDAQ">NASDAQ Stock Market</option>
                <option value="AMEX">NYSE American (AMEX)</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label>Hora de Apertura (EST)</label>
              <input
                type="time"
                value={openTime}
                onChange={(e) => onChangeOpenTime(e.target.value)}
                required
              />
              <small>Campana de apertura habitual: 09:30 AM</small>
            </div>

            <div className={styles.formField}>
              <label>Hora de Cierre (EST)</label>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => onChangeCloseTime(e.target.value)}
                required
              />
              <small>Campana de cierre habitual: 04:00 PM (16:00)</small>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>
              <Icon name="check" size={14} /> Guardar Horario Estándar para{' '}
              {selectedMarket}
            </button>
          </div>
        </form>
      </div>

      {/* Registro de excepciones / Feriados */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>
            Excepciones de Calendario Bursátil (Feriados y Cierres Anticipados)
          </h2>
        </div>

        <form onSubmit={onCreateOverride} className={styles.overrideForm}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Fecha de la Excepción</label>
              <input
                type="date"
                value={newOverrideDate}
                onChange={(e) => onChangeOverrideDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label>Tipo de Excepción</label>
              <select
                value={newOverrideClosed ? 'closed' : 'early'}
                onChange={(e) =>
                  onChangeOverrideClosed(e.target.value === 'closed')
                }
              >
                <option value="closed">
                  Mercado Totalmente Cerrado (Feriado Oficial)
                </option>
                <option value="early">
                  Cierre Anticipado (Early Close a la 1:00 PM EST)
                </option>
              </select>
            </div>

            {!newOverrideClosed && (
              <>
                <div className={styles.formField}>
                  <label>Hora Apertura</label>
                  <input
                    type="time"
                    value={newOverrideOpenTime}
                    onChange={(e) => onChangeOverrideOpenTime(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Hora Cierre</label>
                  <input
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
              + Agregar Excepción al Calendario
            </button>
          </div>
        </form>

        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Mercado</th>
                <th>Fecha Programada</th>
                <th>Estado de la Bolsa</th>
                <th>Horario Aplicable</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((ov) => (
                <tr key={ov.id}>
                  <td>
                    <strong>{ov.market}</strong>
                  </td>
                  <td>{ov.date}</td>
                  <td>
                    {ov.closed ? (
                      <span className={styles.statusPending}>
                        Bolsa Cerrada
                      </span>
                    ) : (
                      <span className={styles.statusActive}>
                        Cierre Anticipado
                      </span>
                    )}
                  </td>
                  <td>
                    {ov.closed
                      ? 'Sin operaciones'
                      : `${ov.open_time} - ${ov.close_time} EST`}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => onDeleteOverride(ov.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
