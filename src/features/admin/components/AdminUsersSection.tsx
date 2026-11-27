'use client';

import { useMemo, useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type { ManagedUserItem } from '../admin-api';
import { formatAdminDate, formatRoleLabel } from '../admin-labels';
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
  const { locale, tx } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((usr) => {
      if (roleFilter && usr.role !== roleFilter) return false;
      if (planFilter === 'premium' && !usr.isPremium) return false;
      if (planFilter === 'standard' && usr.isPremium) return false;
      if (!q) return true;
      return (
        usr.fullName.toLowerCase().includes(q) ||
        usr.email.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, roleFilter, planFilter]);

  const hasFilters = Boolean(searchQuery.trim() || roleFilter || planFilter);

  return (
    <div>
      <div className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>
          {tx('Directorio de Identidades & KYC', 'Identity Directory & KYC')}
        </span>
        <h1>{tx('Usuarios y plan prémium', 'Users & Premium Plan')}</h1>
        <p>
          {tx(
            'Consulta las cuentas registradas, filtra sobre los registros cargados y administra el acceso al plan prémium.',
            'Inspect registered accounts, filter loaded records, and manage Premium plan access.',
          )}
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>
            {tx('Directorio General de Usuarios', 'General User Directory')}
          </h2>
          <span className={styles.headerMeta}>
            {tx(
              `Mostrando ${filteredUsers.length} de ${users.length} cuentas cargadas`,
              `Showing ${filteredUsers.length} of ${users.length} loaded accounts`,
            )}
          </span>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filterSearchField}>
            <label htmlFor="admin-users-search" className={styles.filterLabel}>
              {tx('Buscar usuario o correo', 'Search user or email')}
            </label>
            <div className={styles.filterInputShell}>
              <span className={styles.filterSearchIcon} aria-hidden="true">
                <Icon name="search" size={16} />
              </span>
              <input
                id="admin-users-search"
                type="search"
                className={styles.filterSearchInput}
                placeholder={tx(
                  'Nombre completo o correo electrónico…',
                  'Full name or email address…',
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterSelectField}>
            <label htmlFor="admin-users-role" className={styles.filterLabel}>
              {tx('Rol asignado', 'Assigned role')}
            </label>
            <CustomSelect
              id="admin-users-role"
              compact
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: '', label: tx('Todos los roles', 'All roles') },
                {
                  value: 'investor',
                  label: formatRoleLabel('investor', locale),
                },
                { value: 'broker', label: formatRoleLabel('broker', locale) },
                {
                  value: 'administrator',
                  label: formatRoleLabel('administrator', locale),
                },
              ]}
            />
          </div>

          <div className={styles.filterSelectField}>
            <label htmlFor="admin-users-plan" className={styles.filterLabel}>
              {tx('Plan', 'Plan')}
            </label>
            <CustomSelect
              id="admin-users-plan"
              compact
              value={planFilter}
              onChange={setPlanFilter}
              options={[
                { value: '', label: tx('Todos los planes', 'All plans') },
                {
                  value: 'premium',
                  label: tx('★ Plan Prémium', '★ Premium'),
                },
                { value: 'standard', label: tx('Estándar', 'Standard') },
              ]}
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('');
                setPlanFilter('');
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
                <th>{tx('Usuario / Correo', 'User / Email')}</th>
                <th>{tx('Rol Asignado', 'Assigned Role')}</th>
                <th>{tx('Estatus Prémium', 'Premium Status')}</th>
                <th>{tx('Estado de Cuenta', 'Account Status')}</th>
                <th>{tx('Fecha de Alta', 'Registered')}</th>
                <th>{tx('Acción Prémium', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((usr) => (
                <tr key={usr.userId}>
                  <td data-label={tx('Usuario / Correo', 'User / Email')}>
                    <strong>{usr.fullName}</strong>
                    <div className={styles.cellMeta}>{usr.email}</div>
                  </td>
                  <td data-label={tx('Rol Asignado', 'Assigned Role')}>
                    <span className={styles.roleCode}>
                      {formatRoleLabel(usr.role, locale)}
                    </span>
                  </td>
                  <td data-label={tx('Estatus Prémium', 'Premium Status')}>
                    {usr.isPremium ? (
                      <span className={styles.badgePremium}>
                        {tx('★ Plan Prémium', '★ Premium Plan')}
                      </span>
                    ) : (
                      <span className={styles.badgeStandard}>
                        {tx('Estándar', 'Standard')}
                      </span>
                    )}
                  </td>
                  <td data-label={tx('Estado de Cuenta', 'Account Status')}>
                    <span
                      className={
                        usr.accountStatus === 'active'
                          ? styles.statusActive
                          : styles.statusPending
                      }
                    >
                      {usr.accountStatus === 'active'
                        ? tx('Activo', 'Active')
                        : usr.accountStatus === 'pending_broker_activation'
                          ? tx('Pendiente de activación', 'Pending activation')
                          : tx('Por revisar', 'Under review')}
                    </span>
                  </td>
                  <td
                    className={styles.mutedText}
                    data-label={tx('Fecha de Alta', 'Registered')}
                  >
                    {formatAdminDate(usr.registeredAt, locale)}
                  </td>
                  <td data-label={tx('Acción Prémium', 'Actions')}>
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
                          ? tx('Revocar Prémium', 'Revoke Premium')
                          : tx('★ Otorgar Prémium', '★ Grant Premium')}
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        disabled={processingId === usr.userId}
                        onClick={() => onReconcileKyc(usr)}
                        title={tx(
                          'Actualizar la verificación de identidad',
                          'Reconcile identity verification status',
                        )}
                      >
                        {tx('Reconciliar KYC', 'Reconcile KYC')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    {tx(
                      'No encontramos cuentas registradas que coincidan con tu búsqueda.',
                      'No loaded user accounts match your filter.',
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
