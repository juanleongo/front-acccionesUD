'use client';

import type { AuditEntry, ManagedUserItem } from '../admin-api';
import { actionLabels } from '../admin-labels';
import styles from '../admin.module.css';

export interface AdminAuditSectionProps {
  auditLogs: AuditEntry[];
  users: ManagedUserItem[];
  auditFilterAction: string;
  onChangeFilterAction: (next: string) => void;
}

export function AdminAuditSection({
  auditLogs,
  users,
  auditFilterAction,
  onChangeFilterAction,
}: AdminAuditSectionProps) {
  const filteredLogs = auditLogs.filter(
    (entry) => !auditFilterAction || entry.action === auditFilterAction,
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Bitácora de auditoría</h1>
        <p>
          Revisa las acciones administrativas, quién las realizó y cuándo
          ocurrieron.
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Eventos Registrados</h2>
          <select
            className={styles.auditSelect}
            value={auditFilterAction}
            onChange={(e) => onChangeFilterAction(e.target.value)}
            aria-label="Filtrar por acción de auditoría"
          >
            <option value="">Todas las acciones</option>
            <option value="administrator_created">Administrador creado</option>
            <option value="broker_activated">Comisionista activado</option>
            <option value="premium_changed">Plan prémium actualizado</option>
            <option value="role_assignment_created">Rol asignado</option>
            <option value="role_assignment_revoked">Rol revocado</option>
            <option value="kyc_reconciled">
              Verificación de identidad actualizada
            </option>
          </select>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Acción</th>
                <th>Responsable</th>
                <th>Objetivo</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((entry) => (
                <tr key={entry.id}>
                  <td className={styles.mutedText}>
                    {new Date(entry.occurred_at).toLocaleString('es-CO')}
                  </td>
                  <td>
                    <span>
                      {actionLabels[entry.action] ?? 'Acción administrativa'}
                    </span>
                  </td>
                  <td>
                    <span>
                      {users.find((user) => user.userId === entry.actor_user_id)
                        ?.fullName ?? 'Administrador'}
                    </span>
                  </td>
                  <td>
                    <strong>{entry.target_type}:</strong>{' '}
                    <code>{entry.target_id.slice(0, 12)}…</code>
                  </td>
                  <td>
                    <code className={styles.payloadCode}>
                      {JSON.stringify(entry.payload)}
                    </code>
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
