'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type {
  CommandHandler,
  PaymentSummary,
  PlanSummary,
  SubscriptionSummary,
} from './types';
import {
  Amount,
  Badge,
  EmptyState,
  Field,
  Panel,
  Timestamp,
  WorkspaceDialog,
} from './WorkspaceUi';
import styles from './workspace.module.css';

export function SubscriptionView({
  plans,
  subscription,
  payments,
  hasNextPayment = false,
  hasPreviousPayment = false,
  onCommand,
}: {
  plans: readonly PlanSummary[];
  subscription: SubscriptionSummary | null;
  payments: readonly PaymentSummary[];
  hasNextPayment?: boolean;
  hasPreviousPayment?: boolean;
  onCommand: CommandHandler;
}) {
  const { tx } = useLocale();
  const [checkout, setCheckout] = useState<PlanSummary | null>(null);
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const labels: Record<SubscriptionSummary['status'], string> = {
    active: tx('Activa', 'Active'),
    trialing: tx('Período de prueba', 'Trial'),
    past_due: tx('Pago pendiente', 'Past due'),
    pending_checkout: tx('Pago por confirmar', 'Awaiting payment'),
    canceled: tx('Cancelada', 'Canceled'),
    incomplete: tx('Incompleta', 'Incomplete'),
    unpaid: tx('Sin pagar', 'Unpaid'),
    incomplete_expired: tx('Proceso vencido', 'Checkout expired'),
    paused: tx('Pausada', 'Paused'),
  };
  const canCheckout =
    !subscription ||
    !['active', 'trialing', 'past_due'].includes(subscription.status);
  const canCancel =
    !!subscription &&
    ['active', 'trialing', 'past_due'].includes(subscription.status) &&
    !subscription.cancelAtPeriodEnd;
  return (
    <div className={styles.stack}>
      <div className={styles.columns}>
        <Panel
          title={tx('Tu plan Prémium', 'Your Premium plan')}
          hint={tx(
            'Consulta el estado de tu suscripción y tus próximos pagos.',
            'Review your subscription status and upcoming payments.',
          )}
        >
          {subscription ? (
            <div className={styles.stack}>
              <div className={styles.actions}>
                <Badge
                  tone={
                    subscription.status === 'active' ? 'success' : 'warning'
                  }
                >
                  {labels[subscription.status]}
                </Badge>
                <strong>
                  {subscription.plan === 'monthly'
                    ? tx('Plan mensual', 'Monthly plan')
                    : tx('Plan anual', 'Annual plan')}
                </strong>
              </div>
              <p className={styles.muted}>
                {subscription.cancelAtPeriodEnd
                  ? tx(
                      'La renovación está cancelada. El acceso se conserva hasta el final del período.',
                      'Renewal is canceled. Access continues until the end of the period.',
                    )
                  : tx(
                      'El estado se confirma al procesar el pago. Volver de la página de pago no garantiza la activación.',
                      'Status is confirmed after payment is processed. Returning from checkout does not guarantee activation.',
                    )}
              </p>
              {subscription.periodEnd && (
                <p className={styles.muted}>
                  {tx('Fin del período', 'Period ends')}:{' '}
                  <Timestamp value={subscription.periodEnd} />
                </p>
              )}
              {subscription.nextChargeAt && !subscription.cancelAtPeriodEnd && (
                <p className={styles.muted}>
                  {tx('Próximo cobro', 'Next charge')}:{' '}
                  <Timestamp value={subscription.nextChargeAt} />
                </p>
              )}
              {canCancel && (
                <div>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => {
                      setError('');
                      setCancel(true);
                    }}
                  >
                    {tx('Cancelar renovación', 'Cancel renewal')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title={tx('Aún no tienes una suscripción', 'No subscription yet')}
              detail={tx(
                'Elige un plan para acceder a listas de seguimiento Prémium.',
                'Choose a plan to access Premium watchlists.',
              )}
              icon="star"
            />
          )}
        </Panel>
        <Panel
          title={tx(
            'Más espacio para seguir tus ideas',
            'More room to follow your ideas',
          )}
        >
          <ul className={styles.features}>
            <li>
              <Icon name="check" />
              {tx(
                'Listas de seguimiento personalizadas.',
                'Personalized watchlists.',
              )}
            </li>
            <li>
              <Icon name="lock" />
              {tx(
                'Los datos de tu tarjeta se introducen en la página de pago de Stripe.',
                'Card details are entered on the Stripe checkout page.',
              )}
            </li>
            <li>
              <Icon name="info" />
              {tx(
                'Las comisiones por operar se consultan por separado en cada orden.',
                'Trading commissions are shown separately for each order.',
              )}
            </li>
          </ul>
        </Panel>
      </div>
      <Panel
        title={tx('Elige tu período', 'Choose your billing period')}
        hint={tx(
          'Los precios y la disponibilidad deben confirmarse antes de ir al pago.',
          'Prices and availability must be confirmed before checkout.',
        )}
      >
        {plans.length ? (
          <div className={styles.plans}>
            {plans.map((plan) => (
              <article className={styles.plan} key={plan.code}>
                <div className={styles.panelHeader}>
                  <h3>
                    {plan.code === 'monthly'
                      ? tx('Mensual', 'Monthly')
                      : tx('Anual', 'Annual')}
                  </h3>
                  <Badge>{tx('Prémium', 'Premium')}</Badge>
                </div>
                <div>
                  <div className={styles.price}>
                    <Amount value={plan.price} currency={plan.currency} />
                  </div>
                  <p className={styles.muted}>
                    {plan.code === 'monthly'
                      ? tx('Por mes', 'Per month')
                      : tx('Por año', 'Per year')}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={!canCheckout}
                  onClick={() => setCheckout(plan)}
                >
                  {canCheckout
                    ? tx('Elegir este plan', 'Choose this plan')
                    : tx(
                        'Ya tienes una suscripción',
                        'You already have a subscription',
                      )}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={tx('No hay planes disponibles', 'No plans available')}
            detail={tx(
              'Vuelve más tarde para consultar los planes habilitados.',
              'Check again later for available plans.',
            )}
            icon="star"
          />
        )}
      </Panel>
      <Panel
        title={tx('Historial de pagos', 'Payment history')}
        hint={tx(
          'Cobros de la suscripción; no son depósitos ni compras de acciones. Hora de Colombia.',
          'Subscription charges, separate from deposits and stock purchases. Colombia time.',
        )}
      >
        {payments.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>
                {tx('Pagos de tu suscripción', 'Your subscription payments')}
              </caption>
              <thead>
                <tr>
                  {[
                    tx('Fecha', 'Date'),
                    tx('Plan', 'Plan'),
                    tx('Monto', 'Amount'),
                    tx('Resultado', 'Result'),
                    tx('Detalle', 'Details'),
                  ].map((s) => (
                    <th scope="col" key={s}>
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td data-label={tx('Fecha', 'Date')}>
                      <Timestamp value={p.occurredAt} />
                    </td>
                    <td data-label={tx('Plan', 'Plan')}>
                      {p.plan === 'monthly'
                        ? tx('Mensual', 'Monthly')
                        : tx('Anual', 'Annual')}
                    </td>
                    <td data-label={tx('Monto', 'Amount')}>
                      <Amount value={p.amount} currency={p.currency} />
                    </td>
                    <td data-label={tx('Resultado', 'Result')}>
                      <Badge tone={p.result === 'paid' ? 'success' : 'error'}>
                        {p.result === 'paid'
                          ? tx('Pagado', 'Paid')
                          : tx('No completado', 'Failed')}
                      </Badge>
                    </td>
                    <td data-label={tx('Detalle', 'Details')}>
                      <button
                        type="button"
                        className={styles.button}
                        onClick={() => setPayment(p)}
                      >
                        {tx('Ver detalle', 'View details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={tx('Sin pagos registrados', 'No payments recorded')}
            detail={tx(
              'Tus pagos aparecerán aquí cuando sean confirmados.',
              'Confirmed payments will appear here.',
            )}
            icon="file"
          />
        )}
        {payments.length > 0 && (
          <div className={styles.row}>
            <button
              type="button"
              className={styles.button}
              disabled={!hasPreviousPayment}
              onClick={() => onCommand({ type: 'payments.previous' })}
            >
              {tx('Anterior', 'Previous')}
            </button>
            <span className={styles.muted}>
              {tx('Pagos de la suscripción', 'Subscription payments')}
            </span>
            <button
              type="button"
              className={styles.button}
              disabled={!hasNextPayment}
              onClick={() => onCommand({ type: 'payments.next' })}
            >
              {tx('Siguiente', 'Next')}
            </button>
          </div>
        )}
      </Panel>
      {checkout && (
        <WorkspaceDialog
          title={tx('Continuar al pago', 'Continue to checkout')}
          hint={tx(
            'Se abrirá el proceso de pago de Stripe. La suscripción se activa cuando el pago queda confirmado.',
            'Stripe checkout will open. Your subscription activates once payment is confirmed.',
          )}
          onClose={() => setCheckout(null)}
        >
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              onCommand({ type: 'subscription.checkout', plan: checkout.code });
              setCheckout(null);
            }}
          >
            <div className={styles.metric}>
              <span>
                {checkout.code === 'monthly'
                  ? tx('Plan mensual', 'Monthly plan')
                  : tx('Plan anual', 'Annual plan')}
              </span>
              <strong>
                <Amount value={checkout.price} currency={checkout.currency} />
              </strong>
            </div>
            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                {tx('Continuar', 'Continue')}
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => setCheckout(null)}
              >
                {tx('Volver', 'Back')}
              </button>
            </div>
          </form>
        </WorkspaceDialog>
      )}
      {cancel && (
        <WorkspaceDialog
          title={tx(
            'Cancelar la próxima renovación',
            'Cancel the next renewal',
          )}
          hint={tx(
            'Podrás seguir usando el plan hasta el final de tu período actual.',
            'You can keep using your plan until the end of the current period.',
          )}
          onClose={() => setCancel(false)}
        >
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!reason.trim() || reason.trim().length > 500) {
                setError(
                  tx(
                    'Escribe el motivo, de 1 a 500 caracteres.',
                    'Enter a reason, 1–500 characters.',
                  ),
                );
                return;
              }
              onCommand({ type: 'subscription.cancel', reason: reason.trim() });
              setCancel(false);
            }}
          >
            <Field label={tx('Motivo de cancelación', 'Cancellation reason')}>
              <textarea
                className={styles.input}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <button type="submit" className={styles.dangerButton}>
                {tx('Confirmar cancelación', 'Confirm cancellation')}
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => setCancel(false)}
              >
                {tx('Conservar renovación', 'Keep renewal')}
              </button>
            </div>
          </form>
        </WorkspaceDialog>
      )}
      {payment && (
        <WorkspaceDialog
          title={tx('Detalle del pago', 'Payment details')}
          hint={tx(
            'Información del cobro de tu suscripción.',
            'Your subscription payment information.',
          )}
          onClose={() => setPayment(null)}
        >
          <div className={styles.stack}>
            <p className={styles.price}>
              <Amount value={payment.amount} currency={payment.currency} />
            </p>
            <Badge tone={payment.result === 'paid' ? 'success' : 'error'}>
              {payment.result === 'paid'
                ? tx('Pagado', 'Paid')
                : tx('No completado', 'Failed')}
            </Badge>
            <p className={styles.muted}>
              <Timestamp value={payment.occurredAt} />
            </p>
            <button
              type="button"
              className={styles.button}
              onClick={() => setPayment(null)}
            >
              {tx('Cerrar', 'Close')}
            </button>
          </div>
        </WorkspaceDialog>
      )}
    </div>
  );
}
