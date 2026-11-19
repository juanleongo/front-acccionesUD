'use client';

import { Icon } from '@/components/ui/Icon';
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
  const pendingBrokers = brokers.filter(
    (b) => b.status === 'pending_broker_activation',
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Resumen de administración</h1>
        <p>
          Consulta las cuentas, los mercados y las solicitudes que requieren tu
          atención.
        </p>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Icon name="users" size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <small>Comisionistas Pendientes</small>
            <strong>{pendingCount}</strong>
            <span>Solicitudes por revisar</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Icon name="user" size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <small>Usuarios Registrados</small>
            <strong>{usersCount}</strong>
            <span>Cuentas en la plataforma</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Icon name="trend" size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <small>Mercados Bursátiles</small>
            <strong>3 Bolsas</strong>
            <span>NYSE · NASDAQ · NYSE Arca</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Icon name="shield" size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <small>Políticas de Seguridad</small>
            <strong>2FA Obligatorio</strong>
            <span>Protección RBAC y TOTP Activa</span>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Solicitudes pendientes</h2>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onViewAllBrokers}
          >
            Ver Todos los Comisionistas →
          </button>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Candidato a Comisionista</th>
                <th>Licencia AMV Reportada</th>
                <th>Especialidad en EE. UU.</th>
                <th>Estado Actual</th>
                <th>Acción de Auditoría</th>
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
                      Pendiente de activación
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      disabled={processingId === broker.userId}
                      onClick={() => onActivateBroker(broker)}
                    >
                      <Icon name="check" size={14} /> Aprobar y activar
                    </button>
                  </td>
                </tr>
              ))}
              {pendingCount === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    No hay solicitudes de comisionistas pendientes de
                    aprobación. Todos los asesores están al día.
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
