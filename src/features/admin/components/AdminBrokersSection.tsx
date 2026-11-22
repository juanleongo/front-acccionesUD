'use client';

import { useMemo, useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type { PendingBrokerItem } from '../admin-api';
import { formatAdminDate } from '../admin-labels';
import styles from '../admin.module.css';

export interface AdminBrokersSectionProps {
  brokers: PendingBrokerItem[];
  processingId: string | null;
  onActivateBroker: (broker: PendingBrokerItem) => void;
}

export function AdminBrokersSection({
  brokers,
  processingId,
  onActivateBroker,
}: AdminBrokersSectionProps) {
  const { locale, tx } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredBrokers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return brokers.filter((broker) => {
      if (statusFilter && broker.status !== statusFilter) return false;
      if (!q) return true;
      return (
        broker.fullName.toLowerCase().includes(q) ||
        broker.email.toLowerCase().includes(q) ||
        broker.licenseAMV.toLowerCase().includes(q) ||
        broker.specialty.toLowerCase().includes(q)
      );
    });
  }, [brokers, searchQuery, statusFilter]);

  const hasFilters = Boolean(searchQuery.trim() || statusFilter);

  return (
    <div>
      <div className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>
          {tx(
            'Acreditación & Cumplimiento AMV',
            'AMV Accreditation & Compliance',
          )}
        </span>
        <h1>{tx('Activación de comisionistas', 'Broker Activation')}</h1>
        <p>
          {tx(
            'Revisa la información de cada solicitud antes de habilitar el acceso como comisionista.',
            'Review each application before enabling broker access.',
          )}
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>
            {tx(
              'Directorio de Solicitudes y Asesores Registrados',
              'Applications & Registered Brokers Directory',
            )}
          </h2>
          <span className={styles.headerMeta}>
            {tx(
              `Mostrando ${filteredBrokers.length} de ${brokers.length} profesionales`,
              `Showing ${filteredBrokers.length} of ${brokers.length} professionals`,
            )}
          </span>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filterSearchField}>
            <label
              htmlFor="admin-brokers-search"
              className={styles.filterLabel}
            >
              {tx('Buscar profesional o licencia', 'Search broker or license')}
            </label>
            <div className={styles.filterInputShell}>
              <span className={styles.filterSearchIcon} aria-hidden="true">
                <Icon name="search" size={16} />
              </span>
              <input
                id="admin-brokers-search"
                type="search"
                className={styles.filterSearchInput}
                placeholder={tx(
                  'Nombre, correo, licencia AMV o especialidad…',
                  'Name, email, AMV license, or specialty…',
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterSelectField}>
            <label
              htmlFor="admin-brokers-status"
              className={styles.filterLabel}
            >
              {tx('Estatus', 'Status')}
            </label>
            <CustomSelect
              id="admin-brokers-status"
              compact
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: tx('Todos los estados', 'All statuses') },
                {
                  value: 'pending_broker_activation',
                  label: tx('Pendiente de activación', 'Pending activation'),
                },
                { value: 'active', label: tx('Activo', 'Active') },
              ]}
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
              }}
            >
              {tx('Limpiar filtros', 'Clear filters')}
            </button>
          )}
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>{tx('Nombre y Contacto', 'Name & Contact')}</th>
                <th>{tx('Acreditación AMV', 'AMV Accreditation')}</th>
                <th>
                  {tx('Especialidad en Mercados USA', 'US Market Specialty')}
                </th>
                <th>{tx('Fecha de Solicitud', 'Application Date')}</th>
                <th>{tx('Estatus', 'Status')}</th>
                <th>{tx('Operación', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrokers.map((broker) => (
                <tr key={broker.userId}>
                  <td>
                    <strong>{broker.fullName}</strong>
                    <div className={styles.cellMeta}>
                      {broker.email} · {tx('País:', 'Country:')}{' '}
                      {broker.country}
                    </div>
                  </td>
                  <td>
                    <code className={styles.codeTag}>{broker.licenseAMV}</code>
                  </td>
                  <td>{broker.specialty}</td>
                  <td className={styles.mutedText}>
                    {formatAdminDate(broker.requestedAt, locale)}
                  </td>
                  <td>
                    {broker.status === 'active' ? (
                      <span className={styles.statusActive}>
                        {tx('Activo', 'Active')}
                      </span>
                    ) : (
                      <span className={styles.statusPending}>
                        {tx('Pendiente de activación', 'Pending activation')}
                      </span>
                    )}
                  </td>
                  <td>
                    {broker.status === 'pending_broker_activation' ? (
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        disabled={processingId === broker.userId}
                        onClick={() => onActivateBroker(broker)}
                      >
                        <Icon name="check" size={14} />{' '}
                        {tx('Activar comisionista', 'Activate broker')}
                      </button>
                    ) : (
                      <span className={styles.cellMeta}>
                        {tx('Acceso habilitado', 'Access enabled')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBrokers.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    {tx(
                      'No hay comisionistas que coincidan con el filtro aplicado.',
                      'No brokers match the current filter.',
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
