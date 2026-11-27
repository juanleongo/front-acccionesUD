'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLocale } from '@/lib/i18n';
import { toggleDocumentTheme } from '@/lib/theme';
import { FollowingView } from './FollowingView';
import { SecurityView } from './SecurityView';
import { PreferencesView } from './PreferencesView';
import { SubscriptionView } from './SubscriptionView';
import { CommissionsView } from './CommissionsView';
import { Badge, Field, ViewBoundary } from './WorkspaceUi';
import type { ViewState } from './types';
import * as example from './preview-data';
import styles from './workspace.module.css';

type Section =
  'following' | 'security' | 'preferences' | 'subscription' | 'commissions';
/** Review harness only. No user data, persistence, HTTP requests or fake mutation success. */
export function DesignPreview() {
  const { tx } = useLocale();
  const [section, setSection] = useState<Section>('following');
  const [state, setState] = useState<ViewState>('ready');
  const [audience, setAudience] = useState<'investor' | 'broker'>('investor');
  const [subscriptionState, setSubscriptionState] = useState<
    'none' | 'active' | 'pending' | 'canceling' | 'past_due'
  >('none');
  const [feedback, setFeedback] = useState(false);
  const sections: {
    id: Section;
    label: string;
    icon: IconName;
    hint: string;
  }[] = [
    {
      id: 'following',
      label: tx('Seguimiento', 'Following'),
      icon: 'star',
      hint: tx(
        'Organiza tus listas, objetivos de precio y avisos.',
        'Organize your watchlists, price targets and notifications.',
      ),
    },
    {
      id: 'security',
      label: tx('Seguridad', 'Security'),
      icon: 'shield',
      hint: tx(
        'Revisa tus accesos y las opciones para recuperar tu cuenta.',
        'Review account access and recovery options.',
      ),
    },
    {
      id: 'preferences',
      label: tx('Preferencias', 'Preferences'),
      icon: 'grid',
      hint: tx(
        'Personaliza tus avisos, tu portafolio y los controles de operación.',
        'Customize notifications, portfolio display and trading controls.',
      ),
    },
    {
      id: 'subscription',
      label: tx('Plan Prémium', 'Premium plan'),
      icon: 'wallet',
      hint: tx(
        'Elige un plan y consulta el estado de tu suscripción y sus pagos.',
        'Choose a plan and review your subscription and payments.',
      ),
    },
    {
      id: 'commissions',
      label: tx('Mis comisiones', 'My commissions'),
      icon: 'file',
      hint: tx(
        'Entiende las comisiones y su distribución en cada ejecución.',
        'Understand commissions and their distribution for each execution.',
      ),
    },
  ];
  const current = sections.find((item) => item.id === section)!;
  function previewCommand() {
    setFeedback(true);
  }
  const empty = state === 'empty';
  return (
    <div className={styles.workspace}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          Acciones UD
        </Link>
        <div className={styles.topActions}>
          <LanguageToggle />
          <button
            type="button"
            className={styles.button}
            onClick={() => toggleDocumentTheme()}
            aria-label={tx('Cambiar tema', 'Change theme')}
          >
            <Icon name="sun" size={17} />
            <span className={styles.controlLabel}>
              {tx('Cambiar tema', 'Change theme')}
            </span>
          </button>
          <Link
            className={styles.button}
            href="/"
            aria-label={tx('Volver al inicio', 'Back to home')}
          >
            <Icon name="grid" size={17} />
            <span className={styles.controlLabel}>
              {tx('Volver al inicio', 'Back to home')}
            </span>
          </Link>
        </div>
      </header>
      <main className={styles.main}>
        <aside
          className={styles.previewBanner}
          aria-label={tx(
            'Información de la vista previa',
            'Preview information',
          )}
        >
          <Badge tone="warning">
            {tx('Vista previa de diseño', 'Design preview')}
          </Badge>
          <p>
            {tx(
              'Datos ilustrativos. Los botones permiten revisar el flujo; no modifican tu cuenta, no crean órdenes ni realizan cobros.',
              'Illustrative data. Buttons let you review the flow; they do not change your account, create orders or charge payments.',
            )}
          </p>
        </aside>
        <div className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>
              {tx('TU ESPACIO PERSONAL', 'YOUR PERSONAL WORKSPACE')}
            </span>
            <h1>{current.label}</h1>
            <p>{current.hint}</p>
          </div>
          <div className={styles.actions}>
            <Field label={tx('Estado de la vista', 'View state')}>
              <CustomSelect
                value={state}
                onChange={(value) => {
                  setState(value as ViewState);
                  setFeedback(false);
                }}
                options={[
                  {
                    value: 'ready',
                    label: tx('Con ejemplos', 'With examples'),
                  },
                  { value: 'empty', label: tx('Sin datos', 'No data') },
                  { value: 'loading', label: tx('Cargando', 'Loading') },
                  {
                    value: 'error',
                    label: tx('Error de consulta', 'Request error'),
                  },
                  {
                    value: 'restricted',
                    label: tx('Sin acceso', 'Access restricted'),
                  },
                ]}
                ariaLabel={tx('Estado de la vista', 'View state')}
              />
            </Field>
            {section === 'commissions' && (
              <Field label={tx('Vista del rol', 'Role view')}>
                <CustomSelect
                  value={audience}
                  onChange={(v) => setAudience(v as typeof audience)}
                  options={[
                    {
                      value: 'investor',
                      label: tx('Inversionista', 'Investor'),
                    },
                    { value: 'broker', label: tx('Comisionista', 'Broker') },
                  ]}
                  ariaLabel={tx('Vista del rol', 'Role view')}
                />
              </Field>
            )}
            {section === 'subscription' && (
              <Field label={tx('Estado de suscripción', 'Subscription state')}>
                <CustomSelect
                  value={subscriptionState}
                  onChange={(v) =>
                    setSubscriptionState(v as typeof subscriptionState)
                  }
                  options={[
                    { value: 'none', label: tx('Sin plan', 'No plan') },
                    { value: 'active', label: tx('Activa', 'Active') },
                    {
                      value: 'pending',
                      label: tx('Confirmando pago', 'Confirming payment'),
                    },
                    {
                      value: 'canceling',
                      label: tx('Renovación cancelada', 'Renewal canceled'),
                    },
                    {
                      value: 'past_due',
                      label: tx('Pago pendiente', 'Past due'),
                    },
                  ]}
                  ariaLabel={tx('Estado de suscripción', 'Subscription state')}
                />
              </Field>
            )}
          </div>
        </div>
        <nav
          className={styles.nav}
          aria-label={tx('Vistas por integrar', 'Views awaiting integration')}
        >
          {sections.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={section === item.id}
              onClick={() => {
                setSection(item.id);
                setFeedback(false);
              }}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <ViewBoundary state={state} onRetry={() => setFeedback(true)}>
          {section === 'following' && (
            <FollowingView
              key={state}
              lists={empty ? [] : example.lists}
              alerts={empty ? [] : example.alerts}
              notices={
                empty
                  ? []
                  : [
                      {
                        id: 'preview-notice',
                        title: tx(
                          'Tu lista está lista para explorar',
                          'Your watchlist is ready to explore',
                        ),
                        body: tx(
                          'Ejemplo de un aviso de actividad de tu cuenta.',
                          'Example of an account activity notice.',
                        ),
                        createdAt: '2026-11-27T14:30:00Z',
                      },
                    ]
              }
              catalog={example.catalog}
              onCommand={previewCommand}
            />
          )}
          {section === 'security' && (
            <SecurityView
              key={state}
              sessions={empty ? [] : example.sessions}
              onCommand={previewCommand}
            />
          )}
          {section === 'preferences' && (
            <PreferencesView
              key={state}
              channels={empty ? [] : example.channels}
              orders={example.orders}
              portfolio={example.portfolio}
              telegramChatId={empty ? null : '123456789'}
              hasPhone={!empty}
              onCommand={previewCommand}
            />
          )}
          {section === 'subscription' && (
            <SubscriptionView
              plans={empty ? [] : example.plans}
              subscription={
                empty || subscriptionState === 'none'
                  ? null
                  : {
                      ...example.subscription,
                      status:
                        subscriptionState === 'pending'
                          ? 'pending_checkout'
                          : subscriptionState === 'past_due'
                            ? 'past_due'
                            : 'active',
                      cancelAtPeriodEnd: subscriptionState === 'canceling',
                      nextChargeAt:
                        subscriptionState === 'pending' ||
                        subscriptionState === 'canceling'
                          ? null
                          : example.subscription.nextChargeAt,
                      periodEnd:
                        subscriptionState === 'pending'
                          ? null
                          : example.subscription.periodEnd,
                    }
              }
              payments={
                empty || subscriptionState === 'none' ? [] : example.payments
              }
              onCommand={previewCommand}
            />
          )}
          {section === 'commissions' && (
            <CommissionsView
              key={`${audience}-${state}`}
              audience={audience}
              entries={empty ? [] : example.commissions}
              totals={
                empty
                  ? null
                  : {
                      commission: '2.00',
                      platformShare: '1.20',
                      brokerShare: '0.80',
                      complete: false,
                    }
              }
              initialFilters={{
                from: '2026-11-01',
                to: '2026-11-27',
                symbol: '',
                investorId: '',
              }}
              investors={[
                { id: 'preview-investor-1', name: 'María Fernanda Vélez' },
                { id: 'preview-investor-2', name: 'Daniel Sanabria' },
              ]}
              hasNext={!empty}
              hasPrevious={false}
              onCommand={previewCommand}
            />
          )}
        </ViewBoundary>
        {feedback && (
          <div className={styles.feedback} role="status">
            <span>
              {tx(
                'Vista previa: aquí se conectará la solicitud. No se ha guardado ningún cambio ni realizado ningún cobro.',
                'Preview: the request will be connected here. No changes were saved and no payment was made.',
              )}
            </span>
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => setFeedback(false)}
              aria-label={tx('Cerrar aviso', 'Dismiss notice')}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
