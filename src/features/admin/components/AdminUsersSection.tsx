'use client';

import type { ManagedUserItem } from '../admin-api';
import { roleLabels } from '../admin-labels';
import styles from '../admin.module.css';

export interface AdminUsersSectionProps {
  users: ManagedUserItem[];
  processingId: string | null;
  onTogglePremium: (user: ManagedUserItem) => void;
  onReconcileKyc: (user: ManagedUserItem) => void;
}

export function AdminUsersSection({
  users,
  processingId,
  onTogglePremium,
  onReconcileKyc,
}: AdminUsersSectionProps) {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Usuarios y plan prémium</h1>
        <p>
          Consulta las cuentas registradas y administra su acceso al plan
          prémium.
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Directorio General de Usuarios</h2>
          <span className={styles.headerMeta}>
            Total cuentas: {users.length}
          </span>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Usuario / Correo</th>
                <th>Rol Asignado</th>
                <th>Estatus Prémium</th>
                <th>Estado de Cuenta</th>
                <th>Fecha de Alta</th>
                <th>Acción Prémium</th>
              </tr>
            </thead>
            <tbody>
              {users.map((usr) => (
                <tr key={usr.userId}>
                  <td>
                    <strong>{usr.fullName}</strong>
                    <div className={styles.cellMeta}>{usr.email}</div>
                  </td>
                  <td>
                    <code className={styles.roleCode}>
                      {roleLabels[usr.role] ?? usr.role}
                    </code>
                  </td>
                  <td>
                    {usr.isPremium ? (
                      <span className={styles.badgePremium}>
                        ★ Plan Prémium
                      </span>
                    ) : (
                      <span className={styles.badgeStandard}>Estándar</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        usr.accountStatus === 'active'
                          ? styles.statusActive
                          : styles.statusPending
                      }
                    >
                      {usr.accountStatus === 'active'
                        ? 'Activo'
                        : usr.accountStatus === 'pending_broker_activation'
                          ? 'Pendiente de activación'
                          : 'Por revisar'}
                    </span>
                  </td>
                  <td className={styles.mutedText}>{usr.registeredAt}</td>
                  <td>
                    <div className={styles.inlineActions}>
                      <button
                        type="button"
                        className={
                          usr.isPremium ? styles.btnDanger : styles.btnSecondary
                        }
                        disabled={processingId === usr.userId}
                        onClick={() => onTogglePremium(usr)}
                      >
                        {usr.isPremium
                          ? 'Revocar Prémium'
                          : '★ Otorgar Prémium'}
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        disabled={processingId === usr.userId}
                        onClick={() => onReconcileKyc(usr)}
                        title="Actualizar la verificación de identidad"
                      >
                        Reconciliar KYC
                      </button>
                    </div>
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
