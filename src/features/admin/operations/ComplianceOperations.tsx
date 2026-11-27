'use client';

import { useState } from 'react';
import type { z } from 'zod';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import {
  adminWrite,
  atypicalSchema,
  pageOf,
  reportSchema,
  restrictionSchema,
} from './operations-api';
import {
  AdminAction,
  AdminError,
  dateValue,
  Evidence,
  Panel,
  PeriodFields,
  QueryTable,
  usePeriod,
  uuidValid,
  type Column,
} from './OperationsUi';
import styles from './operations.module.css';

export function ComplianceOperations() {
  const { tx, locale } = useLocale();
  const [period, setPeriod] = usePeriod();
  const [userDraft, setUserDraft] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [selected, setSelected] = useState<z.infer<
    typeof restrictionSchema
  > | null>(null);
  const [report, setReport] = useState<z.infer<typeof reportSchema> | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [reportError, setReportError] = useState<unknown>(null);
  const restrictionColumns: Column<z.infer<typeof restrictionSchema>>[] = [
    { label: tx('Usuario', 'User'), render: (row) => row.user_id },
    {
      label: tx('Estado', 'Status'),
      render: (row) => (
        <span className={styles.badge}>
          {row.status === 'active'
            ? tx('Operación restringida', 'Trading restricted')
            : tx('Restricción levantada', 'Restriction lifted')}
        </span>
      ),
    },
    {
      label: tx('Motivo y evidencia', 'Reason and evidence'),
      render: (row) => (
        <>
          {row.reason}
          <p className={styles.hint}>{row.evidence_text}</p>
        </>
      ),
    },
    {
      label: tx('Fecha', 'Date'),
      render: (row) => dateValue(row.restricted_at, locale),
    },
    {
      label: tx('Acción', 'Action'),
      render: (row) =>
        row.status === 'active' ? (
          <button
            className={styles.button}
            type="button"
            onClick={() => setSelected(row)}
          >
            {tx('Levantar restricción', 'Lift restriction')}
          </button>
        ) : (
          '—'
        ),
    },
  ];
  async function generateReport() {
    if (!userId || busy) return;
    setBusy(true);
    setReportError(null);
    setReport(null);
    try {
      setReport(
        await adminWrite(
          `/admin/compliance/users/${encodeURIComponent(userId)}/audit-reports`,
          period,
          reportSchema,
        ),
      );
    } catch (error) {
      setReportError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.workspace}>
      <Panel
        title={tx(
          'Cumplimiento y restricciones',
          'Compliance and restrictions',
        )}
        hint={tx(
          'Revisa señales de actividad y registra decisiones con motivo y evidencia. Una señal atípica requiere análisis; no implica por sí sola una infracción.',
          'Review activity signals and record decisions with reasons and evidence. An atypical signal requires analysis; it does not itself imply a violation.',
        )}
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const invalidId = Boolean(userDraft && !uuidValid(userDraft));
            setInvalid(invalidId);
            if (!invalidId) {
              setUserId(userDraft);
              setReport(null);
            }
          }}
        >
          <div className={styles.grid}>
            <label className={styles.field}>
              {tx(
                'ID de usuario (opcional para consultar)',
                'User ID (optional for queries)',
              )}
              <input
                value={userDraft}
                onChange={(event) => setUserDraft(event.target.value.trim())}
              />
            </label>
            <div className={styles.field}>
              <label htmlFor="restriction-state">
                {tx('Estado', 'Status')}
              </label>
              <CustomSelect
                id="restriction-state"
                value={status}
                onChange={setStatus}
                options={[
                  { value: '', label: tx('Todos', 'All') },
                  { value: 'active', label: tx('Activas', 'Active') },
                  { value: 'lifted', label: tx('Levantadas', 'Lifted') },
                ]}
              />
            </div>
          </div>
          {invalid && (
            <p className={styles.error} role="alert">
              {tx(
                'Ingresa un ID de usuario UUID válido.',
                'Enter a valid user UUID.',
              )}
            </p>
          )}
          <div className={styles.actions}>
            <button className={styles.button} type="submit">
              {tx('Aplicar usuario', 'Apply user')}
            </button>
          </div>
        </form>
        <AdminAction
          title={tx(
            'Restringir operaciones de una cuenta',
            'Restrict account trading',
          )}
          description={tx(
            'La restricción impide nuevas operaciones del usuario indicado. Confirma su identidad antes de continuar.',
            'This restriction blocks new trading for the specified user. Verify their identity before continuing.',
          )}
          evidence
          fields={[
            {
              name: 'user_id',
              label: tx('ID del usuario', 'User ID'),
              required: true,
            },
          ]}
          validate={(values) =>
            !uuidValid(values.user_id ?? '')
              ? tx(
                  'Ingresa un ID de usuario UUID válido.',
                  'Enter a valid user UUID.',
                )
              : null
          }
          onConfirm={(values) =>
            adminWrite(
              '/admin/compliance/restrictions',
              {
                user_id: values.user_id,
                restriction_type: 'trading',
                reason: values.reason,
                totp_code: values.totp_code,
                evidence_text: values.evidence_text,
                evidence_refs: [],
              },
              restrictionSchema,
            )
          }
        />
        {selected && (
          <AdminAction
            key={selected.id}
            title={tx(
              'Levantar restricción de negociación',
              'Lift trading restriction',
            )}
            description={tx(
              `Usuario: ${selected.user_id}. Motivo original: ${selected.reason}`,
              `User: ${selected.user_id}. Original reason: ${selected.reason}`,
            )}
            evidence
            onConfirm={async (values) => {
              const result = await adminWrite(
                `/admin/compliance/restrictions/${encodeURIComponent(selected.id)}/lift`,
                {
                  reason: values.reason,
                  totp_code: values.totp_code,
                  evidence_text: values.evidence_text,
                  evidence_refs: [],
                },
                restrictionSchema,
              );
              setSelected(null);
              return result;
            }}
          />
        )}
        <QueryTable
          key={`${userId}-${status}`}
          path="/admin/compliance/restrictions"
          params={{ user_id: userId, status }}
          schema={pageOf(restrictionSchema)}
          columns={restrictionColumns}
          title={tx('Restricciones', 'Restrictions')}
        />
      </Panel>
      <Panel
        title={tx(
          'Señales de actividad y reportes',
          'Activity signals and reports',
        )}
      >
        <PeriodFields value={period} onChange={setPeriod} />
        <QueryTable
          key={JSON.stringify([period, userId])}
          path="/admin/compliance/atypical-operations"
          params={{ ...period, user_id: userId }}
          schema={pageOf(atypicalSchema)}
          title={tx('Operaciones atípicas', 'Atypical activity')}
          columns={[
            { label: tx('Usuario', 'User'), render: (row) => row.user_id },
            {
              label: tx('Fecha', 'Date'),
              render: (row) => dateValue(row.at, locale),
            },
            {
              label: tx('Señales', 'Signals'),
              render: (row) => row.reasons.join(' · '),
            },
            {
              label: tx('Detalle', 'Detail'),
              render: (row) => (
                <Evidence
                  title={tx('Ver evidencia', 'View evidence')}
                  value={{
                    ...row.observed,
                    references: row.references,
                    rules_version: row.rules_version,
                  }}
                />
              ),
            },
          ]}
        />
        <p className={styles.hint}>
          {tx(
            'Aplica un ID de usuario arriba para generar o consultar sus reportes.',
            'Apply a user ID above to generate or review their reports.',
          )}
        </p>
        <button
          type="button"
          className={styles.button}
          disabled={!userId || busy}
          onClick={() => void generateReport()}
        >
          {busy
            ? tx('Generando…', 'Generating…')
            : tx('Generar reporte del período', 'Generate period report')}
        </button>
        {reportError != null && <AdminError error={reportError} />}
        {report && (
          <Evidence
            title={tx(
              'Reporte generado · Ver contenido',
              'Report generated · View contents',
            )}
            value={{
              period_from: report.period_from,
              period_to: report.period_to,
              generated_at: dateValue(report.generated_at, locale),
              content_sha256: report.content_sha256,
              ...report.content,
            }}
          />
        )}
        {userId && (
          <QueryTable
            key={userId}
            path={`/admin/compliance/users/${encodeURIComponent(userId)}/audit-reports`}
            schema={pageOf(reportSchema)}
            title={tx('Reportes del usuario', 'User reports')}
            columns={[
              {
                label: tx('Período', 'Period'),
                render: (row) => `${row.period_from} — ${row.period_to}`,
              },
              {
                label: tx('Generado', 'Generated'),
                render: (row) => dateValue(row.generated_at, locale),
              },
              {
                label: tx('Integridad', 'Integrity'),
                render: (row) => row.content_sha256,
              },
              {
                label: tx('Contenido', 'Contents'),
                render: (row) => (
                  <Evidence
                    title={tx('Ver reporte', 'View report')}
                    value={row.content}
                  />
                ),
              },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
