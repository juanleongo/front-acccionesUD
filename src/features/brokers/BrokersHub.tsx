'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import {
  INITIAL_BROKER_CLIENTS,
  INITIAL_BROKER_REQUESTS,
  INITIAL_BROKER_REVIEWS,
  INITIAL_BROKERS_DIRECTORY,
  INITIAL_CURRENT_LINK,
  INITIAL_PROPOSAL_MESSAGES,
  INITIAL_PROPOSALS,
  type BrokerClientItem,
  type BrokerDirectoryItem,
  type BrokerPendingRequest,
  type BrokerReviewItem,
  type CurrentBrokerLinkData,
  type ProposalChatMessage,
  type ProposalItem,
} from './brokers-mock';
import { BrokerWorkspaceOverview } from './components/BrokerWorkspaceOverview';
import { BrokerPortalClientsTab } from './components/BrokerPortalClientsTab';
import {
  BrokerPortalNewProposalTab,
  type BrokerProposalDraft,
} from './components/BrokerPortalNewProposalTab';
import {
  BrokerPortalProfileTab,
  BrokerPortalReviewsTab,
  type PendingOrderReviewItem,
} from './components/BrokerPortalReportsTab';
import { InvestorCurrentLinkTab } from './components/InvestorCurrentLinkTab';
import { InvestorDirectoryTab } from './components/InvestorDirectoryTab';
import { InvestorProposalsTab } from './components/InvestorProposalsTab';
import styles from './brokers.module.css';

export interface BrokersHubProps {
  userRoles?: string[];
  onNavigateToOrder?: (symbol: string) => void;
}

type InvestorSubTab = 'current-link' | 'directory' | 'proposals';
type BrokerSubTab =
  'clients' | 'new-proposal' | 'reviews-reports' | 'my-profile';

const INITIAL_PENDING_ORDER_REVIEWS: PendingOrderReviewItem[] = [
  {
    id: 'ord-rev-101',
    investor_name: 'Juan José León Gómez',
    symbol: 'TSLA',
    side: 'buy',
    qty: '25',
    type: 'limit',
    limit_price: '242.50',
    notional_usd: '6062.50',
    status: 'pending_broker_review',
  },
];

