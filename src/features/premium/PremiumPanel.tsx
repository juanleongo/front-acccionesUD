'use client';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useLocale } from '@/lib/i18n';
import * as api from './premium-api';
import { PremiumTools } from './PremiumTools';
import styles from './premium.module.css';
const liveStatuses = ['active', 'trialing', 'past_due'];
export function PremiumPanel({
  returnStatus,
}: {
  returnStatus?: 'success' | 'cancel';
}) {
  const { tx, locale } = useLocale();
  const client = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    'monthly',
  );
  const [confirm, setConfirm] = useState<'checkout' | 'cancel' | null>(null);
  const [reason, setReason] = useState('');
  const [consent, setConsent] = useState(false);
  const [cursors, setCursors] = useState(['']);
  const [paymentId, setPaymentId] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const user = useQuery({
    queryKey: ['premium', 'entitlement'],
    queryFn: ({ signal }) =>
      api.premiumRequest(
        'users/me',
        api.entitlementSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    retry: false,
    refetchInterval: (query) =>
      returnStatus === 'success' &&
      !query.state.data?.is_premium &&
      query.state.dataUpdateCount < 12
        ? 5000
        : false,
  });
  const uid = user.data?.user_id;
  const investor = Boolean(user.data?.roles.includes('investor'));
  const plans = useQuery({
    queryKey: ['premium', uid, 'plans'],
    queryFn: ({ signal }) =>
      api.premiumRequest(
        'subscriptions/plans',
        z.array(api.planSchema),
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: investor,
    retry: false,
  });
  const current = useQuery({
    queryKey: ['premium', uid, 'current'],
    queryFn: ({ signal }) =>
      api.premiumRequest(
        'subscriptions/me',
        api.currentSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: investor,
    retry: false,
    refetchInterval: (query) =>
      returnStatus === 'success' &&
      query.state.dataUpdateCount < 12 &&
      !['active', 'trialing'].includes(
        query.state.data?.subscription?.status ?? '',
      )
        ? 5000
        : false,
  });
  const payments = useQuery({
    queryKey: ['premium', uid, 'payments', cursors.at(-1)],
    queryFn: ({ signal }) =>
      api.premiumRequest(
        'subscriptions/me/payments',
        api.paymentsSchema,
        'GET',
        undefined,
        {
          page_size: '10',
          ...(cursors.at(-1) ? { cursor: cursors.at(-1)! } : {}),
        },
        signal,
      ),
    enabled: investor,
    retry: false,
  });
  const detail = useQuery({
    queryKey: ['premium', uid, 'payment', paymentId],
    queryFn: ({ signal }) =>
      api.premiumRequest(
        `subscriptions/me/payments/${paymentId}`,
        api.paymentSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: investor && Boolean(paymentId),
    retry: false,
  });
  const subscription = current.data?.subscription;
  const active = liveStatuses.includes(subscription?.status ?? '');
  const planName = (code: string) =>
    code === 'monthly'
      ? tx('Mensual', 'Monthly')
      : code === 'annual'
        ? tx('Anual', 'Annual')
        : code;
  const date = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleString(locale) : '—';
  const statusName = (status: string) =>
    ({
      active: tx('Activa', 'Active'),
      trialing: tx('En prueba', 'Trialing'),
      past_due: tx('Pago pendiente', 'Past due'),
      pending_checkout: tx('Pago por completar', 'Checkout pending'),
      canceled: tx('Cancelada', 'Canceled'),
      unpaid: tx('Sin pagar', 'Unpaid'),
      incomplete: tx('Incompleta', 'Incomplete'),
      incomplete_expired: tx('Expirada', 'Expired'),
    })[status] ?? status;
  async function execute() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (confirm === 'checkout') {
        const result = await api.startCheckout(selectedPlan);
        setCheckoutUrl(result.url);
        setConfirm(null);
        window.location.assign(result.url);
      } else {
        await api.cancelSubscription(reason);
        setNotice(
          tx(
            'Cancelación programada al finalizar el período contratado.',
            'Cancellation scheduled for the end of the billing period.',
          ),
        );
        setConfirm(null);
        setReason('');
      }
      await client.invalidateQueries({ queryKey: ['premium'] });
      await client.invalidateQueries({ queryKey: ['users'] });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : tx(
              'No se pudo completar la operación.',
              'Could not complete the operation.',
            ),
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <section className={styles.container} aria-label="Premium">
      <div className={styles.card}>
        <div className={styles.row}>
          <h2 className={styles.title}>
            {tx('Mi cuenta Premium', 'My Premium account')}
          </h2>
          {user.data && (
            <span className={styles.badge}>
              {user.data.is_premium
                ? 'Premium'
                : tx('Cuenta estándar', 'Standard account')}
            </span>
          )}
        </div>
        <p className={styles.note}>
          {tx(
            'Gestiona tu suscripción, tus listas de seguimiento y alertas de precio. Los pagos se procesan en Stripe sandbox.',
            'Manage your subscription, watchlists and price alerts. Payments use Stripe sandbox.',
          )}
        </p>
        {returnStatus && (
          <p className={styles.note}>
            {returnStatus === 'success'
              ? tx(
                  'Has regresado de Stripe. El acceso premium solo se activa cuando el servidor confirma el pago.',
                  'You returned from Stripe. Premium access activates only after server confirmation.',
                )
              : tx(
                  'Saliste del proceso de pago. Consulta el estado antes de iniciar otro intento.',
                  'You left checkout. Check the status before starting another attempt.',
                )}
          </p>
        )}
        <button
          className={styles.button}
          onClick={() => {
            void client.invalidateQueries({ queryKey: ['premium'] });
            void client.invalidateQueries({ queryKey: ['users'] });
          }}
        >
          {tx('Actualizar estado', 'Refresh status')}
        </button>
      </div>
      {[user, plans, current, payments, detail]
        .filter((q) => q.isError)
        .map((q, i) => (
          <div key={i} role="alert" className={styles.error}>
            {q.error?.message}
            <button className={styles.button} onClick={() => void q.refetch()}>
              {tx('Reintentar', 'Retry')}
            </button>
          </div>
        ))}
      {user.isPending && (
        <p className={styles.note}>
          {tx('Consultando tu cuenta…', 'Loading your account…')}
        </p>
      )}
      {user.isSuccess && !investor && (
        <p className={styles.note}>
          {tx(
            'La contratación de planes requiere un perfil de inversionista.',
            'Subscription management requires an investor role.',
          )}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={styles.note}>
          {notice}
        </p>
      )}
      {investor && (
        <>
          <div className={styles.card}>
            <h3 className={styles.title}>
              {tx('Suscripción actual', 'Current subscription')}
            </h3>
            {current.isPending ? (
              <p className={styles.note}>{tx('Cargando…', 'Loading…')}</p>
            ) : subscription ? (
              <>
                <p className={styles.note}>
                  {planName(subscription.plan)} ·{' '}
                  {statusName(subscription.status)}
                </p>
                <p className={styles.note}>
                  {tx('Período contratado', 'Billing period')}:{' '}
                  {date(subscription.current_period_start)} —{' '}
                  {date(subscription.current_period_end)}
                </p>
                <p className={styles.note}>
                  {subscription.cancel_at_period_end
                    ? tx(
                        'Renovación cancelada. Fin del período:',
                        'Renewal canceled. Period ends:',
                      )
                    : tx('Próximo cobro:', 'Next charge:')}{' '}
                  {date(
                    subscription.cancel_at_period_end
                      ? subscription.current_period_end
                      : current.data?.next_charge_at,
                  )}
                </p>
                {active && !subscription.cancel_at_period_end && (
                  <button
                    className={styles.button}
                    disabled={busy}
                    onClick={() => {
                      setConfirm('cancel');
                      setConsent(false);
                    }}
                  >
                    {tx('Cancelar renovación', 'Cancel renewal')}
                  </button>
                )}
              </>
            ) : current.isSuccess ? (
              <p className={styles.note}>
                {tx(
                  'No tienes una suscripción contratada.',
                  'No subscription purchased yet.',
                )}
              </p>
            ) : null}
          </div>
          <div className={styles.grid}>
            {plans.data?.map((plan) => (
              <article key={plan.code} className={styles.card}>
                <h3 className={styles.title}>Premium {planName(plan.code)}</h3>
                <strong className={styles.price}>
                  {Number(plan.price).toLocaleString(locale)} {plan.currency}
                </strong>
                <p className={styles.note}>
                  {tx(
                    'Listas de seguimiento y alertas de precios.',
                    'Watchlists and price alerts.',
                  )}
                </p>
                <button
                  className={styles.button}
                  disabled={busy || !current.isSuccess || active}
                  onClick={() => {
                    setSelectedPlan(plan.code);
                    setConfirm('checkout');
                    setConsent(false);
                    setCheckoutUrl('');
                  }}
                >
                  {tx('Contratar plan', 'Subscribe')}
                </button>
              </article>
            ))}
          </div>
          {confirm && (
            <form
              className={styles.card}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!consent || (confirm === 'cancel' && !reason.trim()))
                  return;
                void execute();
              }}
            >
              <h3 className={styles.title}>
                {confirm === 'checkout'
                  ? tx('Confirmar contratación', 'Confirm subscription')
                  : tx('Confirmar cancelación', 'Confirm cancellation')}
              </h3>
              <p className={styles.note}>
                {confirm === 'checkout'
                  ? `${planName(selectedPlan)} · ${plans.data?.find((p) => p.code === selectedPlan)?.price} ${plans.data?.find((p) => p.code === selectedPlan)?.currency}. ${tx('Se renueva automáticamente hasta que canceles.', 'Renews automatically until canceled.')}`
                  : tx(
                      'La cancelación detiene la siguiente renovación; no termina anticipadamente el período actual.',
                      'Cancellation stops the next renewal; it does not end the current period early.',
                    )}
              </p>
              {confirm === 'cancel' && (
                <label className={styles.field}>
                  {tx('Motivo', 'Reason')}
                  <textarea
                    className={styles.input}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              )}
              <label className={styles.row}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                {tx(
                  'Confirmo que he leído las condiciones anteriores.',
                  'I confirm I have read the conditions above.',
                )}
              </label>
              <div className={styles.row}>
                <button
                  className={styles.button}
                  disabled={
                    busy || !consent || (confirm === 'cancel' && !reason.trim())
                  }
                >
                  {busy
                    ? tx('Procesando…', 'Processing…')
                    : tx('Confirmar', 'Confirm')}
                </button>
                <button
                  type="button"
                  className={styles.button}
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                >
                  {tx('Volver', 'Back')}
                </button>
              </div>
            </form>
          )}
          {checkoutUrl && (
            <a className={styles.button} href={checkoutUrl}>
              {tx('Continuar en Stripe', 'Continue to Stripe')}
            </a>
          )}
          <div className={styles.card}>
            <h3 className={styles.title}>
              {tx('Historial de pagos', 'Payment history')}
            </h3>
            {payments.isPending && (
              <p className={styles.note}>{tx('Cargando…', 'Loading…')}</p>
            )}
            {payments.data?.items.length === 0 && (
              <p className={styles.note}>
                {tx(
                  'Aún no hay pagos registrados.',
                  'No payments recorded yet.',
                )}
              </p>
            )}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {[
                      tx('Fecha', 'Date'),
                      tx('Plan', 'Plan'),
                      tx('Importe', 'Amount'),
                      tx('Resultado', 'Result'),
                      tx('Detalle', 'Details'),
                    ].map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.data?.items.map((p) => (
                    <tr key={p.id}>
                      <td>{date(p.occurred_at)}</td>
                      <td>{planName(p.plan)}</td>
                      <td>
                        {p.amount} {p.currency}
                      </td>
                      <td>
                        {p.result === 'paid'
                          ? tx('Pagado', 'Paid')
                          : tx('Fallido', 'Failed')}
                      </td>
                      <td>
                        <button
                          className={styles.button}
                          onClick={() => setPaymentId(p.id)}
                        >
                          {tx('Ver detalle', 'View details')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.row}>
              <button
                className={styles.button}
                disabled={cursors.length === 1 || payments.isFetching}
                onClick={() => {
                  setCursors((c) => c.slice(0, -1));
                  setPaymentId('');
                }}
              >
                {tx('Anterior', 'Previous')}
              </button>
              <span className={styles.note}>
                {tx('Página', 'Page')} {cursors.length}
              </span>
              <button
                className={styles.button}
                disabled={!payments.data?.next_cursor || payments.isFetching}
                onClick={() => {
                  setCursors((c) => [...c, payments.data!.next_cursor!]);
                  setPaymentId('');
                }}
              >
                {tx('Siguiente', 'Next')}
              </button>
            </div>
            {detail.data && (
              <div className={styles.card}>
                <h4 className={styles.title}>
                  {tx('Detalle del pago', 'Payment details')}
                </h4>
                <p className={styles.note}>
                  {detail.data.stripe_invoice_id} · {detail.data.amount}{' '}
                  {detail.data.currency} · {detail.data.result}
                </p>
                <p className={styles.note}>
                  {date(detail.data.period_start)} —{' '}
                  {date(detail.data.period_end)}
                </p>
              </div>
            )}
          </div>
        </>
      )}
      {user.data?.is_premium ? (
        <PremiumTools userId={user.data.user_id} />
      ) : (
        user.isSuccess && (
          <p className={styles.note}>
            {tx(
              'Las listas y alertas se habilitan al confirmar tu acceso premium.',
              'Watchlists and alerts become available after premium access is confirmed.',
            )}
          </p>
        )
      )}
    </section>
  );
}
