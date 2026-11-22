'use client';

import { Icon } from '@/components/ui/Icon';
import { formatMarketDateTime } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { BrokerClientItem, BrokerPendingRequest } from '../brokers-mock';
import { BrokerAvatar } from './BrokerAvatar';
import styles from '../brokers.module.css';

export function BrokerPortalClientsTab({
  pendingRequests,
  brokerClients,
  onAcceptRequest,
  onDeclineRequest,
}: {
  pendingRequests: BrokerPendingRequest[];
  brokerClients: BrokerClientItem[];
  onAcceptRequest: (req: BrokerPendingRequest) => void;
  onDeclineRequest: (req: BrokerPendingRequest) => void;
}) {
  const { locale, tx } = useLocale();
  return (
    <div className={styles.card} role="tabpanel">
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h3 className={styles.cardTitle}>
            {tx(
              'Solicitudes de Vinculación Pendientes',
              'Pending Advisory Link Requests',
            )}
          </h3>
          <p className={styles.cardDesc}>
            {tx(
              'Acepta o declina nuevos clientes que han solicitado tu asesoría bursátil.',
              'Accept or decline new investors who requested your brokerage advisory.',
            )}
          </p>
        </div>
        <span className={styles.badgeWarning}>
          {pendingRequests.length} {tx('pendientes', 'pending')}
        </span>
      </div>

      {pendingRequests.length === 0 ? (
        <div className={styles.emptyNoticeCompact}>
          {tx(
            'No tienes solicitudes pendientes por responder en este momento.',
            'No pending client requests at this moment.',
          )}
        </div>
      ) : (
        <div className={styles.controlsGrid}>
          {pendingRequests.map((req) => (
            <div key={req.id} className={styles.controlBox}>
              <div className={styles.brokerHeader}>
                <BrokerAvatar
                  brokerId={req.investor_id}
                  name={req.investor_name}
                  size={44}
                />
                <div className={styles.brokerIdentity}>
                  <div className={styles.controlTitle}>{req.investor_name}</div>
                  <div className={styles.controlHint}>
                    {tx('Solicitado:', 'Requested:')}{' '}
                    {formatMarketDateTime(req.requested_at, locale)}
                  </div>
                </div>
              </div>
              <div className={styles.btnRow}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => onAcceptRequest(req)}
                >
                  {tx('✓ Aceptar Cliente', '✓ Accept Client')}
                </button>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={() => onDeclineRequest(req)}
                >
                  {tx('✕ Declinar', '✕ Decline')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`${styles.cardHeader} ${styles.sectionDivider}`}>
        <div className={styles.cardHeaderInfo}>
          <h3 className={styles.cardTitle}>
            {tx(
              'Cartera de Inversionistas Asignados',
              'Assigned Client Portfolio',
            )}
          </h3>
          <p className={styles.cardDesc}>
            {tx(
              'Clientes activos bajo tu acompañamiento y estado de sus permisos operativos.',
              'Active clients under your advisory and their operational permissions.',
            )}
          </p>
        </div>
        <span className={styles.badgeSuccess}>
          <Icon name="users" size={13} />
          {brokerClients.length} {tx('activos', 'active')}
        </span>
      </div>

      {brokerClients.length === 0 ? (
        <div className={styles.emptyNoticeCompact}>
          {tx(
            'Aún no tienes inversionistas vinculados a tu cartera.',
            'No linked investors in your client portfolio yet.',
          )}
        </div>
      ) : (
        <div className={styles.controlsGrid}>
          {brokerClients.map((cli) => (
            <div key={cli.investor_id} className={styles.controlBox}>
              <div className={styles.brokerHeader}>
                <BrokerAvatar
                  brokerId={cli.investor_id}
                  name={cli.name}
                  size={44}
                  verified={cli.trading_authorized}
                />
                <div className={styles.brokerIdentity}>
                  <div className={styles.controlTitle}>{cli.name}</div>
                  <div className={styles.controlHint}>
                    {tx('Cliente desde:', 'Client since:')}{' '}
                    {formatMarketDateTime(cli.since, locale, {
                      includeTime: false,
                    })}
                  </div>
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
                  {tx('Operación:', 'Trading:')}{' '}
                  {cli.trading_authorized
                    ? tx('Autorizada', 'Authorized')
                    : tx('Pendiente', 'Pending')}
                </span>
                <span
                  className={
                    cli.order_review_enabled
                      ? styles.badgeSuccess
                      : styles.badgeWarning
                  }
                >
                  {tx('Revisión Órdenes:', 'Order Review:')}{' '}
                  {cli.order_review_enabled ? tx('Activa', 'Active') : 'No'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
