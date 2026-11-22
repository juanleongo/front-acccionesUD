'use client';

import { Icon } from '@/components/ui/Icon';
import { formatDecimalNumber } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { PendingBrokerItem } from '../admin-api';
import styles from '../admin.module.css';

export interface AdminKpiSectionProps {
  pendingCount: number;
  usersCount: number;
  brokers: PendingBrokerItem[];
  processingId: string | null;
  onViewAllBrokers: () => void;
  onActivateBroker: (broker: PendingBrokerItem) => void;
}

export function AdminKpiSection({
  pendingCount,
  usersCount,
  brokers,
  processingId,
  onViewAllBrokers,
  onActivateBroker,
}: AdminKpiSectionProps) {
  const { locale, tx } = useLocale();
  const pendingBrokers = brokers.filter(
    (b) => b.status === 'pending_broker_activation',
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>
          {tx(
            'Consola Ejecutiva · Wall Street',
            'Executive Console · Wall Street',
          )}
        </span>
        <h1>{tx('Resumen de administración', 'Administration Overview')}</h1>
        <p>
          {tx(
            'Consulta las cuentas, los mercados y las solicitudes que requieren tu atención.',
            'Review accounts, market schedules, and broker applications requiring attention.',
          )}
        </p>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Icon name="users" size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <small>{tx('Comisionistas Pendientes', 'Pending Brokers')}</small>
            <strong>{formatDecimalNumber(pendingCount, locale, 0)}</strong>
            <span>
              {tx('Solicitudes por revisar', 'Applications to review')}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Icon name="user" size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <small>{tx('Usuarios Registrados', 'Registered Users')}</small>
            <strong>{formatDecimalNumber(usersCount, locale, 0)}</strong>
            <span>{tx('Cuentas en la plataforma', 'Platform accounts')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Icon name="trend" size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <small>{tx('Mercados Bursátiles', 'Stock Markets')}</small>
            <strong>{tx('3 Bolsas', '3 Exchanges')}</strong>
            <span>NYSE · NASDAQ · NYSE Arca</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Icon name="shield" size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <small>{tx('Políticas de Seguridad', 'Security Policies')}</small>
            <strong>{tx('2FA Obligatorio', 'Mandatory 2FA')}</strong>
            <span>
              {tx(
                'Protección RBAC y TOTP Activa',
                'RBAC & TOTP Protection Active',
              )}
            </span>
          </div>
        </div>
      </div>

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
                  <td>
                    <strong>{broker.fullName}</strong>
                    <div className={styles.cellMeta}>
                      {broker.email} · {broker.phone}
                    </div>
                  </td>
                  <td>
                    <code className={styles.codeTag}>{broker.licenseAMV}</code>
                  </td>
                  <td>{broker.specialty}</td>
                  <td>
                    <span className={styles.statusPending}>
                      {tx('Pendiente de activación', 'Pending activation')}
                    </span>
                  </td>
                  <td>
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
              {pendingCount === 0 && (
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
