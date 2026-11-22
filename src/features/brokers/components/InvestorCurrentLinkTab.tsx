'use client';

import { useState, type FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { formatMarketDateTime } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { BrokerLinkRecord } from '../brokers-mock';
import { formatLinkStatus } from '../broker-labels';
import { BrokerAvatar } from './BrokerAvatar';
import styles from '../brokers.module.css';

export function InvestorCurrentLinkTab({
  activeLink,
  tradingAuthorized,
  onOpenDirectory,
  onOpenProposals,
  onToggleTradingAuth,
  onToggleOrderReview,
  onEndLink,
  onRateBroker,
}: {
  activeLink: BrokerLinkRecord | null;
  tradingAuthorized: boolean;
  onOpenDirectory: () => void;
  onOpenProposals: () => void;
  onToggleTradingAuth: () => void;
  onToggleOrderReview: () => void;
  onEndLink: () => void;
  onRateBroker: (stars: number, comment: string) => void;
}) {
  const { locale, tx } = useLocale();
  const [ratingStars, setRatingStars] = useState('5');
  const [ratingComment, setRatingComment] = useState('');
  const [ratingError, setRatingError] = useState('');

  function handleSubmitRating(event: FormEvent) {
    event.preventDefault();
    const numericStars = Number(ratingStars);
    if (
      !Number.isInteger(numericStars) ||
      numericStars < 1 ||
      numericStars > 5
    ) {
      setRatingError(
        tx(
          'Selecciona una puntuación válida entre 1 y 5 estrellas.',
          'Select a valid rating between 1 and 5 stars.',
        ),
      );
      return;
    }
    setRatingError('');
    onRateBroker(numericStars, ratingComment);
    setRatingComment('');
  }

  return (
    <div className={styles.card} role="tabpanel">
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h3 className={styles.cardTitle}>
            {tx(
              'Estado de Vinculación y Permisos de Operación',
              'Link Status & Trading Permissions',
            )}
          </h3>
          <p className={styles.cardDesc}>
            {tx(
              'Configura las autorizaciones de acompañamiento y supervisión de órdenes con tu asesor asignado.',
              'Configure advisory and order supervision authorizations with your assigned broker.',
            )}
          </p>
        </div>
        {activeLink && (
          <span className={styles.badgeSuccess}>
            {formatLinkStatus(activeLink.status, locale)}
          </span>
        )}
      </div>

      {activeLink ? (
        <>
          <div className={styles.advisorHero}>
            <div className={styles.advisorHeroTop}>
              <div className={styles.brokerHeader}>
                <BrokerAvatar
                  brokerId={activeLink.broker.id}
                  name={activeLink.broker.name}
                  size={62}
                  verified
                />
                <div className={styles.brokerIdentity}>
                  <div className={styles.brokerName}>
                    {activeLink.broker.name}
                  </div>
                  <div className={styles.brokerFirm}>
                    {activeLink.broker.firm_name}
                  </div>
                </div>
              </div>

              <div className={styles.btnRow}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={onOpenProposals}
                >
                  <Icon name="file" size={15} />
                  {tx('Ver Propuestas y Chat', 'View Proposals & Chat')}
                  <Icon name="arrow" size={15} />
                </button>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={onEndLink}
                >
                  {tx('Finalizar Vínculo', 'End Link')}
                </button>
              </div>
            </div>

            <div className={styles.advisorHeroMetaStrip}>
              <div className={styles.advisorMetaChip}>
                <span>{tx('Vínculo activo desde', 'Linked since')}</span>
                <strong>
                  {formatMarketDateTime(
                    activeLink.started_at ?? activeLink.requested_at,
                    locale,
                    { includeTime: false },
                  )}
                </strong>
              </div>
              <div className={styles.advisorMetaChip}>
                <span>{tx('Consentimiento', 'Consent version')}</span>
                <strong>{activeLink.consent_version.toUpperCase()}</strong>
              </div>
              <div className={styles.advisorMetaChip}>
                <span>{tx('Supervisión de órdenes', 'Order review')}</span>
                <strong>
                  {activeLink.order_review_enabled
                    ? tx('Habilitada', 'Enabled')
                    : tx('Desactivada', 'Disabled')}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.controlsGrid}>
            <div className={styles.controlBox}>
              <div className={styles.controlTop}>
                <div className={styles.controlHeadingGroup}>
                  <span className={styles.controlIconBadge} aria-hidden="true">
                    <Icon name="shield" size={16} />
                  </span>
                  <div className={styles.controlTitle}>
                    {tx(
                      'Autorización de Operación Delegada',
                      'Delegated Trading Authorization',
                    )}
                  </div>
                </div>
                <span
                  className={
                    tradingAuthorized
                      ? styles.badgeSuccess
                      : styles.badgeWarning
                  }
                >
                  {tradingAuthorized
                    ? tx('Autorizado', 'Authorized')
                    : tx('Revocado', 'Revoked')}
                </span>
              </div>
              <p className={styles.controlHint}>
                {tx(
                  'Permite que tu comisionista estructure propuestas y ejecute órdenes previamente aceptadas con tu código 2FA.',
                  'Allows your broker to structure investment proposals and execute orders you sign with your 2FA code.',
                )}
              </p>
              <div className={styles.btnRow}>
                <button
                  type="button"
                  className={
                    tradingAuthorized ? styles.secondaryBtn : styles.primaryBtn
                  }
                  onClick={onToggleTradingAuth}
                >
                  {tradingAuthorized
                    ? tx('Revocar Autorización', 'Revoke Authorization')
                    : tx('Autorizar Operación', 'Authorize Trading')}
                </button>
              </div>
            </div>

            <div className={styles.controlBox}>
              <div className={styles.controlTop}>
                <div className={styles.controlHeadingGroup}>
                  <span className={styles.controlIconBadge} aria-hidden="true">
                    <Icon name="check" size={16} />
                  </span>
                  <div className={styles.controlTitle}>
                    {tx(
                      'Revisión de Órdenes por el Comisionista',
                      'Broker Order Review',
                    )}
                  </div>
                </div>
                <span
                  className={
                    activeLink.order_review_enabled
                      ? styles.badgeSuccess
                      : styles.badgeWarning
                  }
                >
                  {activeLink.order_review_enabled
                    ? tx('Activa', 'Active')
                    : tx('Desactivada', 'Disabled')}
                </span>
              </div>
              <p className={styles.controlHint}>
                {tx(
                  'Cuando está activa, las órdenes de alto monto requieren visto bueno de tu comisionista antes de enviarse al mercado.',
                  'When active, high-amount orders require broker approval before routing to the market.',
                )}
              </p>
              <div className={styles.btnRow}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={onToggleOrderReview}
                >
                  {activeLink.order_review_enabled
                    ? tx('Desactivar Revisión', 'Disable Review')
                    : tx('Activar Revisión', 'Enable Review')}
                </button>
              </div>
            </div>
          </div>

          <form
            className={`${styles.controlBox} ${styles.ratingForm}`}
            onSubmit={handleSubmitRating}
            noValidate
          >
            <div className={styles.controlHeadingGroup}>
              <span className={styles.controlIconBadge} aria-hidden="true">
                <Icon name="star" size={16} />
              </span>
              <div className={styles.controlTitle}>
                {tx(
                  'Calificar Desempeño de tu Comisionista',
                  'Rate Your Broker Performance',
                )}
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label
                  htmlFor="broker-rating-stars"
                  className={styles.fieldLabel}
                >
                  {tx('Puntuación (1 a 5 estrellas)', 'Rating (1 to 5 stars)')}
                </label>
                <CustomSelect
                  id="broker-rating-stars"
                  value={ratingStars}
                  onChange={(next) => {
                    setRatingStars(next);
                    setRatingError('');
                  }}
                  options={[
                    {
                      value: '5',
                      label: tx(
                        '★★★★★ (5 - Excelente)',
                        '★★★★★ (5 - Excellent)',
                      ),
                    },
                    {
                      value: '4',
                      label: tx(
                        '★★★★☆ (4 - Muy Bueno)',
                        '★★★★☆ (4 - Very Good)',
                      ),
                    },
                    {
                      value: '3',
                      label: tx('★★★☆☆ (3 - Aceptable)', '★★★☆☆ (3 - Fair)'),
                    },
                    {
                      value: '2',
                      label: tx('★★☆☆☆ (2 - Regular)', '★★☆☆☆ (2 - Poor)'),
                    },
                    {
                      value: '1',
                      label: tx(
                        '★☆☆☆☆ (1 - Deficiente)',
                        '★☆☆☆☆ (1 - Unsatisfactory)',
                      ),
                    },
                  ]}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label
                  htmlFor="broker-rating-comment"
                  className={styles.fieldLabel}
                >
                  {tx('Reseña de Acompañamiento', 'Advisory Review')}
                </label>
                <input
                  id="broker-rating-comment"
                  type="text"
                  className={styles.inputField}
                  placeholder={tx(
                    'Escribe tu comentario sobre la asesoría recibida...',
                    'Share feedback on your advisory experience...',
                  )}
                  value={ratingComment}
                  onChange={(e) => {
                    setRatingComment(e.target.value);
                    setRatingError('');
                  }}
                />
              </div>
            </div>
            {ratingError && (
              <p role="alert" className={styles.formError}>
                {ratingError}
              </p>
            )}
            <div className={styles.btnRow}>
              <button type="submit" className={styles.primaryBtn}>
                <Icon name="star" size={15} />
                {tx('Enviar Calificación', 'Submit Rating')}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className={styles.emptyNotice}>
          <div className={styles.controlTitle}>
            {tx(
              'No tienes un comisionista vinculado actualmente',
              'You do not currently have a linked broker',
            )}
          </div>
          <p className={styles.controlHint}>
            {tx(
              'Explora el directorio oficial de comisionistas verificados para solicitar acompañamiento en Wall Street.',
              'Browse the official verified broker directory to request Wall Street investment advisory.',
            )}
          </p>
          <div className={styles.btnRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={onOpenDirectory}
            >
              {tx(
                'Explorar Directorio de Comisionistas',
                'Browse Broker Directory',
              )}
              <Icon name="arrow" size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
