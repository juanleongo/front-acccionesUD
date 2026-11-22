'use client';

import { useMemo } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { formatMarketDateTime } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { AuditEntry, ManagedUserItem } from '../admin-api';
import { formatActionLabel } from '../admin-labels';
import styles from '../admin.module.css';

export interface AdminAuditSectionProps {
  auditLogs: AuditEntry[];
  users: ManagedUserItem[];
  auditFilterAction: string;
  loading?: boolean;
  onChangeFilterAction: (next: string) => void;
}

export function AdminAuditSection({
  auditLogs,
  users,
  auditFilterAction,
  loading = false,
  onChangeFilterAction,
}: AdminAuditSectionProps) {
  const { locale, tx } = useLocale();
  const filteredLogs = useMemo(
    () =>
      auditLogs.filter(
        (entry) => !auditFilterAction || entry.action === auditFilterAction,
      ),
    [auditLogs, auditFilterAction],
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>
          {tx('Trazabilidad & Cumplimiento', 'Traceability & Compliance')}
        </span>
        <h1>{tx('Bitácora de auditoría', 'Audit Log')}</h1>
        <p>
          {tx(
            'Revisa las acciones administrativas, quién las realizó y cuándo ocurrieron.',
            'Review administrative actions, who performed them, and when they occurred.',
          )}
        </p>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h2>{tx('Eventos Registrados', 'Recorded Events')}</h2>
            <span className={styles.headerMeta}>
              {loading
                ? tx('Consultando eventos…', 'Loading events…')
                : tx(
                    `${filteredLogs.length} eventos mostrados`,
                    `${filteredLogs.length} events shown`,
                  )}
            </span>
          </div>
          <div className={styles.auditSelectWrap}>
            <CustomSelect
              compact
              align="right"
              ariaLabel={tx(
                'Filtrar por acción de auditoría',
                'Filter by audit action',
              )}
              value={auditFilterAction}
              onChange={onChangeFilterAction}
              options={[
                {
                  value: '',
                  label: tx('Todas las acciones', 'All actions'),
                },
                {
                  value: 'administrator_created',
                  label: formatActionLabel('administrator_created', locale),
                },
                {
                  value: 'broker_activated',
                  label: formatActionLabel('broker_activated', locale),
                },
                {
                  value: 'premium_changed',
                  label: formatActionLabel('premium_changed', locale),
                },
                {
                  value: 'role_assignment_created',
                  label: formatActionLabel('role_assignment_created', locale),
                },
                {
                  value: 'role_assignment_revoked',
                  label: formatActionLabel('role_assignment_revoked', locale),
                },
                {
                  value: 'kyc_reconciled',
                  label: formatActionLabel('kyc_reconciled', locale),
                },
              ]}
            />
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>{tx('Fecha / Hora', 'Date / Time')}</th>
                <th>{tx('Acción', 'Action')}</th>
                <th>{tx('Responsable', 'Actor')}</th>
                <th>{tx('Objetivo', 'Target')}</th>
                <th>{tx('Detalles', 'Details')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((entry) => (
                <tr key={entry.id}>
                  <td className={styles.mutedText}>
                    {formatMarketDateTime(entry.occurred_at, locale)}
                  </td>
                  <td>
                    <span className={styles.roleCode}>
                      {formatActionLabel(entry.action, locale)}
                    </span>
                  </td>
                  <td>
                    <span>
                      {users.find((user) => user.userId === entry.actor_user_id)
                        ?.fullName ?? tx('Administrador', 'Administrator')}
                    </span>
                  </td>
                  <td>
                    <strong>{entry.target_type}:</strong>{' '}
                    <code className={styles.codeTag}>
                      {entry.target_id.slice(0, 12)}…
                    </code>
                  </td>
                  <td>
                    <code className={styles.payloadCode}>
                      {JSON.stringify(entry.payload)}
                    </code>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>
                    {loading
                      ? tx(
                          'Cargando registros de auditoría…',
                          'Loading audit log records…',
                        )
                      : tx(
                          'No se encontraron eventos de auditoría para la acción seleccionada.',
                          'No audit events found for the selected action.',
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
