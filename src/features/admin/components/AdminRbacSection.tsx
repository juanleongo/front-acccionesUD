'use client';

import { useLocale } from '@/lib/i18n';
import { defaultSystemPermissions, defaultSystemRoles } from '../admin-api';
import {
  formatPermissionDescription,
  formatPermissionLabel,
  formatRoleDescription,
  formatRoleLabel,
} from '../admin-labels';
import styles from '../admin.module.css';

export function AdminRbacSection() {
  const { locale, tx } = useLocale();
  return (
    <div>
      <div className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>
          {tx(
            'Seguridad Institucional · RBAC',
            'Institutional Security · RBAC',
          )}
        </span>
        <h1>{tx('Roles y permisos', 'Roles & Permissions')}</h1>
        <p>
          {tx(
            'Consulta las acciones disponibles para cada rol. Debe permanecer al menos un administrador activo.',
            'Review actions available to each role. At least one active administrator must remain.',
          )}
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>
            {tx(
              'Roles del Sistema y Matriz de Permisos',
              'System Roles & Permission Matrix',
            )}
          </h2>
          <span className={styles.headerMeta}>
            {defaultSystemRoles.length} {tx('roles activos', 'active roles')}
          </span>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>{tx('Rol del Sistema', 'System Role')}</th>
                <th>{tx('Permisos Habilitados', 'Enabled Permissions')}</th>
                <th>
                  {tx('Alcance y Responsabilidad', 'Scope & Responsibility')}
                </th>
              </tr>
            </thead>
            <tbody>
              {defaultSystemRoles.map((r) => (
                <tr key={r.role}>
                  <td>
                    <span className={styles.roleCode}>
                      {formatRoleLabel(r.role, locale)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.permissionList}>
                      {r.permissions.map((p) => (
                        <span key={p} className={styles.permissionChip}>
                          {formatPermissionLabel(p, locale)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={styles.roleScopeCell}>
                    {formatRoleDescription(r.role, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>{tx('Permisos disponibles', 'Available Permissions')}</h2>
          <span className={styles.headerMeta}>
            {defaultSystemPermissions.length}{' '}
            {tx('capacidades registradas', 'registered capabilities')}
          </span>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>{tx('Permiso', 'Permission')}</th>
                <th>{tx('Descripción', 'Description')}</th>
              </tr>
            </thead>
            <tbody>
              {defaultSystemPermissions.map((perm) => (
                <tr key={perm.code}>
                  <td>
                    <strong>{formatPermissionLabel(perm.code, locale)}</strong>
                    <div className={styles.cellMeta}>
                      <code className={styles.codeTag}>{perm.code}</code>
                    </div>
                  </td>
                  <td className={styles.mutedText}>
                    {formatPermissionDescription(
                      perm.code,
                      locale,
                      perm.description,
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
