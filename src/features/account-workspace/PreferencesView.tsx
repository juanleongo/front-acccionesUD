'use client';

import { useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import {
  notificationEvents,
  type Channel,
  type ChannelPreference,
  type CommandHandler,
  type NotificationEvent,
  type OrderPreferences,
  type PortfolioPreferences,
} from './types';
import { Field, Panel } from './WorkspaceUi';
import styles from './workspace.module.css';

const eventLabels: Record<NotificationEvent, readonly [string, string]> = {
  market_open: ['Apertura del mercado', 'Market opening'],
  market_close: ['Cierre del mercado', 'Market closing'],
  proposals: ['Propuestas', 'Proposals'],
  approval_requests: ['Solicitudes de aprobación', 'Approval requests'],
  price_changes: ['Cambios de precio', 'Price changes'],
  execution_confirmations: [
    'Confirmaciones de ejecución',
    'Execution confirmations',
  ],
  daily_summary: ['Resumen diario', 'Daily summary'],
  balance_changes: ['Cambios de saldo', 'Balance changes'],
  order_executions: ['Ejecuciones de órdenes', 'Order executions'],
  order_updates: ['Actualizaciones de órdenes', 'Order updates'],
  broker_link_updates: ['Vínculos con comisionistas', 'Broker links'],
  proposal_updates: ['Actualizaciones de propuestas', 'Proposal updates'],
  market_schedule_changes: [
    'Cambios en horarios bursátiles',
    'Market schedule changes',
  ],
};
export function PreferencesView({
  channels,
  orders,
  portfolio,
  telegramChatId,
  hasPhone,
  onCommand,
}: {
  channels: readonly ChannelPreference[];
  orders: OrderPreferences;
  portfolio: PortfolioPreferences;
  telegramChatId: string | null;
  hasPhone: boolean;
  onCommand: CommandHandler;
}) {
  const { tx } = useLocale();
  const [event, setEvent] = useState<NotificationEvent>('price_changes');
  const [preferences, setPreferences] = useState<ChannelPreference[]>(() =>
    notificationEvents.flatMap((event_type) =>
      (['in_app', 'email', 'sms', 'telegram'] as const).map((channel) => ({
        event_type,
        channel,
        enabled:
          channel === 'in_app' ||
          (channels.find(
            (p) => p.event_type === event_type && p.channel === channel,
          )?.enabled ??
            false),
      })),
    ),
  );
  const [orderValues, setOrders] = useState(orders);
  const [portfolioValues, setPortfolio] = useState(portfolio);
  const [chatId, setChatId] = useState(telegramChatId ?? '');
  const [orderError, setOrderError] = useState('');
  const [portfolioError, setPortfolioError] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const labels: Record<Channel, string> = {
    in_app: tx('En la aplicación', 'In app'),
    email: tx('Correo', 'Email'),
    sms: 'SMS',
    telegram: 'Telegram',
  };
  function toggle(channel: Channel, enabled: boolean) {
    setPreferences((current) => [
      ...current.filter((p) => p.event_type !== event || p.channel !== channel),
      { event_type: event, channel, enabled },
    ]);
  }
  const validMoney = (value: string, allowZero = false) =>
    /^\d+(\.\d{1,2})?$/.test(value) &&
    Number(value) <= 999999999.99 &&
    (allowZero ? Number(value) >= 0 : Number(value) > 0);
  return (
    <div className={styles.stack}>
      <div className={styles.columns}>
        <Panel
          title={tx('Elige qué quieres recibir', 'Choose what you receive')}
          hint={tx(
            'Configura los canales para cada tipo de aviso. Tus cambios se aplican al guardar.',
            'Choose channels for each notification type. Changes apply when you save.',
          )}
        >
          <form
            noValidate
            className={styles.stack}
            onSubmit={(e) => {
              e.preventDefault();
              onCommand({ type: 'preferences.channels', preferences });
            }}
          >
            <Field label={tx('Tipo de aviso', 'Notification type')}>
              <CustomSelect
                value={event}
                onChange={(value) => setEvent(value as NotificationEvent)}
                options={notificationEvents.map((value) => ({
                  value,
                  label: tx(...eventLabels[value]),
                }))}
                ariaLabel={tx('Tipo de aviso', 'Notification type')}
              />
            </Field>
            <div className={styles.channelGrid}>
              {(['in_app', 'email', 'sms', 'telegram'] as const).map(
                (channel) => (
                  <label className={styles.channel} key={channel}>
                    <input
                      type="checkbox"
                      checked={
                        channel === 'in_app' ||
                        (preferences.find(
                          (p) =>
                            p.event_type === event && p.channel === channel,
                        )?.enabled ??
                          false)
                      }
                      disabled={
                        channel === 'in_app' ||
                        (channel === 'sms' && !hasPhone) ||
                        (channel === 'telegram' && !telegramChatId)
                      }
                      onChange={(e) => toggle(channel, e.target.checked)}
                    />
                    {labels[channel]}
                  </label>
                ),
              )}
            </div>
            <p className={styles.muted}>
              {tx(
                'Los avisos en la aplicación siempre están activos. SMS requiere teléfono y Telegram requiere un chat conectado.',
                'In-app notifications stay enabled. SMS requires a phone and Telegram requires a connected chat.',
              )}
            </p>
            <div>
              <button type="submit" className={styles.primaryButton}>
                {tx('Guardar avisos', 'Save notifications')}
              </button>
            </div>
          </form>
        </Panel>
        <Panel
          title={tx('Conectar Telegram', 'Connect Telegram')}
          hint={tx(
            'El identificador del chat es diferente de tu nombre de usuario. Usa el identificador del chat que recibirá los avisos.',
            'A chat ID is different from your username. Use the ID of the chat that will receive notifications.',
          )}
        >
          <form
            noValidate
            className={styles.stack}
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatId.trim() || chatId.trim().length > 100) {
                setTelegramError(
                  tx(
                    'Escribe un identificador de chat de hasta 100 caracteres.',
                    'Enter a chat ID of up to 100 characters.',
                  ),
                );
                return;
              }
              setTelegramError('');
              onCommand({
                type: 'preferences.telegram',
                chatId: chatId.trim(),
              });
            }}
          >
            <Field label={tx('Identificador del chat', 'Chat ID')}>
              <input
                className={styles.input}
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                autoComplete="off"
              />
            </Field>
            {telegramError && (
              <p className={styles.error} role="alert">
                {telegramError}
              </p>
            )}
            <div className={styles.actions}>
              <button type="submit" className={styles.button}>
                {tx('Guardar conexión', 'Save connection')}
              </button>
              <button
                type="button"
                className={styles.button}
                disabled={!telegramChatId}
                onClick={() =>
                  onCommand({ type: 'preferences.telegram', chatId: null })
                }
              >
                {tx('Desconectar', 'Disconnect')}
              </button>
            </div>
          </form>
        </Panel>
      </div>
      <div className={styles.plans}>
        <Panel
          title={tx('Tu portafolio, a tu gusto', 'Your portfolio, your way')}
          hint={tx(
            'Define cómo prefieres ver tus posiciones al abrir el portafolio.',
            'Choose how your positions appear when you open your portfolio.',
          )}
        >
          <form
            noValidate
            className={styles.stack}
            onSubmit={(e) => {
              e.preventDefault();
              if (!validMoney(portfolioValues.hide_threshold, true)) {
                setPortfolioError(
                  tx(
                    'Indica un mínimo entre 0 y 999.999.999,99 USD, con hasta 2 decimales.',
                    'Enter a minimum between 0 and 999,999,999.99 USD, with up to 2 decimals.',
                  ),
                );
                return;
              }
              setPortfolioError('');
              onCommand({
                type: 'preferences.portfolio',
                values: portfolioValues,
              });
            }}
          >
            <div className={styles.formGrid}>
              <Field label={tx('Vista predeterminada', 'Default view')}>
                <CustomSelect
                  value={portfolioValues.view_type}
                  onChange={(v) =>
                    setPortfolio({
                      ...portfolioValues,
                      view_type: v as PortfolioPreferences['view_type'],
                    })
                  }
                  options={[
                    { value: 'table', label: tx('Tabla', 'Table') },
                    { value: 'cards', label: tx('Tarjetas', 'Cards') },
                    { value: 'chart', label: tx('Gráfico', 'Chart') },
                  ]}
                  ariaLabel={tx('Vista predeterminada', 'Default view')}
                />
              </Field>
              <Field label={tx('Ordenar por', 'Sort by')}>
                <CustomSelect
                  value={portfolioValues.sort_by}
                  onChange={(v) =>
                    setPortfolio({
                      ...portfolioValues,
                      sort_by: v as PortfolioPreferences['sort_by'],
                    })
                  }
                  options={[
                    { value: 'symbol', label: tx('Símbolo', 'Symbol') },
                    {
                      value: 'market_value',
                      label: tx('Valor de mercado', 'Market value'),
                    },
                    {
                      value: 'gain_loss',
                      label: tx('Ganancia / pérdida', 'Gain / loss'),
                    },
                    {
                      value: 'allocation',
                      label: tx('Participación', 'Allocation'),
                    },
                  ]}
                  ariaLabel={tx('Ordenar por', 'Sort by')}
                />
              </Field>
              <Field label={tx('Dirección', 'Direction')}>
                <CustomSelect
                  value={portfolioValues.sort_direction}
                  onChange={(v) =>
                    setPortfolio({
                      ...portfolioValues,
                      sort_direction:
                        v as PortfolioPreferences['sort_direction'],
                    })
                  }
                  options={[
                    { value: 'desc', label: tx('Descendente', 'Descending') },
                    { value: 'asc', label: tx('Ascendente', 'Ascending') },
                  ]}
                  ariaLabel={tx('Dirección', 'Direction')}
                />
              </Field>
              <Field
                label={tx(
                  'Ocultar valores menores de (USD)',
                  'Hide values below (USD)',
                )}
                hint={tx(
                  '0 muestra todas las posiciones. Solo cambia la visualización.',
                  '0 shows all positions. This only changes the display.',
                )}
              >
                <input
                  className={styles.input}
                  inputMode="decimal"
                  value={portfolioValues.hide_threshold}
                  onChange={(e) =>
                    setPortfolio({
                      ...portfolioValues,
                      hide_threshold: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
            {portfolioError && (
              <p className={styles.error} role="alert">
                {portfolioError}
              </p>
            )}
            <div>
              <button type="submit" className={styles.primaryButton}>
                {tx('Guardar vista', 'Save view')}
              </button>
            </div>
          </form>
        </Panel>
        <Panel
          title={tx('Controles de tus órdenes', 'Your order controls')}
          hint={tx(
            'Prepara tus preferencias antes de operar. Cada orden se revisa en su vista previa.',
            'Set your preferences before trading. Review each order in its preview.',
          )}
        >
          <form
            noValidate
            className={styles.stack}
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !/^\d+$/.test(orderValues.daily_order_limit) ||
                Number(orderValues.daily_order_limit) < 1 ||
                Number(orderValues.daily_order_limit) > 1000 ||
                !validMoney(orderValues.high_order_threshold_usd)
              ) {
                setOrderError(
                  tx(
                    'El límite diario debe ser de 1 a 1.000 órdenes. El monto debe ser positivo, con hasta 2 decimales y máximo 999.999.999,99 USD.',
                    'The daily limit must be 1–1,000 orders. The amount must be positive, with up to 2 decimals and at most 999,999,999.99 USD.',
                  ),
                );
                return;
              }
              setOrderError('');
              onCommand({ type: 'preferences.orders', values: orderValues });
            }}
          >
            <div className={styles.formGrid}>
              <Field
                label={tx('Tipo de orden predeterminado', 'Default order type')}
              >
                <CustomSelect
                  value={orderValues.default_order_type}
                  onChange={(v) =>
                    setOrders({
                      ...orderValues,
                      default_order_type:
                        v as OrderPreferences['default_order_type'],
                    })
                  }
                  options={[
                    { value: 'market', label: tx('Mercado', 'Market') },
                    { value: 'limit', label: tx('Límite', 'Limit') },
                    { value: 'stop', label: 'Stop' },
                    { value: 'stop_limit', label: 'Stop limit' },
                    { value: 'trailing_stop', label: 'Trailing stop' },
                  ]}
                  ariaLabel={tx(
                    'Tipo de orden predeterminado',
                    'Default order type',
                  )}
                />
              </Field>
              <Field
                label={tx('Máximo de órdenes al día', 'Maximum daily orders')}
              >
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={orderValues.daily_order_limit}
                  onChange={(e) =>
                    setOrders({
                      ...orderValues,
                      daily_order_limit: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <Field
              label={tx(
                'Monto alto de una orden (USD)',
                'High order amount (USD)',
              )}
            >
              <input
                className={styles.input}
                inputMode="decimal"
                value={orderValues.high_order_threshold_usd}
                onChange={(e) =>
                  setOrders({
                    ...orderValues,
                    high_order_threshold_usd: e.target.value,
                  })
                }
              />
            </Field>
            <div className={styles.row}>
              <div>
                <strong>
                  {tx('Confirmación adicional', 'Extra confirmation')}
                </strong>
                <p className={styles.muted}>
                  {tx(
                    'Solicitar una confirmación adicional al operar.',
                    'Request an additional confirmation when trading.',
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label={tx('Confirmación adicional', 'Extra confirmation')}
                aria-checked={orderValues.extra_confirmation}
                className={styles.switch}
                onClick={() =>
                  setOrders({
                    ...orderValues,
                    extra_confirmation: !orderValues.extra_confirmation,
                  })
                }
              >
                <span />
              </button>
            </div>
            {orderError && (
              <p className={styles.error} role="alert">
                {orderError}
              </p>
            )}
            <div>
              <button type="submit" className={styles.primaryButton}>
                {tx('Guardar controles', 'Save controls')}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
