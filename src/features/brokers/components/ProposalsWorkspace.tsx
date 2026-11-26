'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/i18n';
import * as api from '../brokers-api';
import * as s from '../brokers-schemas';
import { proposalStatusLabels, formatProposalStatus } from '../broker-labels';
import { useBrokerAction } from '../use-broker-action';
import { InvestorProposalsTab } from './InvestorProposalsTab';
import { BrokerPortalNewProposalTab } from './BrokerPortalNewProposalTab';
import { BrokerConfirmDialog, type Confirmation } from './BrokerConfirmDialog';
import { HistoryFilters, Pager } from './HistoryFilters';
import styles from '../brokers.module.css';
export function ProposalsWorkspace({
  role,
  userId,
  onNavigateToOrder,
}: {
  role: api.BrokerRole;
  userId: string;
  onNavigateToOrder?: ((symbol: string) => void) | undefined;
}) {
  const { tx, locale } = useLocale();
  const action = useBrokerAction();
  const [filters, setFilters] = useState<api.Filters>({});
  const [cursors, setCursors] = useState(['']);
  const [selected, setSelected] = useState('');
  const [messageCursors, setMessageCursors] = useState(['']);
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const page = useQuery({
    queryKey: ['brokers', userId, role, 'proposals', filters, cursors.at(-1)],
    queryFn: ({ signal }) =>
      api.fetchProposals(
        role,
        { ...filters, ...(cursors.at(-1) ? { cursor: cursors.at(-1)! } : {}) },
        signal,
      ),
    retry: false,
  });
  const id =
    page.data?.items.find((p) => p.id === selected)?.id ??
    page.data?.items[0]?.id ??
    '';
  const detail = useQuery({
    queryKey: ['brokers', userId, role, 'proposal', id],
    queryFn: ({ signal }) => api.fetchProposalDetail(role, id, signal),
    enabled: Boolean(id),
    retry: false,
  });
  const messages = useQuery({
    queryKey: ['brokers', userId, role, 'messages', id, messageCursors.at(-1)],
    queryFn: ({ signal }) =>
      api.fetchMessages(
        role,
        id,
        {
          page_size: '10',
          ...(messageCursors.at(-1) ? { cursor: messageCursors.at(-1)! } : {}),
        },
        signal,
      ),
    enabled: Boolean(id),
    retry: false,
  });
  const proposal = detail.data ? api.proposalView(detail.data) : null;
  return (
    <div className={styles.liveFields}>
      <HistoryFilters
        states={Object.fromEntries(
          Object.keys(proposalStatusLabels).map((status) => [
            status,
            formatProposalStatus(status, locale),
          ]),
        )}
        onApply={(value) => {
          setFilters(value);
          setCursors(['']);
          setSelected('');
          setMessageCursors(['']);
          setEditing(false);
        }}
      />
      {action.error && !confirmation && (
        <p role="alert" className={styles.formError}>
          {action.error}
        </p>
      )}
      {action.notice && (
        <p role="status" className={styles.statusToast}>
          {action.notice}
        </p>
      )}
      {[page, detail, messages]
        .filter((q) => q.isError)
        .map((q, index) => (
          <div key={index} role="alert" className={styles.formError}>
            {q.error?.message}
            <button
              className={styles.secondaryBtn}
              onClick={() => void q.refetch()}
            >
              {tx('Reintentar', 'Retry')}
            </button>
          </div>
        ))}
      {page.isPending && (
        <p className={styles.emptyNotice}>
          {tx('Cargando propuestas…', 'Loading proposals…')}
        </p>
      )}
      {page.isSuccess && (
        <fieldset
          className={styles.liveFields}
          disabled={action.busy || detail.isFetching}
        >
          <InvestorProposalsTab
            key={id}
            proposals={page.data.items}
            selectedProposal={proposal}
            messages={messages.data?.items ?? []}
            brokerMode={role === 'broker'}
            onSelectProposal={(next) => {
              setSelected(next);
              setEditing(false);
              setMessageCursors(['']);
            }}
            onDecision={(decision, comment, totp) =>
              proposal
                ? action.run(() =>
                    api.decideProposal(
                      proposal.id,
                      proposal.current_version,
                      decision,
                      comment,
                      totp,
                    ),
                  )
                : Promise.resolve(false)
            }
            onSendMessage={(body) =>
              action.run(() => api.sendProposalMessage(role, id, body))
            }
            onNavigateToOrder={onNavigateToOrder}
          />
          {messages.data && messages.data.items.length > 0 && (
            <Pager
              index={messageCursors.length - 1}
              hasNext={Boolean(messages.data.next_cursor)}
              onPrevious={() => setMessageCursors((c) => c.slice(0, -1))}
              onNext={() =>
                setMessageCursors((c) => [...c, messages.data.next_cursor!])
              }
            />
          )}
          {proposal && (
            <p className={styles.fieldHint}>
              {proposal.order_id
                ? `${tx('Orden creada', 'Order created')}: ${proposal.order_id}`
                : ''}{' '}
              {proposal.failure_code || proposal.status_reason || ''}
            </p>
          )}
          {role === 'broker' &&
            proposal &&
            ['sent', 'accepted'].includes(proposal.status) && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  {tx('Gestionar propuesta', 'Manage proposal')}
                </h3>
                <div className={styles.btnRow}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setEditing(!editing)}
                  >
                    {tx('Modificar propuesta', 'Edit proposal')}
                  </button>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={() =>
                      setConfirmation({
                        title: tx('Retirar propuesta', 'Withdraw proposal'),
                        description: tx(
                          'La propuesta dejará de estar disponible para aceptación.',
                          'The proposal will no longer be available for acceptance.',
                        ),
                        reason: true,
                        action: (reason) =>
                          api.brokerRequest(
                            `broker/proposals/${id}/withdraw`,
                            s.proposalDetailSchema,
                            'POST',
                            {
                              version: proposal.current_version,
                              reason,
                              confirmed: true,
                            },
                          ),
                      })
                    }
                  >
                    {tx('Retirar propuesta', 'Withdraw proposal')}
                  </button>
                  {proposal.status === 'accepted' &&
                    (['approve', 'decline'] as const).map((decision) => (
                      <button
                        key={decision}
                        type="button"
                        className={
                          decision === 'approve'
                            ? styles.primaryBtn
                            : styles.dangerBtn
                        }
                        onClick={() =>
                          setConfirmation({
                            title:
                              decision === 'approve'
                                ? tx(
                                    'Aprobar y crear orden',
                                    'Approve and create order',
                                  )
                                : tx('Declinar propuesta', 'Decline proposal'),
                            description: tx(
                              'Registra la evidencia que respalda tu decisión. La API verificará la autorización vigente del inversionista.',
                              'Record evidence supporting your decision. The API will verify the investor’s current authorization.',
                            ),
                            reason: true,
                            action: (evidence_text) =>
                              api.brokerRequest(
                                `broker/proposals/${id}/decision`,
                                s.proposalDetailSchema,
                                'POST',
                                {
                                  version: proposal.current_version,
                                  decision,
                                  evidence_text,
                                  evidence_message_ids: [],
                                },
                              ),
                          })
                        }
                      >
                        {decision === 'approve'
                          ? tx(
                              'Aprobar y crear orden',
                              'Approve and create order',
                            )
                          : tx('Declinar propuesta', 'Decline proposal')}
                      </button>
                    ))}
                </div>
                {editing && (
                  <>
                    <p className={styles.fieldHint}>
                      {tx(
                        'Una nueva versión anula la aceptación anterior y debe volver a firmarse.',
                        'A new version cancels the previous acceptance and requires a new signature.',
                      )}
                    </p>
                    <BrokerPortalNewProposalTab
                      key={`${id}-${proposal.current_version}`}
                      brokerClients={[
                        {
                          investor_id: proposal.investor.id,
                          name: proposal.investor.name,
                          link_id: proposal.link_id,
                          since: '',
                          trading_authorized: false,
                          order_review_enabled: false,
                        },
                      ]}
                      initialDraft={{
                        clientId: proposal.investor.id,
                        symbol: proposal.symbol,
                        side: proposal.side,
                        qty: proposal.qty,
                        type: proposal.type,
                        limitPrice: proposal.limit_price ?? '',
                      }}
                      onCreateProposal={(draft) => {
                        void action
                          .run(() =>
                            api.brokerRequest(
                              `broker/proposals/${id}`,
                              s.proposalDetailSchema,
                              'PUT',
                              {
                                version: proposal.current_version,
                                symbol: draft.symbol,
                                side: draft.side,
                                qty: draft.qty,
                                type: draft.type,
                                ...(draft.type === 'limit'
                                  ? { limit_price: draft.limitPrice }
                                  : {}),
                              },
                            ),
                          )
                          .then((ok) => {
                            if (ok) setEditing(false);
                          });
                      }}
                    />
                  </>
                )}
              </div>
            )}
          {detail.data && (
            <details className={styles.card}>
              <summary className={styles.controlTitle}>
                {tx('Versiones y decisiones', 'Versions and decisions')}
              </summary>
              {detail.data.versions.map((v) => (
                <p key={v.version} className={styles.controlHint}>
                  v{v.version} · {v.symbol} · {v.qty} · {v.estimated_cost} USD ·{' '}
                  {v.created_at}
                </p>
              ))}
              {detail.data.decisions.map((d) => (
                <p key={d.id} className={styles.controlHint}>
                  {d.actor_role} · {d.decision} · v{d.version} ·{' '}
                  {d.comment || d.evidence_text} · {d.at}
                </p>
              ))}
            </details>
          )}
        </fieldset>
      )}
      <Pager
        index={cursors.length - 1}
        hasNext={Boolean(page.data?.next_cursor) && !page.isFetching}
        onPrevious={() => {
          setCursors((c) => c.slice(0, -1));
          setSelected('');
          setEditing(false);
          setMessageCursors(['']);
        }}
        onNext={() => {
          setCursors((c) => [...c, page.data!.next_cursor!]);
          setSelected('');
          setEditing(false);
          setMessageCursors(['']);
        }}
      />
      {confirmation && (
        <BrokerConfirmDialog
          key={confirmation.title}
          confirmation={confirmation}
          busy={action.busy}
          error={action.error}
          onClose={() => setConfirmation(null)}
          onConfirm={(reason) => action.run(() => confirmation.action(reason))}
        />
      )}
    </div>
  );
}
