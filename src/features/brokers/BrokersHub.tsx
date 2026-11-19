'use client';

import { useState } from 'react';
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
import styles from './brokers.module.css';

export interface BrokersHubProps {
  userRoles?: string[];
  onNavigateToOrder?: (symbol: string) => void;
}

type InvestorSubTab = 'current-link' | 'directory' | 'proposals';
type BrokerSubTab =
  'clients' | 'new-proposal' | 'reviews-reports' | 'my-profile';

const linkStatusLabels: Record<string, string> = {
  requested: 'Solicitud enviada',
  active: 'Vínculo activo',
  declined: 'Declinado',
  canceled: 'Cancelado',
  expired: 'Expirado',
  ended: 'Finalizado',
};

const proposalStatusLabels: Record<string, string> = {
  sent: 'Pendiente de firma',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
  approved: 'Ejecutada',
  declined_by_broker: 'Declinada',
  conversion_failed: 'Con observaciones',
  expired: 'Expirada',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function BrokersHub({ userRoles = [] }: BrokersHubProps) {
  const defaultRoleMode = userRoles.includes('broker') ? 'broker' : 'investor';
  const [roleMode, setRoleMode] = useState<'investor' | 'broker'>(
    defaultRoleMode,
  );
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

  // Forms (Investor)
  const [chatInput, setChatInput] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [decisionComment, setDecisionComment] = useState('');
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Portal Broker states
  const [pendingRequests, setPendingRequests] = useState<
    BrokerPendingRequest[]
  >(INITIAL_BROKER_REQUESTS);
  const [brokerClients, setBrokerClients] = useState<BrokerClientItem[]>(
    INITIAL_BROKER_CLIENTS,
  );
  const [propClientId, setPropClientId] = useState(
    INITIAL_BROKER_CLIENTS[0]?.investor_id ?? '',
  );
  const [propSymbol, setPropSymbol] = useState('NVDA');
  const [propSide, setPropSide] = useState<'buy' | 'sell'>('buy');
  const [propQty, setPropQty] = useState('10');
  const [propType, setPropType] = useState<'market' | 'limit'>('limit');
  const [propLimitPrice, setPropLimitPrice] = useState('885.00');

  const [profSpecialty, setProfSpecialty] = useState(
    'Tecnología, Semiconductores & S&P 500 (NASDAQ / NYSE)',
  );
  const [profYears, setProfYears] = useState(11);
  const [profCerts, setProfCerts] = useState(
    'FINRA Series 7, CFA Level III, AMV Renta Variable',
  );
  const [profDesc, setProfDesc] = useState(
    'Estratega senior en acciones de gran capitalización en EE. UU., cobertura cambiaria USD y carteras de crecimiento tecnológico.',
  );

  const [pendingOrderReviews, setPendingOrderReviews] = useState([
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
  ]);

  const [statusToast, setStatusToast] = useState<string | null>(null);

  const activeLink = currentLinkData.link;
  const tradingAuthorized =
    Boolean(currentLinkData.trading_authorization) &&
    !currentLinkData.trading_authorization?.revoked_at;

  const selectedProposal =
    proposals.find((p) => p.id === selectedProposalId) ?? proposals[0] ?? null;

  const currentMessages = selectedProposal
    ? (messagesByProposal[selectedProposal.id] ?? [])
    : [];

  const handleToggleTradingAuth = () => {
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
        ? 'Autorización de operación delegada revocada correctamente.'
        : 'Autorización de operación delegada activada para tu comisionista.',
    );
  };

  const handleToggleOrderReview = () => {
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
        ? 'Revisión previa de órdenes por el comisionista activada.'
        : 'Revisión previa de órdenes desactivada.',
    );
  };

  const handleRequestLink = (broker: BrokerDirectoryItem) => {
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
      `Solicitud de vinculación confirmada con ${broker.name} (${broker.firm_name}).`,
    );
  };

  const handleEndLink = () => {
    if (!activeLink) return;
    setCurrentLinkData((prev) => ({
      ...prev,
      link: null,
      trading_authorization: null,
      pending_broker_selection: true,
    }));
    setStatusToast(
      'Vínculo con el comisionista finalizado. Puedes elegir un nuevo asesor en el directorio.',
    );
  };

  const handleRateBroker = () => {
    if (!activeLink) return;
    const brokerId = activeLink.broker_id;
    const newReview: BrokerReviewItem = {
      stars: ratingStars,
      comment:
        ratingComment.trim() ||
        'Excelente asesoría financiera en mercados de EE. UU.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setReviewsByBroker((prev) => ({
      ...prev,
      [brokerId]: [newReview, ...(prev[brokerId] ?? [])],
    }));
    setRatingComment('');
    setStatusToast(
      `Calificación de ${ratingStars} estrellas registrada para ${activeLink.broker.name}.`,
    );
  };

  const handleProposalDecision = (decision: 'accept' | 'reject') => {
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
    setTotpInput('');
    setDecisionComment('');
    setStatusToast(
      decision === 'accept'
        ? `Propuesta de ${selectedProposal.symbol} aceptada y firmada con tu código 2FA.`
        : `Propuesta de ${selectedProposal.symbol} rechazada.`,
    );
  };

  const handleSendMessage = () => {
    if (!selectedProposal || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    const localMsg: ProposalChatMessage = {
      id: `msg-${Date.now()}`,
      proposal_id: selectedProposal.id,
      author_id:
        roleMode === 'broker'
          ? selectedProposal.broker.id
          : selectedProposal.investor.id,
      body: text,
      created_at: new Date().toISOString(),
    };
    setMessagesByProposal((prev) => ({
      ...prev,
      [selectedProposal.id]: [...(prev[selectedProposal.id] ?? []), localMsg],
    }));
  };

  const handleBrokerAcceptRequest = (req: BrokerPendingRequest) => {
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
      `Solicitud de vinculación de ${req.investor_name} aceptada.`,
    );
  };

  const handleBrokerDeclineRequest = (req: BrokerPendingRequest) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
    setStatusToast(`Solicitud de ${req.investor_name} declinada.`);
  };

  const handleCreateBrokerProposal = () => {
    const clientObj = brokerClients.find((c) => c.investor_id === propClientId);
    const estCost = (
      (Number(propQty) || 1) *
      (propType === 'limit' ? Number(propLimitPrice) || 150 : 175) *
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
        id: propClientId,
        name: clientObj?.name ?? 'Inversionista',
      },
      symbol: propSymbol.toUpperCase(),
      side: propSide,
      qty: propQty,
      type: propType,
      limit_price: propType === 'limit' ? propLimitPrice : null,
      estimated_cost: estCost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
    };
    setProposals((prev) => [newProp, ...prev]);
    setSelectedProposalId(newProp.id);
    setStatusToast(
      `Propuesta de ${propSide === 'buy' ? 'compra' : 'venta'} de ${propQty} ${propSymbol.toUpperCase()} enviada a ${clientObj?.name ?? 'el cliente'}.`,
    );
  };

  const handleSaveBrokerProfile = () => {
    setStatusToast(
      'Perfil profesional de comisionista actualizado correctamente.',
    );
  };

  const filteredDirectory = searchQuery.trim()
    ? directory.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.firm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.specialty.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : directory;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.topTitleGroup}>
          <h2 className={styles.topTitle}>
            Comisionistas y Propuestas de Inversión
          </h2>
          <p className={styles.topSubtitle}>
            Gestiona tu asesor asignado, explora el directorio de profesionales
            certificados y autoriza propuestas bursátiles en Wall Street.
          </p>
        </div>

        <div className={styles.roleSwitcher}>
          <button
            type="button"
            className={`${styles.roleSwitchBtn} ${roleMode === 'investor' ? styles.roleSwitchBtnActive : ''}`}
            onClick={() => setRoleMode('investor')}
          >
            Vista Inversionista
          </button>
          <button
            type="button"
            className={`${styles.roleSwitchBtn} ${roleMode === 'broker' ? styles.roleSwitchBtnActive : ''}`}
            onClick={() => setRoleMode('broker')}
          >
            Portal Comisionista
          </button>
        </div>
      </div>

      {statusToast && (
        <div className={styles.statusToast} role="status">
          {statusToast}
        </div>
      )}

      {/* =========================================================
          VISTA INVERSIONISTA
         ========================================================= */}
      {roleMode === 'investor' && (
        <>
          <div className={styles.subTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={investorTab === 'current-link'}
              className={`${styles.subTabBtn} ${investorTab === 'current-link' ? styles.subTabBtnActive : ''}`}
              onClick={() => setInvestorTab('current-link')}
            >
              1. Mi Comisionista y Permisos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={investorTab === 'directory'}
              className={`${styles.subTabBtn} ${investorTab === 'directory' ? styles.subTabBtnActive : ''}`}
              onClick={() => setInvestorTab('directory')}
            >
              2. Directorio de Comisionistas ({directory.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={investorTab === 'proposals'}
              className={`${styles.subTabBtn} ${investorTab === 'proposals' ? styles.subTabBtnActive : ''}`}
              onClick={() => setInvestorTab('proposals')}
            >
              3. Propuestas Recibidas y Chat ({proposals.length})
            </button>
          </div>

          {investorTab === 'current-link' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    Estado de Vinculación y Permisos de Operación
                  </h3>
                  <p className={styles.cardDesc}>
                    Configura las autorizaciones de acompañamiento y supervisión
                    de órdenes con tu asesor asignado.
                  </p>
                </div>
                {activeLink && (
                  <span className={styles.badgeSuccess}>
                    {linkStatusLabels[activeLink.status] ?? 'Vínculo activo'}
                  </span>
                )}
              </div>

              {activeLink ? (
                <>
                  <div className={styles.controlsGrid}>
                    <div className={styles.controlBox}>
                      <div>
                        <div className={styles.controlTitle}>
                          Asesor Asignado: {activeLink.broker.name}
                        </div>
                        <div className={styles.controlHint}>
                          Firma: {activeLink.broker.firm_name} · Activo desde:{' '}
                          {new Date(
                            activeLink.started_at ?? activeLink.requested_at,
                          ).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                      <div className={styles.btnRow}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={() => setInvestorTab('proposals')}
                        >
                          Ver Propuestas y Chat →
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={handleEndLink}
                        >
                          Finalizar Vínculo
                        </button>
                      </div>
                    </div>

                    <div className={styles.controlBox}>
                      <div>
                        <div className={styles.controlTitle}>
                          Autorización de Operación Delegada
                        </div>
                        <div className={styles.controlHint}>
                          Permite que tu comisionista estructure propuestas y
                          ejecute órdenes previamente aceptadas con tu 2FA.
                        </div>
                      </div>
                      <div className={styles.btnRow}>
                        <span
                          className={
                            tradingAuthorized
                              ? styles.badgeSuccess
                              : styles.badgeWarning
                          }
                        >
                          {tradingAuthorized ? 'Autorizado' : 'Revocado'}
                        </span>
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          onClick={handleToggleTradingAuth}
                        >
                          {tradingAuthorized
                            ? 'Revocar Autorización'
                            : 'Autorizar Operación'}
                        </button>
                      </div>
                    </div>

                    <div className={styles.controlBox}>
                      <div>
                        <div className={styles.controlTitle}>
                          Revisión de Órdenes por el Comisionista
                        </div>
                        <div className={styles.controlHint}>
                          Cuando está activa, las órdenes de alto monto
                          requieren visto bueno de tu comisionista antes de
                          enviarse al mercado.
                        </div>
                      </div>
                      <div className={styles.btnRow}>
                        <span
                          className={
                            activeLink.order_review_enabled
                              ? styles.badgeSuccess
                              : styles.badgeWarning
                          }
                        >
                          {activeLink.order_review_enabled
                            ? 'Activa'
                            : 'Desactivada'}
                        </span>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          onClick={handleToggleOrderReview}
                        >
                          {activeLink.order_review_enabled
                            ? 'Desactivar Revisión'
                            : 'Activar Revisión'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calificar al comisionista */}
                  <div className={styles.controlBox}>
                    <div className={styles.controlTitle}>
                      Calificar Desempeño de tu Comisionista
                    </div>
                    <div className={styles.formGrid}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          Puntuación (1 a 5 estrellas)
                        </label>
                        <select
                          className={styles.inputField}
                          value={ratingStars}
                          onChange={(e) =>
                            setRatingStars(Number(e.target.value))
                          }
                        >
                          <option value={5}>★★★★★ (5 - Excelente)</option>
                          <option value={4}>★★★★☆ (4 - Muy Bueno)</option>
                          <option value={3}>★★★☆☆ (3 - Aceptable)</option>
                          <option value={2}>★★☆☆☆ (2 - Regular)</option>
                          <option value={1}>★☆☆☆☆ (1 - Deficiente)</option>
                        </select>
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          Reseña de Acompañamiento
                        </label>
                        <input
                          type="text"
                          className={styles.inputField}
                          placeholder="Escribe tu comentario sobre la asesoría recibida..."
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={styles.btnRow}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={handleRateBroker}
                      >
                        Enviar Calificación
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.controlBox}>
                  <div className={styles.controlTitle}>
                    No tienes un comisionista vinculado actualmente
                  </div>
                  <div className={styles.controlHint}>
                    Explora el directorio oficial de comisionistas verificados
                    para solicitar acompañamiento en Wall Street.
                  </div>
                  <div className={styles.btnRow}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => setInvestorTab('directory')}
                    >
                      Explorar Directorio de Comisionistas →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {investorTab === 'directory' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    Directorio Oficial de Comisionistas Certificados
                  </h3>
                  <p className={styles.cardDesc}>
                    Conoce la trayectoria, especialidad y calificaciones de los
                    asesores disponibles para acompañarte en NYSE y NASDAQ.
                  </p>
                </div>
                <input
                  type="search"
                  className={styles.inputField}
                  style={{ maxWidth: '300px' }}
                  placeholder="Buscar por nombre, firma o especialidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.directoryGrid}>
                {filteredDirectory.map((broker) => {
                  const isLinked = activeLink?.broker_id === broker.id;
                  const brokerReviews = reviewsByBroker[broker.id] ?? [];
                  return (
                    <div key={broker.id} className={styles.brokerCard}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                        }}
                      >
                        <div className={styles.brokerHeader}>
                          <div className={styles.brokerAvatar}>
                            {broker.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={broker.avatarUrl}
                                alt={broker.name}
                                className={styles.brokerAvatarImg}
                              />
                            ) : (
                              getInitials(broker.name)
                            )}
                          </div>
                          <div>
                            <div className={styles.brokerName}>
                              {broker.name}
                            </div>
                            <div className={styles.brokerFirm}>
                              {broker.firm_name}
                            </div>
                          </div>
                        </div>

                        <div className={styles.brokerSpecialty}>
                          {broker.specialty}
                        </div>
                        {broker.description && (
                          <div className={styles.controlHint}>
                            {broker.description}
                          </div>
                        )}

                        <div className={styles.certRow}>
                          {broker.certifications.map((cert) => (
                            <span key={cert} className={styles.certChip}>
                              {cert}
                            </span>
                          ))}
                        </div>

                        <div className={styles.statsRow}>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Reputación</span>
                            <span className={styles.statVal}>
                              ★ {broker.reputation.average ?? '5.0'} (
                              {broker.reputation.reviews_count})
                            </span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>
                              Experiencia
                            </span>
                            <span className={styles.statVal}>
                              {broker.years_experience} años
                            </span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>
                              Propuestas Éxito
                            </span>
                            <span className={styles.statVal}>
                              {broker.reputation.converted_proposals}
                            </span>
                          </div>
                        </div>

                        {brokerReviews[0] && (
                          <div
                            className={styles.controlHint}
                            style={{ fontStyle: 'italic' }}
                          >
                            “{brokerReviews[0].comment}” (★{' '}
                            {brokerReviews[0].stars}/5)
                          </div>
                        )}
                      </div>

                      <div className={styles.btnRow}>
                        {isLinked ? (
                          <span className={styles.badgeSuccess}>
                            ✓ Tu Comisionista Actual
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => handleRequestLink(broker)}
                          >
                            Solicitar Vinculación
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {investorTab === 'proposals' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    Bandeja de Propuestas de Inversión y Mensajería
                  </h3>
                  <p className={styles.cardDesc}>
                    Revisa las recomendaciones enviadas por tu comisionista,
                    conversa en el hilo de la propuesta y autoriza su ejecución
                    con tu código 2FA.
                  </p>
                </div>
              </div>

              <div className={styles.proposalsLayout}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  {proposals.map((prop) => (
                    <div
                      key={prop.id}
                      className={`${styles.proposalCard} ${selectedProposal?.id === prop.id ? styles.proposalCardActive : ''}`}
                      onClick={() => setSelectedProposalId(prop.id)}
                    >
                      <div className={styles.cardHeader}>
                        <div>
                          <strong style={{ fontSize: '0.96rem' }}>
                            {prop.side === 'buy' ? 'Compra' : 'Venta'}{' '}
                            {prop.qty} {prop.symbol}
                          </strong>{' '}
                          <span className={styles.certChip}>
                            {prop.type === 'limit' ? 'Límite' : 'Mercado'}
                          </span>
                        </div>
                        <span
                          className={
                            prop.status === 'approved' ||
                            prop.status === 'accepted'
                              ? styles.badgeSuccess
                              : styles.badgeWarning
                          }
                        >
                          {proposalStatusLabels[prop.status] ?? prop.status} (v
                          {prop.current_version})
                        </span>
                      </div>

                      <div className={styles.controlHint}>
                        Comisionista: <strong>{prop.broker.name}</strong> ·
                        Costo estimado:{' '}
                        <strong>
                          ${Number(prop.estimated_cost).toLocaleString('en-US')}{' '}
                          USD
                        </strong>
                        {prop.limit_price
                          ? ` · Precio Límite: $${prop.limit_price} USD`
                          : ''}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedProposal && (
                  <div className={styles.chatBox}>
                    <div className={styles.controlTitle}>
                      Detalle y Decisión sobre {selectedProposal.symbol}{' '}
                      (Versión {selectedProposal.current_version})
                    </div>

                    {selectedProposal.status === 'sent' && (
                      <div
                        className={styles.controlBox}
                        style={{ background: 'var(--surface-secondary)' }}
                      >
                        <div className={styles.controlTitle}>
                          Autorizar o Rechazar Propuesta (Confirmación 2FA)
                        </div>
                        <div className={styles.formGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>
                              Código 2FA (6 dígitos)
                            </label>
                            <input
                              type="text"
                              className={styles.inputField}
                              placeholder="Ej. 123456"
                              value={totpInput}
                              onChange={(e) => setTotpInput(e.target.value)}
                            />
                          </div>
                          <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>
                              Comentario para el asesor
                            </label>
                            <input
                              type="text"
                              className={styles.inputField}
                              placeholder="Autorizo ejecución en NASDAQ..."
                              value={decisionComment}
                              onChange={(e) =>
                                setDecisionComment(e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className={styles.btnRow}>
                          <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => handleProposalDecision('accept')}
                          >
                            ✓ Aceptar y Firmar Propuesta
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => handleProposalDecision('reject')}
                          >
                            ✕ Rechazar Propuesta
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={styles.controlTitle}>
                      Conversación de la Propuesta
                    </div>
                    <div className={styles.messagesList}>
                      {currentMessages.length === 0 ? (
                        <div className={styles.controlHint}>
                          Aún no hay mensajes en esta propuesta. Escribe abajo
                          para conversar con tu asesor.
                        </div>
                      ) : (
                        currentMessages.map((m) => (
                          <div key={m.id} className={styles.messageBubble}>
                            <div className={styles.messageMeta}>
                              <span>
                                {m.author_id === selectedProposal.broker.id
                                  ? `Asesor: ${selectedProposal.broker.name}`
                                  : 'Tú (Inversionista)'}
                              </span>
                              <span>
                                {new Date(m.created_at).toLocaleTimeString(
                                  'es-CO',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </span>
                            </div>
                            <div className={styles.messageText}>{m.body}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className={styles.btnRow}>
                      <input
                        type="text"
                        className={styles.inputField}
                        style={{ flex: 1 }}
                        placeholder="Escribe un mensaje a tu comisionista sobre esta operación..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={handleSendMessage}
                      >
                        Enviar Mensaje
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================
          VISTA PORTAL COMISIONISTA (BROKER)
         ========================================================= */}
      {roleMode === 'broker' && (
        <>
          <div className={styles.subTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={brokerTab === 'clients'}
              className={`${styles.subTabBtn} ${brokerTab === 'clients' ? styles.subTabBtnActive : ''}`}
              onClick={() => setBrokerTab('clients')}
            >
              1. Solicitudes ({pendingRequests.length}) y Cartera (
              {brokerClients.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={brokerTab === 'new-proposal'}
              className={`${styles.subTabBtn} ${brokerTab === 'new-proposal' ? styles.subTabBtnActive : ''}`}
              onClick={() => setBrokerTab('new-proposal')}
            >
              2. Emitir Propuesta de Inversión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={brokerTab === 'reviews-reports'}
              className={`${styles.subTabBtn} ${brokerTab === 'reviews-reports' ? styles.subTabBtnActive : ''}`}
              onClick={() => setBrokerTab('reviews-reports')}
            >
              3. Revisión de Órdenes y Comisiones
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={brokerTab === 'my-profile'}
              className={`${styles.subTabBtn} ${brokerTab === 'my-profile' ? styles.subTabBtnActive : ''}`}
              onClick={() => setBrokerTab('my-profile')}
            >
              4. Mi Perfil Profesional
            </button>
          </div>

          {brokerTab === 'clients' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    Solicitudes de Vinculación Pendientes
                  </h3>
                  <p className={styles.cardDesc}>
                    Acepta o declina nuevos clientes que han solicitado tu
                    asesoría bursátil.
                  </p>
                </div>
              </div>

              {pendingRequests.length === 0 ? (
                <div className={styles.controlHint}>
                  No tienes solicitudes pendientes por responder en este
                  momento.
                </div>
              ) : (
                <div className={styles.controlsGrid}>
                  {pendingRequests.map((req) => (
                    <div key={req.id} className={styles.controlBox}>
                      <div>
                        <div className={styles.controlTitle}>
                          {req.investor_name}
                        </div>
                        <div className={styles.controlHint}>
                          Solicitado:{' '}
                          {new Date(req.requested_at).toLocaleString('es-CO')}
                        </div>
                      </div>
                      <div className={styles.btnRow}>
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          onClick={() => handleBrokerAcceptRequest(req)}
                        >
                          ✓ Aceptar Cliente
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => handleBrokerDeclineRequest(req)}
                        >
                          ✕ Declinar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.cardHeader} style={{ marginTop: '1rem' }}>
                <div>
                  <h3 className={styles.cardTitle}>
                    Cartera de Inversionistas Asignados
                  </h3>
                  <p className={styles.cardDesc}>
                    Clientes activos bajo tu acompañamiento y estado de sus
                    permisos operativos.
                  </p>
                </div>
              </div>

              <div className={styles.controlsGrid}>
                {brokerClients.map((cli) => (
                  <div key={cli.investor_id} className={styles.controlBox}>
                    <div>
                      <div className={styles.controlTitle}>{cli.name}</div>
                      <div className={styles.controlHint}>
                        Cliente desde:{' '}
                        {new Date(cli.since).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                    <div className={styles.btnRow}>
                      <span
                        className={
                          cli.trading_authorized
                            ? styles.badgeSuccess
                            : styles.badgeWarning
                        }
                      >
                        Operación:{' '}
                        {cli.trading_authorized ? 'Autorizada' : 'Pendiente'}
                      </span>
                      <span
                        className={
                          cli.order_review_enabled
                            ? styles.badgeSuccess
                            : styles.badgeWarning
                        }
                      >
                        Revisión Órdenes:{' '}
                        {cli.order_review_enabled ? 'Activa' : 'No'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {brokerTab === 'new-proposal' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    Estructurar y Enviar Nueva Propuesta a un Cliente
                  </h3>
                  <p className={styles.cardDesc}>
                    La propuesta quedará disponible en la bandeja del
                    inversionista para su revisión y firma con código 2FA.
                  </p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Cliente Inversionista
                  </label>
                  <select
                    className={styles.inputField}
                    value={propClientId}
                    onChange={(e) => setPropClientId(e.target.value)}
                  >
                    {brokerClients.map((c) => (
                      <option key={c.investor_id} value={c.investor_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Símbolo (NYSE / NASDAQ)
                  </label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={propSymbol}
                    onChange={(e) => setPropSymbol(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Tipo de Operación</label>
                  <select
                    className={styles.inputField}
                    value={propSide}
                    onChange={(e) =>
                      setPropSide(e.target.value as 'buy' | 'sell')
                    }
                  >
                    <option value="buy">Compra</option>
                    <option value="sell">Venta</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Cantidad de Acciones
                  </label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={propQty}
                    onChange={(e) => setPropQty(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Tipo de Orden</label>
                  <select
                    className={styles.inputField}
                    value={propType}
                    onChange={(e) =>
                      setPropType(e.target.value as 'market' | 'limit')
                    }
                  >
                    <option value="limit">Orden Límite (Limit)</option>
                    <option value="market">Orden de Mercado (Market)</option>
                  </select>
                </div>

                {propType === 'limit' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      Precio Límite (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.inputField}
                      value={propLimitPrice}
                      onChange={(e) => setPropLimitPrice(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className={styles.btnRow}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleCreateBrokerProposal}
                >
                  Enviar Propuesta al Cliente
                </button>
              </div>
            </div>
          )}

          {brokerTab === 'reviews-reports' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    Bandeja de Órdenes en Revisión y Comisiones del Asesor
                  </h3>
                  <p className={styles.cardDesc}>
                    Supervisa las órdenes enviadas por tus clientes y consulta
                    el consolidado de tus comisiones devengadas.
                  </p>
                </div>
              </div>

              <div className={styles.controlsGrid}>
                {pendingOrderReviews.length === 0 ? (
                  <div className={styles.controlBox}>
                    <div className={styles.controlTitle}>
                      Sin órdenes pendientes de firma
                    </div>
                    <div className={styles.controlHint}>
                      Todas las órdenes de tus clientes han sido revisadas.
                    </div>
                  </div>
                ) : (
                  pendingOrderReviews.map((ord) => (
                    <div key={ord.id} className={styles.controlBox}>
                      <div>
                        <div className={styles.controlTitle}>
                          {ord.side === 'buy' ? 'Compra' : 'Venta'} {ord.qty}{' '}
                          {ord.symbol} · {ord.investor_name}
                        </div>
                        <div className={styles.controlHint}>
                          Tipo: {ord.type === 'limit' ? 'Límite' : 'Mercado'} ($
                          {ord.limit_price} USD) · Monto estimado: $
                          {ord.notional_usd} USD
                        </div>
                      </div>
                      <div className={styles.btnRow}>
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          onClick={() => {
                            setPendingOrderReviews((prev) =>
                              prev.filter((o) => o.id !== ord.id),
                            );
                            setStatusToast(
                              `Orden de ${ord.symbol} para ${ord.investor_name} aprobada.`,
                            );
                          }}
                        >
                          ✓ Aprobar Orden del Cliente
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => {
                            setPendingOrderReviews((prev) =>
                              prev.filter((o) => o.id !== ord.id),
                            );
                            setStatusToast(
                              `Orden de ${ord.symbol} rechazada con observaciones.`,
                            );
                          }}
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className={styles.controlBox}>
                  <div>
                    <div className={styles.controlTitle}>
                      Liquidación de Comisiones del Asesor (40% del 2% Total)
                    </div>
                    <div className={styles.controlHint}>
                      Volumen gestionado en el mes:{' '}
                      <strong>$64,572.00 USD</strong> · Comisión acumulada para
                      el comisionista (0.8% neto): <strong>$516.58 USD</strong>.
                    </div>
                  </div>
                  <div className={styles.btnRow}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() =>
                        setStatusToast(
                          'Certificado consolidado de comisiones generado correctamente.',
                        )
                      }
                    >
                      + Generar Certificado de Comisiones
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {brokerTab === 'my-profile' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    Actualizar Mi Perfil Profesional en el Directorio
                  </h3>
                  <p className={styles.cardDesc}>
                    Estos datos son públicos en el directorio de asesores e
                    impulsan las recomendaciones para nuevos inversionistas.
                  </p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Especialidad Bursátil
                  </label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={profSpecialty}
                    onChange={(e) => setProfSpecialty(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Años de Experiencia (0–60)
                  </label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={profYears}
                    onChange={(e) => setProfYears(Number(e.target.value))}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Certificaciones (separadas por coma)
                  </label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={profCerts}
                    onChange={(e) => setProfCerts(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    Descripción / Biografía Profesional
                  </label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={profDesc}
                    onChange={(e) => setProfDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.btnRow}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleSaveBrokerProfile}
                >
                  Guardar Perfil de Comisionista
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
