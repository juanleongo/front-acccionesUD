'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatMarketDateTime, formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { ProposalChatMessage, ProposalItem } from '../brokers-mock';
import { formatProposalStatus, getProposalStatusTone } from '../broker-labels';
import { BrokerAvatar } from './BrokerAvatar';
import styles from '../brokers.module.css';

function statusBadgeClass(status: string): string | undefined {
  const tone = getProposalStatusTone(status);
  if (tone === 'success') return styles.badgeSuccess;
  if (tone === 'error') return styles.badgeError;
  return styles.badgeWarning;
}

export function InvestorProposalsTab({
  proposals,
  selectedProposal,
  messages,
  onSelectProposal,
  onDecision,
  onSendMessage,
  onNavigateToOrder,
}: {
  proposals: ProposalItem[];
  selectedProposal: ProposalItem | null;
  messages: ProposalChatMessage[];
  onSelectProposal: (proposalId: string) => void;
  onDecision: (decision: 'accept' | 'reject', comment: string) => void;
  onSendMessage: (body: string) => void;
  onNavigateToOrder?: ((symbol: string) => void) | undefined;
}) {
  const { locale, tx } = useLocale();
  const [totpInput, setTotpInput] = useState('');
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');

  function handleDecisionClick(decision: 'accept' | 'reject') {
    if (decision === 'accept') {
      const cleaned = totpInput.trim();
      if (!/^\d{6}$/.test(cleaned)) {
        setDecisionError(
          tx(
            'Ingresa tu código de verificación 2FA de 6 dígitos para firmar la propuesta.',
            'Enter your 6-digit 2FA verification code to sign the proposal.',
          ),
        );
        return;
      }
    }
    setDecisionError('');
    onDecision(decision, decisionComment.trim());
    setTotpInput('');
    setDecisionComment('');
  }

  function handleChatSubmit(event: FormEvent) {
    event.preventDefault();
    const cleaned = chatInput.trim();
    if (!cleaned) {
      setChatError(
        tx(
          'Escribe un mensaje antes de enviarlo a tu comisionista.',
          'Write a message before sending it to your broker.',
        ),
      );
      return;
    }
    setChatError('');
    onSendMessage(cleaned);
    setChatInput('');
  }

  return (
    <div className={styles.card} role="tabpanel">
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h3 className={styles.cardTitle}>
            {tx(
              'Bandeja de Propuestas de Inversión y Mensajería',
              'Investment Proposals Inbox & Chat',
            )}
          </h3>
          <p className={styles.cardDesc}>
            {tx(
              'Revisa las recomendaciones enviadas por tu comisionista, conversa en el hilo de la propuesta y autoriza su ejecución con tu código 2FA.',
              'Review trade recommendations from your broker, chat inside the proposal thread, and authorize execution with 2FA.',
            )}
          </p>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className={styles.emptyNotice}>
          <div className={styles.controlTitle}>
            {tx(
              'No tienes propuestas de inversión registradas',
              'No investment proposals yet',
            )}
          </div>
          <p className={styles.controlHint}>
            {tx(
              'Cuando tu comisionista estructure una recomendación en NYSE o NASDAQ aparecerá aquí para tu revisión y firma 2FA.',
              'When your broker creates a recommendation for NYSE or NASDAQ, it will appear here for review and 2FA signature.',
            )}
          </p>
        </div>
      ) : (
        <div className={styles.proposalsLayout}>
          <div
            className={styles.proposalsList}
            role="list"
            aria-label={tx('Lista de propuestas', 'Proposals list')}
          >
            {proposals.map((prop) => {
              const isSelected = selectedProposal?.id === prop.id;
              return (
                <button
                  key={prop.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelectProposal(prop.id);
                    setDecisionError('');
                    setChatError('');
                  }}
                  className={`${styles.proposalCard} ${
                    isSelected ? styles.proposalCardActive : ''
                  }`}
                >
                  <div className={styles.proposalTopRow}>
                    <div className={styles.proposalTitleGroup}>
                      <span
                        className={
                          prop.side === 'buy' ? styles.sideBuy : styles.sideSell
                        }
                      >
                        {prop.side === 'buy'
                          ? tx('Compra', 'Buy')
                          : tx('Venta', 'Sell')}
                      </span>
                      <strong className={styles.proposalSymbol}>
                        {prop.qty} {prop.symbol}
                      </strong>
                      <span className={styles.certChip}>
                        {prop.type === 'limit'
                          ? tx('Límite', 'Limit')
                          : tx('Mercado', 'Market')}
                      </span>
                    </div>
                    <span className={statusBadgeClass(prop.status)}>
                      {formatProposalStatus(prop.status, locale)} · v
                      {prop.current_version}
                    </span>
                  </div>

                  <div className={styles.proposalMetaRow}>
                    <span>
                      {tx('Asesor:', 'Advisor:')} {prop.broker.name}
                    </span>
                    <strong>
                      {formatUsd(prop.estimated_cost, { withCode: true })}
                    </strong>
                  </div>

                  {prop.limit_price && (
                    <div className={styles.controlHint}>
                      {tx('Precio límite objetivo:', 'Target limit price:')}{' '}
                      <strong>
                        {formatUsd(prop.limit_price, { withCode: true })}
                      </strong>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedProposal && (
            <div className={styles.chatBox}>
              <div className={styles.proposalWorkspaceHeader}>
                <div className={styles.brokerHeader}>
                  <BrokerAvatar
                    brokerId={selectedProposal.broker.id}
                    name={selectedProposal.broker.name}
                    size={46}
                    verified
                  />
                  <div className={styles.brokerIdentity}>
                    <div className={styles.controlTitle}>
                      {selectedProposal.side === 'buy'
                        ? tx('Compra de', 'Buy')
                        : tx('Venta de', 'Sell')}{' '}
                      {selectedProposal.qty} {selectedProposal.symbol} (
                      {tx('Versión', 'Version')}{' '}
                      {selectedProposal.current_version})
                    </div>
                    <div className={styles.controlHint}>
                      {tx('Estructurada por', 'Structured by')}{' '}
                      {selectedProposal.broker.name}
                    </div>
                  </div>
                </div>

                <div className={styles.proposalHeaderBadges}>
                  <span className={statusBadgeClass(selectedProposal.status)}>
                    {formatProposalStatus(selectedProposal.status, locale)}
                  </span>
                  {onNavigateToOrder &&
                    (selectedProposal.status === 'accepted' ||
                      selectedProposal.status === 'approved') && (
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() =>
                          onNavigateToOrder(selectedProposal.symbol)
                        }
                      >
                        {tx('Operar en Terminal', 'Trade in Terminal')}
                        <Icon name="arrow" size={14} />
                      </button>
                    )}
                </div>
              </div>

              <div className={styles.proposalMetaGrid}>
                <div className={styles.statTile}>
                  <span>{tx('Modalidad', 'Order Type')}</span>
                  <strong>
                    {selectedProposal.type === 'limit'
                      ? tx('Orden Límite', 'Limit Order')
                      : tx('Orden de Mercado', 'Market Order')}
                  </strong>
                </div>
                <div className={styles.statTile}>
                  <span>{tx('Precio límite', 'Limit Price')}</span>
                  <strong>
                    {selectedProposal.limit_price
                      ? formatUsd(selectedProposal.limit_price, {
                          withCode: true,
                        })
                      : tx('A precio de mercado', 'Market price')}
                  </strong>
                </div>
                <div className={styles.statTile}>
                  <span>{tx('Monto estimado', 'Estimated Amount')}</span>
                  <strong>
                    {formatUsd(selectedProposal.estimated_cost, {
                      withCode: true,
                    })}
                  </strong>
                </div>
                <div className={styles.statTile}>
                  <span>{tx('Vigencia hasta', 'Expires')}</span>
                  <strong>
                    {formatMarketDateTime(selectedProposal.expires_at, locale, {
                      includeTime: false,
                    })}
                  </strong>
                </div>
              </div>

              {selectedProposal.status === 'sent' && (
                <div className={styles.decisionPanel}>
                  <div className={styles.decisionHeader}>
                    <span
                      className={styles.controlIconBadge}
                      aria-hidden="true"
                    >
                      <Icon name="lock" size={16} />
                    </span>
                    <div className={styles.controlTitle}>
                      {tx(
                        'Autorizar o Rechazar Propuesta (Confirmación 2FA)',
                        'Authorize or Reject Proposal (2FA Confirmation)',
                      )}
                    </div>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.fieldGroup}>
                      <label
                        htmlFor="proposal-totp-code"
                        className={styles.fieldLabel}
                      >
                        {tx('Código 2FA (6 dígitos)', '2FA Code (6 digits)')}
                      </label>
                      <input
                        id="proposal-totp-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        aria-invalid={Boolean(decisionError)}
                        className={`${styles.inputField} ${styles.totpInput}`}
                        placeholder={tx('Ej. 123456', 'E.g. 123456')}
                        value={totpInput}
                        onChange={(e) => {
                          setTotpInput(e.target.value);
                          setDecisionError('');
                        }}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label
                        htmlFor="proposal-decision-comment"
                        className={styles.fieldLabel}
                      >
                        {tx('Comentario para el asesor', 'Comment for advisor')}
                      </label>
                      <input
                        id="proposal-decision-comment"
                        type="text"
                        className={styles.inputField}
                        placeholder={tx(
                          'Autorizo ejecución en NASDAQ...',
                          'I authorize execution on NASDAQ...',
                        )}
                        value={decisionComment}
                        onChange={(e) => setDecisionComment(e.target.value)}
                      />
                    </div>
                  </div>
                  {decisionError && (
                    <p role="alert" className={styles.formError}>
                      {decisionError}
                    </p>
                  )}
                  <div className={styles.decisionActions}>
                    <span className={styles.fieldHint}>
                      {tx(
                        'La firma 2FA autoriza únicamente esta versión de la propuesta.',
                        'Your 2FA signature authorizes only this proposal version.',
                      )}
                    </span>
                    <div className={styles.btnRow}>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDecisionClick('reject')}
                      >
                        {tx('✕ Rechazar Propuesta', '✕ Reject Proposal')}
                      </button>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => handleDecisionClick('accept')}
                      >
                        {tx(
                          '✓ Aceptar y Firmar Propuesta',
                          '✓ Accept & Sign Proposal',
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.chatThreadSection}>
                <div className={styles.controlTitle}>
                  {tx('Conversación de la Propuesta', 'Proposal Conversation')}
                </div>
                <div className={styles.messagesList}>
                  {messages.length === 0 ? (
                    <div className={styles.emptyNoticeCompact}>
                      {tx(
                        'Aún no hay mensajes en esta propuesta. Escribe abajo para conversar con tu asesor.',
                        'No messages in this proposal yet. Write below to message your advisor.',
                      )}
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isBroker =
                        m.author_id === selectedProposal.broker.id;
                      return (
                        <div
                          key={m.id}
                          className={
                            isBroker
                              ? styles.messageBubble
                              : `${styles.messageBubble} ${styles.messageBubbleMine}`
                          }
                        >
                          <div className={styles.messageMeta}>
                            <span>
                              {isBroker
                                ? `${tx('Asesor', 'Advisor')} · ${selectedProposal.broker.name}`
                                : tx('Tú (Inversionista)', 'You (Investor)')}
                            </span>
                            <span>
                              {formatMarketDateTime(m.created_at, locale)}
                            </span>
                          </div>
                          <div className={styles.messageText}>{m.body}</div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleChatSubmit}
                  className={styles.chatComposerForm}
                  noValidate
                >
                  <input
                    type="text"
                    aria-label={tx(
                      'Escribe un mensaje a tu comisionista',
                      'Write a message to your broker',
                    )}
                    aria-invalid={Boolean(chatError)}
                    className={styles.chatInput}
                    placeholder={tx(
                      'Escribe un mensaje a tu comisionista sobre esta operación…',
                      'Message your broker about this proposal…',
                    )}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      setChatError('');
                    }}
                  />
                  <button type="submit" className={styles.primaryBtn}>
                    {tx('Enviar Mensaje', 'Send Message')}
                  </button>
                </form>
                {chatError && (
                  <p role="alert" className={styles.formError}>
                    {chatError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
