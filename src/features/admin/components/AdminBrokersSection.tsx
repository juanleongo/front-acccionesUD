'use client';

import { Icon } from '@/components/ui/Icon';
import type { PendingBrokerItem } from '../admin-api';
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
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Activación de comisionistas</h1>
        <p>
          Revisa la información de cada solicitud antes de habilitar el acceso
          como comisionista.
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Directorio de Solicitudes y Asesores Registrados</h2>
          <span className={styles.headerMeta}>
            Total evaluados: {brokers.length} profesionales
          </span>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Nombre y Contacto</th>
                <th>Acreditación AMV</th>
                <th>Especialidad en Mercados USA</th>
                <th>Fecha de Solicitud</th>
                <th>Estatus</th>
                <th>Operación</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map((broker) => (
                <tr key={broker.userId}>
                  <td>
                    <strong>{broker.fullName}</strong>
                    <div className={styles.cellMeta}>
                      {broker.email} · País: {broker.country}
                    </div>
                  </td>
                  <td>
                    <span className={styles.codeTag}>{broker.licenseAMV}</span>
                  </td>
                  <td>{broker.specialty}</td>
                  <td className={styles.mutedText}>{broker.requestedAt}</td>
                  <td>
                    {broker.status === 'active' ? (
                      <span className={styles.statusActive}>Activo</span>
                    ) : (
                      <span className={styles.statusPending}>
                        Pendiente de activación
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
                        <Icon name="check" size={14} /> Activar comisionista
                      </button>
                    ) : (
                      <span className={styles.cellMeta}>Acceso habilitado</span>
                    )}
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
