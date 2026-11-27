'use client';
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { z } from 'zod';
import { LoadingState } from '@/components/ui/LoadingState';
import { BrokerAvatar } from './components/BrokerAvatar';
import ui from './brokers-details.module.css';
import { useLocale } from '@/lib/i18n';
import { formatMarketDateTime } from '@/lib/formatters';
import * as api from './brokers-api';
import * as schemas from './brokers-schemas';
import { useBrokerAction } from './use-broker-action';
import { formatLinkStatus, linkStatusLabels } from './broker-labels';
import {
  BrokerConfirmDialog,
  type Confirmation,
} from './components/BrokerConfirmDialog';
import { InvestorCurrentLinkTab } from './components/InvestorCurrentLinkTab';
import { InvestorDirectoryTab } from './components/InvestorDirectoryTab';
import { BrokerPortalClientsTab } from './components/BrokerPortalClientsTab';
import { BrokerPortalNewProposalTab } from './components/BrokerPortalNewProposalTab';
import {
  BrokerPortalProfileTab,
  BrokerPortalReviewsTab,
} from './components/BrokerPortalReportsTab';
import { ProposalsWorkspace } from './components/ProposalsWorkspace';
import { BrokerProfileDialog } from './components/BrokerProfileDialog';
import { ClientInvestments } from './components/ClientInvestments';
import { HistoryFilters, Pager } from './components/HistoryFilters';
import styles from './brokers.module.css';
export interface BrokersHubProps {
  initialTab?: 'current' | 'directory';
  userRoles?: string[];
  userId?: string;
  onNavigateToOrder?: ((symbol: string) => void) | undefined;
}
export function BrokersHub({
  initialTab,
  userRoles = [],
  userId = '',
  onNavigateToOrder,
}: BrokersHubProps) {
  const { tx, locale } = useLocale();
  const canBroker = userRoles.includes('broker');
  const canInvestor = userRoles.includes('investor') || !canBroker;
  const [mode, setMode] = useState<api.BrokerRole>(
    canBroker && !(initialTab && canInvestor) ? 'broker' : 'investor',
  );
  const role = canBroker ? mode : 'investor';
  const [tab, setTab] = useState(initialTab && canInvestor ? initialTab : '');
  const activeTab = tab || (role === 'broker' ? 'clients' : 'current');
  const [profileId, setProfileId] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<api.Filters>({});
  const [cursors, setCursors] = useState<string[]>(['']);
  const cursor = cursors.at(-1) || '';
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const action = useBrokerAction();
  const key = ['brokers', userId, role];
  const current = useQuery({
    queryKey: [...key, 'current'],
    queryFn: ({ signal }) => api.fetchCurrentBrokerLink(signal),
    enabled: role === 'investor',
    retry: false,
  });
  const directory = useQuery({
    placeholderData: keepPreviousData,
    queryKey: [...key, 'directory', search, cursor],
    queryFn: ({ signal }) =>
      api.fetchBrokersDirectory(
        {
          ...(cursor ? { cursor } : {}),
          ...(search.trim().length >= 2 ? { q: search.trim() } : {}),
        },
        signal,
      ),
    enabled: role === 'investor' && activeTab === 'directory',
    retry: false,
  });
  const suggestions = useQuery({
    queryKey: [...key, 'suggestions'],
    queryFn: ({ signal }) =>
      api.brokerRequest(
        'brokers/suggestions',
        z.array(schemas.brokerSchema),
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: role === 'investor' && activeTab === 'directory',
    retry: false,
  });
  const history = useQuery({
    queryKey: [...key, 'links', filters, cursor],
    queryFn: ({ signal }) =>
      api.brokerRequest(
        'broker-links',
        schemas.pageSchema(schemas.linkSchema),
        'GET',
        undefined,
        { page_size: '10', ...filters, ...(cursor ? { cursor } : {}) },
        signal,
      ),
    enabled: role === 'investor' && activeTab === 'history',
    retry: false,
  });
  const requests = useQuery({
    queryKey: [...key, 'requests'],
    queryFn: ({ signal }) => api.fetchBrokerLinkRequests(signal),
    enabled: role === 'broker' && activeTab === 'clients',
    retry: false,
  });
  const clients = useQuery({
    queryKey: [...key, 'clients'],
    queryFn: ({ signal }) => api.fetchBrokerClients(signal),
    enabled: role === 'broker',
    retry: false,
  });
  const profile = useQuery({
    queryKey: [...key, 'profile'],
    queryFn: ({ signal }) =>
      api.brokerRequest(
        `brokers/${userId}`,
        schemas.brokerSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: role === 'broker' && activeTab === 'profile' && Boolean(userId),
    retry: false,
  });
  const orders = useQuery({
    queryKey: [...key, 'reviews'],
    queryFn: ({ signal }) =>
      api.brokerRequest(
        'broker/order-reviews',
        z.array(schemas.orderSchema),
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: role === 'broker' && activeTab === 'reviews',
    retry: false,
  });
  const selectedQuery =
    role === 'investor'
      ? activeTab === 'directory'
        ? directory
        : activeTab === 'history'
          ? history
          : activeTab === 'current'
            ? current
            : null
      : activeTab === 'clients'
        ? requests
        : activeTab === 'profile'
          ? profile
          : activeTab === 'reviews'
            ? orders
            : activeTab === 'create'
              ? clients
              : null;
  const link = current.data?.link ?? null;
  const authorized = Boolean(
    current.data?.trading_authorization &&
    !current.data.trading_authorization.revoked_at,
  );
  function selectTab(next: string) {
    setTab(next);
    setCursors(['']);
    setFilters({});
  }
  const tabs =
    role === 'investor'
      ? [
          [
            'current',
            tx('Mi Comisionista y Permisos', 'My Broker & Permissions'),
          ],
          ['directory', tx('Directorio de Comisionistas', 'Broker Directory')],
          ['proposals', tx('Propuestas Recibidas y Chat', 'Proposals & Chat')],
          ['history', tx('Historial de vínculos', 'Link history')],
        ]
      : [
          ['clients', tx('Solicitudes y Cartera', 'Requests & Clients')],
          ['create', tx('Emitir propuesta', 'Create proposal')],
          ['proposals', tx('Propuestas y chat', 'Proposals & chat')],
          ['reviews', tx('Revisión de órdenes', 'Order reviews')],
          ['profile', tx('Mi perfil profesional', 'My professional profile')],
        ];
  return (
    <section
      className={styles.container}
      aria-label={tx(
        'Módulo de Comisionistas y Propuestas',
        'Brokers and Proposals Hub',
      )}
    >
      <div className={styles.topBar}>
        <div className={styles.topTitleGroup}>
          <h2 className={styles.topTitle}>
            {role === 'broker'
              ? tx('Portal del comisionista', 'Broker workspace')
              : tx(
                  'Comisionistas y propuestas de inversión',
                  'Brokers & investment proposals',
                )}
          </h2>
          <p className={styles.topSubtitle}>
            {tx(
              'Vínculos, autorizaciones y propuestas de tu cuenta.',
              'Your account links, authorizations and proposals.',
            )}
          </p>
        </div>
        {canBroker && canInvestor && (
          <div className={styles.roleSwitcher}>
            {(['investor', 'broker'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={styles.roleSwitchBtn}
                aria-pressed={role === value}
                onClick={() => {
                  setMode(value);
                  setTab('');
                  setCursors(['']);
                  setConfirmation(null);
                }}
              >
                {value === 'broker'
                  ? tx('Portal Comisionista', 'Broker Portal')
                  : tx('Vista Inversionista', 'Investor View')}
              </button>
            ))}
          </div>
        )}
      </div>
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
      <div
        className={styles.subTabs}
        role="tablist"
        aria-label={tx('Secciones del módulo', 'Module sections')}
      >
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            className={`${styles.subTabBtn} ${activeTab === value ? styles.subTabBtnActive : ''}`}
            onClick={() => selectTab(value!)}
          >
            {label}
          </button>
        ))}
      </div>
      {selectedQuery?.isPending && selectedQuery.fetchStatus !== 'idle' && (
        <LoadingState label={tx('Cargando información…', 'Loading…')} />
      )}
      {selectedQuery?.isError && (
        <div role="alert" className={styles.formError}>
          <p>
            {tx(
              'No se pudo consultar esta sección.',
              'Could not load this section.',
            )}{' '}
            {selectedQuery.error.message}
          </p>
          <button
            className={styles.secondaryBtn}
            onClick={() => void selectedQuery.refetch()}
          >
            {tx('Reintentar', 'Retry')}
          </button>
        </div>
      )}
      {role === 'broker' && activeTab === 'clients' && clients.isError && (
        <p role="alert" className={styles.formError}>
          {clients.error.message}
          <button
            className={styles.secondaryBtn}
            onClick={() => void clients.refetch()}
          >
            {tx('Reintentar', 'Retry')}
          </button>
        </p>
      )}
      <fieldset className={styles.liveFields} disabled={action.busy}>
        {role === 'investor' &&
          activeTab === 'current' &&
          current.isSuccess && (
            <InvestorCurrentLinkTab
              activeLink={link}
              tradingAuthorized={authorized}
              onOpenDirectory={() => selectTab('directory')}
              onOpenProposals={() => selectTab('proposals')}
              onToggleTradingAuth={() => {
                if (!link) return;
                setConfirmation({
                  title: authorized
                    ? tx('Revocar autorización', 'Revoke authorization')
                    : tx(
                        'Autorizar operación delegada',
                        'Authorize delegated trading',
                      ),
                  description: tx(
                    'Este permiso permite convertir en órdenes las propuestas que aceptes con MFA. Puedes revocarlo en cualquier momento.',
                    'This permission allows proposals you accept with MFA to become orders. You can revoke it at any time.',
                  ),
                  consent: !authorized,
                  action: () =>
                    api.brokerRequest(
                      `broker-links/${link.id}/trading-authorization${authorized ? '/revoke' : ''}`,
                      schemas.authorizationSchema,
                      'POST',
                      authorized ? undefined : { consent_accepted: true },
                    ),
                });
              }}
              onToggleOrderReview={() => {
                if (link)
                  void action.run(() =>
                    api.brokerRequest(
                      `broker-links/${link.id}/order-review`,
                      schemas.linkSchema,
                      'PUT',
                      { enabled: !link.order_review_enabled },
                    ),
                  );
              }}
              onEndLink={() => {
                if (!link) return;
                setConfirmation({
                  title:
                    link.status === 'requested'
                      ? tx('Cancelar solicitud', 'Cancel request')
                      : tx('Finalizar vínculo', 'End link'),
                  description: tx(
                    'Al finalizar el vínculo se revoca el acceso del asesor y se retiran las propuestas pendientes.',
                    'Ending the link revokes advisor access and withdraws pending proposals.',
                  ),
                  reason: link.status === 'active',
                  action: (reason) =>
                    api.brokerRequest(
                      `broker-links/${link.id}/${link.status === 'requested' ? 'cancel' : 'end'}`,
                      schemas.linkSchema,
                      'POST',
                      link.status === 'requested'
                        ? undefined
                        : { reason, confirmed: true },
                    ),
                });
              }}
              onRateBroker={(stars, comment) => {
                if (link)
                  void action.run(() =>
                    api.brokerRequest(
                      `brokers/${link.broker_id}/rating`,
                      schemas.reviewSchema,
                      'PUT',
                      { stars, comment },
                    ),
                  );
              }}
            />
          )}
        {role === 'investor' && activeTab === 'directory' && (
          <>
            {suggestions.data && suggestions.data.length > 0 && (
              <section
                aria-label={tx('Sugeridos para ti', 'Suggested for you')}
              >
                <h3 className={ui.sectionTitle}>
                  {tx('Sugeridos para ti', 'Suggested for you')}
                </h3>
                <div className={ui.suggestions}>
                  {suggestions.data.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={ui.suggestion}
                      onClick={() => setProfileId(b.id)}
                    >
                      <BrokerAvatar brokerId={b.id} name={b.name} />
                      <span>
                        <strong>{b.name}</strong>
                        <small>
                          {b.specialty} · {b.years_experience}{' '}
                          {tx('años', 'years')}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {directory.isSuccess && (
              <>
                <InvestorDirectoryTab
                  onOpenProfile={setProfileId}
                  directory={directory.data.items}
                  totalCount={directory.data.items.length}
                  activeBrokerId={link?.broker_id ?? null}
                  reviewsByBroker={{}}
                  searchQuery={search}
                  onSearchChange={(value) => {
                    setSearch(value);
                    setCursors(['']);
                  }}
                  onRequestLink={(broker) =>
                    setConfirmation({
                      title: tx(
                        `Vincularme con ${broker.name}`,
                        `Link with ${broker.name}`,
                      ),
                      description: tx(
                        'Solicito asesoría y autorizo al comisionista, una vez acepte, a consultar mis inversiones y órdenes. Esto no concede autorización de trading.',
                        'I request advisory services and allow the broker, after accepting, to view my investments and orders. This does not grant trading authorization.',
                      ),
                      consent: true,
                      action: () =>
                        api.brokerRequest(
                          'broker-links',
                          schemas.linkSchema,
                          'POST',
                          { broker_id: broker.id, consent_accepted: true },
                        ),
                    })
                  }
                />
                <Pager
                  index={cursors.length - 1}
                  hasNext={Boolean(directory.data.next_cursor)}
                  onPrevious={() => setCursors((c) => c.slice(0, -1))}
                  onNext={() =>
                    setCursors((c) => [...c, directory.data.next_cursor!])
                  }
                />
              </>
            )}
          </>
        )}
        {activeTab === 'proposals' && (
          <ProposalsWorkspace
            key={role}
            role={role}
            userId={userId}
            onNavigateToOrder={onNavigateToOrder}
          />
        )}
        {role === 'investor' && activeTab === 'history' && (
          <div className={styles.card}>
            <HistoryFilters
              states={Object.fromEntries(
                Object.keys(linkStatusLabels).map((status) => [
                  status,
                  formatLinkStatus(status, locale),
                ]),
              )}
              onApply={(value) => {
                setFilters(value);
                setCursors(['']);
              }}
            />
            {history.data?.items.map((item) => (
              <div key={item.id} className={styles.controlBox}>
                <div className={ui.identity}>
                  <BrokerAvatar
                    brokerId={item.broker_id}
                    name={item.broker.name}
                    size={44}
                  />
                  <strong className={styles.controlTitle}>
                    {item.broker.name}
                  </strong>
                  <span
                    className={
                      item.status === 'active'
                        ? styles.badgeSuccess
                        : item.status === 'requested'
                          ? styles.badgeWarning
                          : ui.badge
                    }
                  >
                    {formatLinkStatus(item.status, locale)}
                  </span>
                </div>
                <p className={styles.controlHint}>
                  {formatMarketDateTime(item.requested_at, locale)}
                </p>
                <p className={styles.controlHint}>
                  {item.end_reason || item.decline_reason}
                </p>
              </div>
            ))}
            {history.isSuccess && history.data.items.length === 0 && (
              <p className={styles.emptyNotice}>
                {tx(
                  'Sin vínculos en este período.',
                  'No links in this period.',
                )}
              </p>
            )}
            <Pager
              index={cursors.length - 1}
              hasNext={Boolean(history.data?.next_cursor)}
              onPrevious={() => setCursors((c) => c.slice(0, -1))}
              onNext={() =>
                setCursors((c) => [...c, history.data!.next_cursor!])
              }
            />
          </div>
        )}
        {role === 'broker' &&
          activeTab === 'clients' &&
          requests.isSuccess &&
          clients.isSuccess && (
            <>
              <BrokerPortalClientsTab
                pendingRequests={requests.data}
                brokerClients={clients.data}
                onAcceptRequest={(req) => {
                  void action.run(() =>
                    api.brokerRequest(
                      `broker/link-requests/${req.id}/accept`,
                      schemas.linkSchema,
                      'POST',
                    ),
                  );
                }}
                onDeclineRequest={(req) =>
                  setConfirmation({
                    title: tx('Declinar solicitud', 'Decline request'),
                    description: req.investor_name,
                    reason: true,
                    action: (reason) =>
                      api.brokerRequest(
                        `broker/link-requests/${req.id}/decline`,
                        schemas.linkSchema,
                        'POST',
                        { reason },
                      ),
                  })
                }
              />
              <ClientInvestments clients={clients.data} userId={userId} />
            </>
          )}
        {role === 'broker' && activeTab === 'create' && clients.isSuccess && (
          <BrokerPortalNewProposalTab
            brokerClients={clients.data}
            onCreateProposal={(draft) => {
              void action.run(() =>
                api.brokerRequest(
                  'broker/proposals',
                  schemas.proposalDetailSchema,
                  'POST',
                  {
                    investor_id: draft.clientId,
                    symbol: draft.symbol,
                    side: draft.side,
                    qty: draft.qty,
                    type: draft.type,
                    ...(draft.type === 'limit'
                      ? { limit_price: draft.limitPrice }
                      : {}),
                  },
                ),
              );
            }}
          />
        )}
        {role === 'broker' && activeTab === 'reviews' && orders.isSuccess && (
          <BrokerPortalReviewsTab
            pendingOrderReviews={orders.data.map((order) => ({
              ...order,
              investor_name: '',
              limit_price: order.limit_price ?? '',
              notional_usd: order.estimated_amount,
            }))}
            onApproveOrder={(order) =>
              setConfirmation({
                title: tx('Aprobar y enviar orden', 'Approve and submit order'),
                description: `${order.side} · ${order.qty} ${order.symbol}`,
                action: () =>
                  api.brokerRequest(
                    `broker/order-reviews/${order.id}/approve`,
                    schemas.orderSchema,
                    'POST',
                  ),
              })
            }
            onRejectOrder={(order) =>
              setConfirmation({
                title: tx('Devolver para corrección', 'Return for changes'),
                description: order.symbol,
                reason: true,
                action: (comment) =>
                  api.brokerRequest(
                    `broker/order-reviews/${order.id}/return`,
                    schemas.orderSchema,
                    'POST',
                    { comment },
                  ),
              })
            }
          />
        )}
        {role === 'broker' && activeTab === 'profile' && profile.isSuccess && (
          <BrokerPortalProfileTab
            key={profile.data.id}
            profile={profile.data}
            onSaveProfile={(body) => {
              void action.run(() => api.saveBrokerProfile(body));
            }}
          />
        )}
      </fieldset>
      {profileId && (
        <BrokerProfileDialog
          id={profileId}
          userId={userId}
          onClose={() => setProfileId('')}
        />
      )}
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
    </section>
  );
}
