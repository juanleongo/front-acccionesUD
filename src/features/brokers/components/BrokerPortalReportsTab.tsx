'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import styles from '../brokers.module.css';

export interface PendingOrderReviewItem {
  id: string;
  investor_name: string;
  symbol: string;
  side: string;
  qty: string;
  type: string;
  limit_price: string;
  notional_usd: string;
  status: string;
}

export function BrokerPortalReviewsTab({
  pendingOrderReviews,
  onApproveOrder,
  onRejectOrder,
  onGenerateCertificate,
}: {
  pendingOrderReviews: PendingOrderReviewItem[];
  onApproveOrder: (order: PendingOrderReviewItem) => void;
  onRejectOrder: (order: PendingOrderReviewItem) => void;
  onGenerateCertificate: () => void;
}) {
  const { tx } = useLocale();
  return (
    <div className={styles.card} role="tabpanel">
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h3 className={styles.cardTitle}>
            {tx(
              'Bandeja de Órdenes en Revisión y Comisiones del Asesor',
              'Order Review Inbox & Advisor Commissions',
            )}
          </h3>
          <p className={styles.cardDesc}>
            {tx(
              'Supervisa las órdenes enviadas por tus clientes y consulta el consolidado de tus comisiones devengadas.',
              'Review orders submitted by your clients and inspect your accrued commissions summary.',
            )}
          </p>
        </div>
      </div>

      <div className={styles.controlsGrid}>
        {pendingOrderReviews.length === 0 ? (
          <div className={styles.emptyNoticeCompact}>
            {tx(
              'Sin órdenes pendientes de firma. Todas las órdenes de tus clientes han sido revisadas.',
              'No orders pending review. All client orders have been reviewed.',
            )}
          </div>
        ) : (
          pendingOrderReviews.map((ord) => (
            <div key={ord.id} className={styles.controlBox}>
              <div className={styles.controlTop}>
                <div className={styles.proposalTitleGroup}>
                  <span
                    className={
                      ord.side === 'buy' ? styles.sideBuy : styles.sideSell
                    }
                  >
                    {ord.side === 'buy'
                      ? tx('Compra', 'Buy')
                      : tx('Venta', 'Sell')}
                  </span>
                  <strong className={styles.proposalSymbol}>
                    {ord.qty} {ord.symbol}
                  </strong>
                </div>
                <span className={styles.badgeWarning}>
                  {tx('En revisión', 'In review')}
                </span>
              </div>

              <div>
                <div className={styles.controlTitle}>{ord.investor_name}</div>
                <p className={styles.controlHint}>
                  {tx('Modalidad:', 'Type:')}{' '}
                  {ord.type === 'limit'
                    ? tx('Límite', 'Limit')
                    : tx('Mercado', 'Market')}{' '}
                  ({formatUsd(ord.limit_price, { withCode: true })}) ·{' '}
                  {tx('Monto estimado:', 'Est. total:')}{' '}
                  <strong>
                    {formatUsd(ord.notional_usd, { withCode: true })}
                  </strong>
                </p>
              </div>

              <div className={styles.btnRow}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => onApproveOrder(ord)}
                >
                  {tx('✓ Aprobar Orden del Cliente', '✓ Approve Client Order')}
                </button>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={() => onRejectOrder(ord)}
                >
                  {tx('✕ Rechazar', '✕ Reject')}
                </button>
              </div>
            </div>
          ))
        )}

        <div className={styles.commissionBox}>
          <div className={styles.controlHeadingGroup}>
            <span className={styles.controlIconBadge} aria-hidden="true">
              <Icon name="coin" size={16} />
            </span>
            <div className={styles.controlTitle}>
              {tx(
                'Liquidación de Comisiones del Asesor (40% del 2% Total)',
                'Advisor Commission Settlement (40% of 2% Fee)',
              )}
            </div>
          </div>

          <div className={styles.proposalMetaGrid}>
            <div className={styles.statTile}>
              <span>{tx('Volumen del mes', 'Monthly volume')}</span>
              <strong>{formatUsd(64572, { withCode: true })}</strong>
            </div>
            <div className={styles.statTile}>
              <span>{tx('Comisión neta (0.8%)', 'Net fee (0.8%)')}</span>
              <strong>{formatUsd(516.58, { withCode: true })}</strong>
            </div>
          </div>

          <div className={styles.btnRow}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onGenerateCertificate}
            >
              <Icon name="file" size={15} />
              {tx(
                'Generar Certificado de Comisiones',
                'Generate Commission Statement',
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrokerPortalProfileTab({
  onSaveProfile,
}: {
  onSaveProfile: () => void;
}) {
  const { tx } = useLocale();
  const [specialty, setSpecialty] = useState(
    'Tecnología, Semiconductores & S&P 500 (NASDAQ / NYSE)',
  );
  const [years, setYears] = useState('11');
  const [certs, setCerts] = useState(
    'FINRA Series 7, CFA Level III, AMV Renta Variable',
  );
  const [desc, setDesc] = useState(
    'Estratega senior en acciones de gran capitalización en EE. UU., cobertura cambiaria USD y carteras de crecimiento tecnológico.',
  );
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const numericYears = Number(years);
    if (!specialty.trim()) {
      setError(
        tx(
          'Indica tu especialidad bursátil principal.',
          'Enter your primary equity advisory specialty.',
        ),
      );
      return;
    }
    if (
      !Number.isInteger(numericYears) ||
      numericYears < 0 ||
      numericYears > 60
    ) {
      setError(
        tx(
          'Ingresa los años de experiencia entre 0 y 60.',
          'Enter years of experience between 0 and 60.',
        ),
      );
      return;
    }
    if (!certs.trim()) {
      setError(
        tx(
          'Registra al menos una certificación profesional.',
          'Enter at least one professional certification.',
        ),
      );
      return;
    }
    setError('');
    onSaveProfile();
  }

  return (
    <form
      className={styles.card}
      onSubmit={handleSubmit}
      role="tabpanel"
      noValidate
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h3 className={styles.cardTitle}>
            {tx(
              'Actualizar Mi Perfil Profesional en el Directorio',
              'Update My Directory Professional Profile',
            )}
          </h3>
          <p className={styles.cardDesc}>
            {tx(
              'Estos datos son públicos en el directorio de asesores e impulsan las recomendaciones para nuevos inversionistas.',
              'This profile is public in the advisor directory and helps investors discover your practice.',
            )}
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prof-specialty" className={styles.fieldLabel}>
            {tx('Especialidad Bursátil', 'Market Specialty')}
          </label>
          <input
            id="broker-prof-specialty"
            type="text"
            className={styles.inputField}
            value={specialty}
            onChange={(e) => {
              setSpecialty(e.target.value);
              setError('');
            }}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prof-years" className={styles.fieldLabel}>
            {tx('Años de Experiencia (0–60)', 'Years of Experience (0–60)')}
          </label>
          <input
            id="broker-prof-years"
            type="number"
            min={0}
            max={60}
            className={styles.inputField}
            value={years}
            onChange={(e) => {
              setYears(e.target.value);
              setError('');
            }}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prof-certs" className={styles.fieldLabel}>
            {tx(
              'Certificaciones (separadas por coma)',
              'Certifications (comma-separated)',
            )}
          </label>
          <input
            id="broker-prof-certs"
            type="text"
            className={styles.inputField}
            value={certs}
            onChange={(e) => {
              setCerts(e.target.value);
              setError('');
            }}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prof-desc" className={styles.fieldLabel}>
            {tx(
              'Descripción / Biografía Profesional',
              'Professional Summary / Bio',
            )}
          </label>
          <input
            id="broker-prof-desc"
            type="text"
            className={styles.inputField}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}

      <div className={styles.btnRow}>
        <button type="submit" className={styles.primaryBtn}>
          <Icon name="check" size={15} />
          {tx('Guardar Perfil de Comisionista', 'Save Broker Profile')}
        </button>
      </div>
    </form>
  );
}