export function BrokersHub({
  userRoles = [],
  onNavigateToOrder,
}: BrokersHubProps) {
  const { tx } = useLocale();
  const canAccessBrokerPortal = userRoles.includes('broker');
  const defaultRoleMode = canAccessBrokerPortal ? 'broker' : 'investor';
  const [preferredRoleMode, setRoleMode] = useState<'investor' | 'broker'>(
    defaultRoleMode,
  );
  const roleMode = canAccessBrokerPortal ? preferredRoleMode : 'investor';
  const [investorTab, setInvestorTab] =
    useState<InvestorSubTab>('current-link');
  const [brokerTab, setBrokerTab] = useState<BrokerSubTab>('clients');

  const [directory] = useState<BrokerDirectoryItem[]>(
    INITIAL_BROKERS_DIRECTORY,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLinkData, setCurrentLinkData] =
    useState<CurrentBrokerLinkData>(INITIAL_CURRENT_LINK);
  const [proposals, setProposals] = useState<ProposalItem[]>(INITIAL_PROPOSALS);
  const [selectedProposalId, setSelectedProposalId] = useState<string>(
    INITIAL_PROPOSALS[0]?.id ?? '',
  );
  const [messagesByProposal, setMessagesByProposal] = useState<
    Record<string, ProposalChatMessage[]>
  >(INITIAL_PROPOSAL_MESSAGES);
  const [reviewsByBroker, setReviewsByBroker] = useState<
    Record<string, BrokerReviewItem[]>
  >(INITIAL_BROKER_REVIEWS);

  const [pendingRequests, setPendingRequests] = useState<
    BrokerPendingRequest[]
  >(INITIAL_BROKER_REQUESTS);
  const [brokerClients, setBrokerClients] = useState<BrokerClientItem[]>(
    INITIAL_BROKER_CLIENTS,
  );
  const [pendingOrderReviews, setPendingOrderReviews] = useState<
    PendingOrderReviewItem[]
  >(INITIAL_PENDING_ORDER_REVIEWS);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const activeLink = currentLinkData.link;
  const tradingAuthorized =
    Boolean(currentLinkData.trading_authorization) &&
    !currentLinkData.trading_authorization?.revoked_at;

  const selectedProposal = useMemo(
    () =>
      proposals.find((p) => p.id === selectedProposalId) ??
      proposals[0] ??
      null,
    [proposals, selectedProposalId],
  );

  const currentMessages = useMemo(
    () =>
      selectedProposal ? (messagesByProposal[selectedProposal.id] ?? []) : [],
    [messagesByProposal, selectedProposal],
  );

  const filteredDirectory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return directory;
    return directory.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.firm_name.toLowerCase().includes(q) ||
        b.specialty.toLowerCase().includes(q),
    );
  }, [directory, searchQuery]);

  function handleToggleTradingAuth() {
    if (!activeLink) return;
    setCurrentLinkData((prev) => ({
      ...prev,
      trading_authorization: tradingAuthorized
        ? null
        : {
            id: `ta-${Date.now()}`,
            link_id: activeLink.id,
            consent_version: 'v1',
            granted_at: new Date().toISOString(),
            revoked_at: null,
            revoke_reason: null,
          },
    }));
    setStatusToast(
      tradingAuthorized
        ? tx(
            'Autorización de operación delegada revocada correctamente.',
            'Delegated trading authorization revoked.',
          )
        : tx(
            'Autorización de operación delegada activada para tu comisionista.',
            'Delegated trading authorization enabled for your broker.',
          ),
    );
  }

  function handleToggleOrderReview() {
    if (!activeLink) return;
    const nextEnabled = !activeLink.order_review_enabled;
    setCurrentLinkData((prev) =>
      prev.link
        ? {
            ...prev,
            link: { ...prev.link, order_review_enabled: nextEnabled },
          }
        : prev,
    );
    setStatusToast(
      nextEnabled
        ? tx(
            'Revisión previa de órdenes por el comisionista activada.',
            'Broker pre-trade order review enabled.',
          )
        : tx(
            'Revisión previa de órdenes desactivada.',
            'Broker pre-trade order review disabled.',
          ),
    );
  }

  function handleRequestLink(broker: BrokerDirectoryItem) {
    setCurrentLinkData((prev) => ({
      ...prev,
      link: {
        id: `lnk-${Date.now()}`,
        investor_id: 'inv-local',
        broker_id: broker.id,
        broker: {
          id: broker.id,
          name: broker.name,
          firm_name: broker.firm_name,
        },
        status: 'active',
        requested_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        responded_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        ended_at: null,
        decline_reason: null,
        end_reason: null,
        consent_version: 'v1',
        consent_accepted_at: new Date().toISOString(),
        order_review_enabled: true,
      },
    }));
    setInvestorTab('current-link');
    setStatusToast(
      tx(
        `Solicitud de vinculación confirmada con ${broker.name} (${broker.firm_name}).`,
        `Advisory link confirmed with ${broker.name} (${broker.firm_name}).`,
      ),
    );
  }

  function handleEndLink() {
    if (!activeLink) return;
    setCurrentLinkData((prev) => ({
      ...prev,
      link: null,
      trading_authorization: null,
      pending_broker_selection: true,
    }));
    setStatusToast(
      tx(
        'Vínculo con el comisionista finalizado. Puedes elegir un nuevo asesor en el directorio.',
        'Broker relationship ended. You may choose a new advisor in the directory.',
      ),
    );
  }

  function handleRateBroker(stars: number, comment: string) {
    if (!activeLink) return;
    const brokerId = activeLink.broker_id;
    const newReview: BrokerReviewItem = {
      stars,
      comment:
        comment.trim() ||
        tx(
          'Excelente asesoría financiera en mercados de EE. UU.',
          'Excellent financial advisory in US markets.',
        ),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setReviewsByBroker((prev) => ({
      ...prev,
      [brokerId]: [newReview, ...(prev[brokerId] ?? [])],
    }));
    setStatusToast(
      tx(
        `Calificación de ${stars} estrellas registrada para ${activeLink.broker.name}.`,
        `${stars}-star rating saved for ${activeLink.broker.name}.`,
      ),
    );
  }

  function handleProposalDecision(
    decision: 'accept' | 'reject',
    comment: string,
  ) {
    if (!selectedProposal) return;
    setProposals((prev) =>
      prev.map((p) =>
        p.id === selectedProposal.id
          ? {
              ...p,
              status: decision === 'accept' ? 'accepted' : 'rejected',
              accepted_version:
                decision === 'accept' ? p.current_version : null,
            }
          : p,
      ),
    );
    if (comment) {
      handleSendMessage(comment);
    }
    setStatusToast(
      decision === 'accept'
        ? tx(
            `Propuesta de ${selectedProposal.symbol} aceptada y firmada con tu código 2FA.`,
            `${selectedProposal.symbol} proposal accepted and signed with 2FA.`,
          )
        : tx(
            `Propuesta de ${selectedProposal.symbol} rechazada.`,
            `${selectedProposal.symbol} proposal rejected.`,
          ),
    );
  }

  function handleSendMessage(body: string) {
    if (!selectedProposal) return;
    const localMsg: ProposalChatMessage = {
      id: `msg-${Date.now()}`,
      proposal_id: selectedProposal.id,
      author_id:
        roleMode === 'broker'
          ? selectedProposal.broker.id
          : selectedProposal.investor.id,
      body,
      created_at: new Date().toISOString(),
    };
    setMessagesByProposal((prev) => ({
      ...prev,
      [selectedProposal.id]: [...(prev[selectedProposal.id] ?? []), localMsg],
    }));
  }

  function handleBrokerAcceptRequest(req: BrokerPendingRequest) {
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setBrokerClients((prev) => [
      {
        investor_id: req.investor_id,
        name: req.investor_name,
        link_id: req.id,
        since: new Date().toISOString(),
        trading_authorized: true,
        order_review_enabled: true,
      },
      ...prev,
    ]);
    setStatusToast(
      tx(
        `Solicitud de vinculación de ${req.investor_name} aceptada.`,
        `Link request from ${req.investor_name} accepted.`,
      ),
    );
  }

  function handleBrokerDeclineRequest(req: BrokerPendingRequest) {
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setStatusToast(
      tx(
        `Solicitud de ${req.investor_name} declinada.`,
        `Request from ${req.investor_name} declined.`,
      ),
    );
  }

  function handleCreateBrokerProposal(draft: BrokerProposalDraft) {
    const clientObj = brokerClients.find(
      (c) => c.investor_id === draft.clientId,
    );
    const estCost = (
      (Number(draft.qty) || 1) *
      (draft.type === 'limit' ? Number(draft.limitPrice) || 150 : 175) *
      1.02
    ).toFixed(2);
    const newProp: ProposalItem = {
      id: `prop-${Date.now()}`,
      link_id: clientObj?.link_id ?? 'lnk-default',
      status: 'sent',
      status_reason: null,
      current_version: 1,
      accepted_version: null,
      order_id: null,
      failure_code: null,
      broker: {
        id: 'a0112233-4455-6677-8899-aabbccddeeff',
        name: 'Carlos Andrés Rodríguez MSc.',
      },
      investor: {
        id: draft.clientId,
        name: clientObj?.name ?? tx('Inversionista', 'Investor'),
      },
      symbol: draft.symbol,
      side: draft.side,
      qty: draft.qty,
      type: draft.type,
      limit_price: draft.type === 'limit' ? draft.limitPrice : null,
      estimated_cost: estCost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
    };
    setProposals((prev) => [newProp, ...prev]);
    setSelectedProposalId(newProp.id);
    setStatusToast(
      tx(
        `Propuesta de ${draft.side === 'buy' ? 'compra' : 'venta'} de ${draft.qty} ${draft.symbol} enviada a ${clientObj?.name ?? 'el cliente'}.`,
        `${draft.side === 'buy' ? 'Buy' : 'Sell'} proposal for ${draft.qty} ${draft.symbol} sent to ${clientObj?.name ?? 'the client'}.`,
      ),
    );
  }

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
          <span className={styles.topEyebrow}>
            <Icon name="shield" size={13} />
            {tx(
              'Asesoría Bursátil & Custodia 2FA',
              'Brokerage Advisory & 2FA Custody',
            )}
          </span>
          <h2 className={styles.topTitle}>
            {tx(
              roleMode === 'broker'
                ? 'Portal del comisionista'
                : 'Comisionistas y propuestas de inversión',
              roleMode === 'broker'
                ? 'Broker workspace'
                : 'Brokers & investment proposals',
            )}
          </h2>
          <p className={styles.topSubtitle}>
            {tx(
              roleMode === 'broker'
                ? 'Gestiona tus vínculos de asesoría, propuestas y revisiones desde un solo lugar.'
                : 'Gestiona tu asesor asignado, explora el directorio y consulta tus propuestas de inversión.',
              roleMode === 'broker'
                ? 'Manage advisory links, proposals, and reviews in one place.'
                : 'Manage your assigned advisor, explore the directory, and review investment proposals.',
            )}
          </p>
        </div>

        {canAccessBrokerPortal && (
          <div
            className={styles.roleSwitcher}
            role="group"
            aria-label={tx('Selector de perfil', 'View mode switcher')}
          >
            <button
              type="button"
              aria-pressed={roleMode === 'investor'}
              className={`${styles.roleSwitchBtn} ${
                roleMode === 'investor' ? styles.roleSwitchBtnActive : ''
              }`}
              onClick={() => setRoleMode('investor')}
            >
              <Icon name="user" size={15} />
              {tx('Vista Inversionista', 'Investor View')}
            </button>
            <button
              type="button"
              aria-pressed={roleMode === 'broker'}
              className={`${styles.roleSwitchBtn} ${
                roleMode === 'broker' ? styles.roleSwitchBtnActive : ''
              }`}
              onClick={() => setRoleMode('broker')}
            >
              <Icon name="users" size={15} />
              {tx('Portal Comisionista', 'Broker Portal')}
            </button>
          </div>
        )}
      </div>

      {statusToast && (
        <div className={styles.statusToast} role="status">
          <div className={styles.statusToastBody}>
            <Icon name="check" size={18} />
            <span className={styles.statusToastText}>{statusToast}</span>
          </div>
          <button
            type="button"
            className={styles.toastDismissBtn}
            onClick={() => setStatusToast(null)}
            aria-label={tx('Cerrar notificación', 'Dismiss notification')}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {roleMode === 'investor' && (
        <>
          <div
            className={styles.subTabs}
            role="tablist"
            aria-label={tx('Vistas de inversionista', 'Investor sections')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={investorTab === 'current-link'}
              className={`${styles.subTabBtn} ${
                investorTab === 'current-link' ? styles.subTabBtnActive : ''
              }`}
              onClick={() => setInvestorTab('current-link')}
            >
              <Icon name="shield" size={15} />
              <span>
                {tx(
                  '1. Mi Comisionista y Permisos',
                  '1. My Broker & Permissions',
                )}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={investorTab === 'directory'}
              className={`${styles.subTabBtn} ${
                investorTab === 'directory' ? styles.subTabBtnActive : ''
              }`}
              onClick={() => setInvestorTab('directory')}
            >
              <Icon name="users" size={15} />
              <span>
                {tx('2. Directorio de Comisionistas', '2. Broker Directory')}
              </span>
              <span className={styles.tabCount}>{directory.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={investorTab === 'proposals'}
              className={`${styles.subTabBtn} ${
                investorTab === 'proposals' ? styles.subTabBtnActive : ''
              }`}
              onClick={() => setInvestorTab('proposals')}
            >
              <Icon name="file" size={15} />
              <span>
                {tx('3. Propuestas Recibidas y Chat', '3. Proposals & Chat')}
              </span>
              <span className={styles.tabCount}>{proposals.length}</span>
            </button>
          </div>

          {investorTab === 'current-link' && (
            <InvestorCurrentLinkTab
              activeLink={activeLink}
              tradingAuthorized={tradingAuthorized}
              onOpenDirectory={() => setInvestorTab('directory')}
              onOpenProposals={() => setInvestorTab('proposals')}
              onToggleTradingAuth={handleToggleTradingAuth}
              onToggleOrderReview={handleToggleOrderReview}
              onEndLink={handleEndLink}
              onRateBroker={handleRateBroker}
            />
          )}

          {investorTab === 'directory' && (
            <InvestorDirectoryTab
              directory={filteredDirectory}
              totalCount={directory.length}
              activeBrokerId={activeLink?.broker_id ?? null}
              reviewsByBroker={reviewsByBroker}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRequestLink={handleRequestLink}
            />
          )}

          {investorTab === 'proposals' && (
            <InvestorProposalsTab
              proposals={proposals}
              selectedProposal={selectedProposal}
              messages={currentMessages}
              onSelectProposal={setSelectedProposalId}
              onDecision={handleProposalDecision}
              onSendMessage={handleSendMessage}
              onNavigateToOrder={onNavigateToOrder}
            />
          )}
        </>
      )}

      {roleMode === 'broker' && (
        <>
          <BrokerWorkspaceOverview
            requests={pendingRequests.length}
            clients={brokerClients.length}
            reviews={pendingOrderReviews.length}
            onOpen={setBrokerTab}
          />
          <div
            className={styles.subTabs}
            role="tablist"
            aria-label={tx(
              'Vistas de portal comisionista',
              'Broker portal sections',
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={brokerTab === 'clients'}
              className={`${styles.subTabBtn} ${
                brokerTab === 'clients' ? styles.subTabBtnActive : ''
              }`}
              onClick={() => setBrokerTab('clients')}
            >
              <Icon name="users" size={15} />
              <span>
                {tx('1. Solicitudes y Cartera', '1. Requests & Clients')}
              </span>
              <span className={styles.tabCount}>
                {pendingRequests.length}/{brokerClients.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={brokerTab === 'new-proposal'}
              className={`${styles.subTabBtn} ${
                brokerTab === 'new-proposal' ? styles.subTabBtnActive : ''
              }`}
              onClick={() => setBrokerTab('new-proposal')}
            >
              <Icon name="trend" size={15} />
              <span>
                {tx(
                  '2. Emitir Propuesta de Inversión',
                  '2. Issue Investment Proposal',
                )}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={brokerTab === 'reviews-reports'}
              className={`${styles.subTabBtn} ${
                brokerTab === 'reviews-reports' ? styles.subTabBtnActive : ''
              }`}
              onClick={() => setBrokerTab('reviews-reports')}
            >
              <Icon name="check" size={15} />
              <span>
                {tx(
                  '3. Revisión de Órdenes y Comisiones',
                  '3. Order Review & Commissions',
                )}
              </span>
              {pendingOrderReviews.length > 0 && (
                <span className={styles.tabCount}>
                  {pendingOrderReviews.length}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={brokerTab === 'my-profile'}
              className={`${styles.subTabBtn} ${
                brokerTab === 'my-profile' ? styles.subTabBtnActive : ''
              }`}
              onClick={() => setBrokerTab('my-profile')}
            >
              <Icon name="user" size={15} />
              <span>
                {tx('4. Mi Perfil Profesional', '4. My Professional Profile')}
              </span>
            </button>
          </div>

          {brokerTab === 'clients' && (
            <BrokerPortalClientsTab
              pendingRequests={pendingRequests}
              brokerClients={brokerClients}
              onAcceptRequest={handleBrokerAcceptRequest}
              onDeclineRequest={handleBrokerDeclineRequest}
            />
          )}

          {brokerTab === 'new-proposal' && (
            <BrokerPortalNewProposalTab
              brokerClients={brokerClients}
              onCreateProposal={handleCreateBrokerProposal}
            />
          )}

          {brokerTab === 'reviews-reports' && (
            <BrokerPortalReviewsTab
              pendingOrderReviews={pendingOrderReviews}
              onApproveOrder={(ord) => {
                setPendingOrderReviews((prev) =>
                  prev.filter((o) => o.id !== ord.id),
                );
                setStatusToast(
                  tx(
                    `Orden de ${ord.symbol} para ${ord.investor_name} aprobada.`,
                    `${ord.symbol} order for ${ord.investor_name} approved.`,
                  ),
                );
              }}
              onRejectOrder={(ord) => {
                setPendingOrderReviews((prev) =>
                  prev.filter((o) => o.id !== ord.id),
                );
                setStatusToast(
                  tx(
                    `Orden de ${ord.symbol} rechazada con observaciones.`,
                    `${ord.symbol} order rejected with feedback.`,
                  ),
                );
              }}
              onGenerateCertificate={() =>
                setStatusToast(
                  tx(
                    'Certificado consolidado de comisiones generado correctamente.',
                    'Consolidated commission statement generated.',
                  ),
                )
              }
            />
          )}

          {brokerTab === 'my-profile' && (
            <BrokerPortalProfileTab
              onSaveProfile={() =>
                setStatusToast(
                  tx(
                    'Perfil profesional de comisionista actualizado correctamente.',
                    'Broker professional profile updated.',
                  ),
                )
              }
            />
          )}
        </>
      )}
    </section>
  );
}
