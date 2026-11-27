'use client';

import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type { PendingBrokerItem } from '../admin-api';
import styles from '../admin.module.css';

export interface AdminKpiSectionProps {
  brokers: PendingBrokerItem[];
  processingId: string | null;
  onViewAllBrokers: () => void;
  onActivateBroker: (broker: PendingBrokerItem) => void;
}

export function AdminKpiSection({
  brokers,
  processingId,
  onViewAllBrokers,
  onActivateBroker,
}: AdminKpiSectionProps) {
  const { tx } = useLocale();
  const pendingBrokers = brokers.filter(
    (b) => b.status === 'pending_broker_activation',
  );

  return (
    <div>
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>{tx('Solicitudes pendientes', 'Pending Applications')}</h2>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onViewAllBrokers}
          >
            {tx('Ver Todos los Comisionistas', 'View All Brokers')}
            <Icon name="arrow" size={14} />
          </button>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>{tx('Candidato a Comisionista', 'Broker Candidate')}</th>
                <th>{tx('Licencia AMV Reportada', 'Reported AMV License')}</th>
                <th>{tx('Especialidad en EE. UU.', 'US Market Specialty')}</th>
                <th>{tx('Estado Actual', 'Current Status')}</th>
                <th>{tx('Acción de Auditoría', 'Audit Action')}</th>
              </tr>
            </thead>
            <tbody>
              {pendingBrokers.map((broker) => (
                <tr key={broker.userId}>
                  <td
                    data-label={tx(
                      'Candidato a Comisionista',
                      'Broker Candidate',
                    )}
                  >
                    <strong>{broker.fullName}</strong>
                    <div className={styles.cellMeta}>
                      {broker.email} · {broker.phone}
                    </div>
                  </td>
                  <td
                    data-label={tx(
                      'Licencia AMV Reportada',
                      'Reported AMV License',
                    )}
                  >
                    <code className={styles.codeTag}>{broker.licenseAMV}</code>
                  </td>
                  <td
                    data-label={tx(
                      'Especialidad en EE. UU.',
                      'US Market Specialty',
                    )}
                  >
                    {broker.specialty}
                  </td>
                  <td data-label={tx('Estado Actual', 'Current Status')}>
                    <span className={styles.statusPending}>
                      {tx('Pendiente de activación', 'Pending activation')}
                    </span>
                  </td>
                  <td data-label={tx('Acción de Auditoría', 'Audit Action')}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      disabled={processingId === broker.userId}
                      onClick={() => onActivateBroker(broker)}
                    >
                      <Icon name="check" size={14} />{' '}
                      {tx('Aprobar y activar', 'Approve & activate')}
                    </button>
                  </td>
                </tr>
              ))}
              {pendingBrokers.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    {tx(
                      'No hay solicitudes de comisionistas pendientes de aprobación. Todos los asesores están al día.',
                      'No pending broker approval requests. All advisors are up to date.',
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
