'use client';

import { defaultSystemPermissions, defaultSystemRoles } from '../admin-api';
import {
  permissionLabels,
  roleDescriptions,
  roleLabels,
} from '../admin-labels';
import styles from '../admin.module.css';

export function AdminRbacSection() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Roles y permisos</h1>
        <p>
          Consulta las acciones disponibles para cada rol. Debe permanecer al
          menos un administrador activo.
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Roles del Sistema y Matriz de Permisos</h2>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Rol del Sistema</th>
                <th>Permisos Habilitados</th>
                <th>Alcance y Responsabilidad</th>
              </tr>
            </thead>
            <tbody>
              {defaultSystemRoles.map((r) => (
                <tr key={r.role}>
                  <td>
                    <strong className={styles.roleTitle}>
                      {roleLabels[r.role] ?? r.role}
                    </strong>
                  </td>
                  <td>
                    <div className={styles.permissionList}>
                      {r.permissions.map((p) => (
                        <code
                          key={permissionLabels[p] ?? p}
                          className={styles.permissionChip}
                        >
                          {permissionLabels[p] ?? p}
                        </code>
                      ))}
                    </div>
                  </td>
                  <td className={styles.roleScopeCell}>
                    {roleDescriptions[r.role] ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Permisos disponibles</h2>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Permiso</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {defaultSystemPermissions.map((perm) => (
                <tr key={perm.code}>
                  <td>
                    <span>{permissionLabels[perm.code] ?? perm.code}</span>
                  </td>
                  <td className={styles.mutedText}>{perm.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
