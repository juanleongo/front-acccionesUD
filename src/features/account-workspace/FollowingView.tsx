'use client';

import { useState } from 'react';
import { AssetLogo } from '@/components/market/AssetLogo';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type {
  CommandHandler,
  InstrumentSummary,
  NoticeSummary,
  PriceAlertSummary,
  WatchlistSummary,
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

export function FollowingView({
  lists,
  alerts,
  notices,
  catalog,
  onCommand,
}: {
  lists: readonly WatchlistSummary[];
  alerts: readonly PriceAlertSummary[];
  notices: readonly NoticeSummary[];
  catalog: readonly InstrumentSummary[];
  onCommand: CommandHandler;
}) {
  const { tx } = useLocale();
  const [tab, setTab] = useState<'lists' | 'alerts' | 'notices'>('lists');
  const [selected, setSelected] = useState('');
  const [dialog, setDialog] = useState<'list' | 'instrument' | 'alert' | null>(
    null,
  );
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [comparator, setComparator] =
    useState<PriceAlertSummary['comparator']>('above');
  const [threshold, setThreshold] = useState('');
  const [error, setError] = useState('');
  const list = lists.find((item) => item.id === selected) ?? lists[0];
  const open = (next: typeof dialog) => {
    setError('');
    setDialog(next);
  };
  const close = () => setDialog(null);
  const conditionLabel = (value: PriceAlertSummary['comparator']) =>
    ({
      above: tx('Alcance o supere', 'Reaches or exceeds'),
      below: tx('Alcance o baje de', 'Reaches or falls below'),
      crosses: tx('Cruce', 'Crosses'),
    })[value];
  return (
    <div className={styles.stack}>
      <nav
        className={styles.nav}
        aria-label={tx('Secciones de seguimiento', 'Following sections')}
      >
        <button
          type="button"
          aria-pressed={tab === 'lists'}
          onClick={() => setTab('lists')}
        >
          <Icon name="star" />
          {tx('Mis listas', 'My watchlists')}
        </button>
        <button
          type="button"
          aria-pressed={tab === 'alerts'}
          onClick={() => setTab('alerts')}
        >
          <Icon name="trend" />
          {tx('Alertas de precio', 'Price alerts')}
        </button>
        <button
          type="button"
          aria-pressed={tab === 'notices'}
          onClick={() => setTab('notices')}
        >
          <Icon name="file" />
          {tx('Notificaciones', 'Notifications')}
        </button>
      </nav>
      {tab === 'lists' && (
        <div className={styles.columns}>
          <Panel
            title={tx(
              'Tu selección, en un solo lugar',
              'Your selection, all together',
            )}
            hint={tx(
              'Organiza las acciones que quieres seguir. Agregarlas a una lista no crea una orden.',
              'Organize the stocks you follow. Adding a stock does not create an order.',
            )}
            action={
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => open('list')}
                disabled={lists.length >= 20}
              >
                <Icon name="star" size={17} />
                {tx('Crear lista', 'Create watchlist')}
              </button>
            }
          >
            {list ? (
              <div className={styles.stack}>
                <div className={styles.formGrid}>
                  <Field label={tx('Lista de seguimiento', 'Watchlist')}>
                    <CustomSelect
                      value={list.id}
                      onChange={setSelected}
                      options={lists.map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))}
                      ariaLabel={tx('Lista de seguimiento', 'Watchlist')}
                    />
                  </Field>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => open('instrument')}
                      disabled={list.instruments.length >= 50}
                    >
                      {tx('Añadir acción', 'Add stock')}
                    </button>
                    <Badge>
                      {list.instruments.length} {tx('acciones', 'stocks')}
                    </Badge>
                  </div>
                </div>
                {list.instruments.length ? (
                  <div>
                    {list.instruments.map((item) => (
                      <div className={styles.row} key={item.symbol}>
                        <div className={styles.identity}>
                          <AssetLogo
                            symbol={item.symbol}
                            exchange={item.exchange}
                          />
                          <div>
                            <strong>
                              {item.symbol} <Badge>{item.exchange}</Badge>
                            </strong>
                            <small>{item.name}</small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={tx(
                            `Quitar ${item.symbol} de la lista`,
                            `Remove ${item.symbol} from watchlist`,
                          )}
                          onClick={() =>
                            onCommand({
                              type: 'watchlist.remove',
                              listId: list.id,
                              symbol: item.symbol,
                            })
                          }
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={tx(
                      'Empieza con tu primera acción',
                      'Add your first stock',
                    )}
                    detail={tx(
                      'Añade instrumentos a esta lista para encontrarlos fácilmente.',
                      'Add instruments to this watchlist to find them easily.',
                    )}
                    icon="star"
                  />
                )}
              </div>
            ) : (
              <EmptyState
                title={tx(
                  'Crea tu primera lista',
                  'Create your first watchlist',
                )}
                detail={tx(
                  'Agrupa tus acciones favoritas según lo que quieras explorar.',
                  'Group your favorite stocks around what you want to explore.',
                )}
                icon="star"
              />
            )}
          </Panel>
          <Panel
            title={tx(
              'Sigue el mercado a tu manera',
              'Follow the market your way',
            )}
          >
            <ul className={styles.features}>
              <li>
                <Icon name="star" />
                {tx(
                  'Listas personalizadas para organizar tus intereses.',
                  'Personal watchlists to organize your interests.',
                )}
              </li>
              <li>
                <Icon name="trend" />
                {tx(
                  'Alertas para saber cuándo un precio alcanza tu objetivo.',
                  'Alerts when a price reaches your target.',
                )}
              </li>
              <li>
                <Icon name="info" />
                {tx(
                  'Las alertas informan; nunca compran ni venden por ti.',
                  'Alerts inform you; they never buy or sell for you.',
                )}
              </li>
            </ul>
            <p className={styles.muted}>
              {tx(
                'Las listas y alertas requieren Prémium y los permisos correspondientes. Puedes crear hasta 20 listas de 50 acciones cada una.',
                'Watchlists and alerts require Premium and the appropriate permissions. You can create up to 20 watchlists with 50 stocks each.',
              )}
            </p>
          </Panel>
        </div>
      )}
      {tab === 'alerts' && (
        <Panel
          title={tx('Tus objetivos de precio', 'Your price targets')}
          hint={tx(
            'Define una condición en USD. La alerta te avisa cuando se cumple.',
            'Set a condition in USD. The alert notifies you when it is met.',
          )}
          action={
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => open('alert')}
            >
              {tx('Crear alerta', 'Create alert')}
            </button>
          }
        >
          {alerts.length ? (
            alerts.map((alert) => (
              <div className={styles.row} key={alert.id}>
                <div className={styles.identity}>
                  <AssetLogo symbol={alert.symbol} />
                  <div>
                    <strong>{alert.symbol}</strong>
                    <small>
                      {conditionLabel(alert.comparator)}{' '}
                      <Amount value={alert.threshold} />
                    </small>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Badge
                    tone={
                      alert.status === 'active'
                        ? 'success'
                        : alert.status === 'triggered'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {alert.status === 'active'
                      ? tx('Activa', 'Active')
                      : alert.status === 'triggered'
                        ? tx('Objetivo alcanzado', 'Target reached')
                        : tx('Pausada', 'Paused')}
                  </Badge>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() =>
                      onCommand({
                        type:
                          alert.status === 'active'
                            ? 'alert.deactivate'
                            : 'alert.activate',
                        id: alert.id,
                      })
                    }
                  >
                    {alert.status === 'active'
                      ? tx('Pausar', 'Pause')
                      : tx('Reactivar', 'Reactivate')}
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={tx(
                      `Eliminar alerta de ${alert.symbol}`,
                      `Delete ${alert.symbol} alert`,
                    )}
                    onClick={() =>
                      onCommand({ type: 'alert.delete', id: alert.id })
                    }
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title={tx('Sin alertas todavía', 'No alerts yet')}
              detail={tx(
                'Crea una alerta para seguir un objetivo sin revisar el gráfico continuamente.',
                'Create an alert to follow a target without checking the chart constantly.',
              )}
              icon="trend"
            />
          )}
        </Panel>
      )}
      {tab === 'notices' && (
        <Panel
          title={tx('Tu actividad reciente', 'Your recent activity')}
          hint={tx(
            'Avisos de tu cuenta. Las fechas se muestran en hora de Colombia.',
            'Account notifications. Dates use Colombia time.',
          )}
        >
          {notices.length ? (
            notices.map((notice) => (
              <article className={styles.row} key={notice.id}>
                <div className={styles.identity}>
                  <span className={styles.iconTile}>
                    <Icon name="info" />
                  </span>
                  <div>
                    <strong>{notice.title}</strong>
                    <p className={styles.muted}>{notice.body}</p>
                    <small>
                      <Timestamp value={notice.createdAt} />
                    </small>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title={tx('Estás al día', 'You are all caught up')}
              detail={tx(
                'Cuando haya novedades de tu cuenta, las verás aquí.',
                'New account activity will appear here.',
              )}
              icon="check"
            />
          )}
        </Panel>
      )}
      {dialog && (
        <WorkspaceDialog
          title={
            dialog === 'list'
              ? tx('Nueva lista de seguimiento', 'New watchlist')
              : dialog === 'alert'
                ? tx('Nueva alerta de precio', 'New price alert')
                : tx('Añadir una acción', 'Add a stock')
          }
          hint={tx(
            'Revisa la información antes de continuar.',
            'Review the information before continuing.',
          )}
          onClose={close}
        >
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (dialog === 'list') {
                if (!name.trim() || name.trim().length > 100) {
                  setError(
                    tx(
                      'Escribe un nombre de 1 a 100 caracteres.',
                      'Enter a name of 1–100 characters.',
                    ),
                  );
                  return;
                }
                onCommand({ type: 'watchlist.create', name: name.trim() });
              } else {
                if (!symbol) {
                  setError(tx('Selecciona una acción.', 'Select a stock.'));
                  return;
                }
                if (dialog === 'alert') {
                  if (
                    !/^\d+(\.\d+)?$/.test(threshold) ||
                    Number(threshold) <= 0 ||
                    Number(threshold) > 999999999.99
                  ) {
                    setError(
                      tx(
                        'Indica un precio positivo de hasta 999.999.999,99 USD. Usa punto decimal.',
                        'Enter a positive price up to 999,999,999.99 USD. Use a decimal point.',
                      ),
                    );
                    return;
                  }
                  onCommand({
                    type: 'alert.create',
                    symbol,
                    comparator,
                    threshold,
                  });
                } else if (list)
                  onCommand({ type: 'watchlist.add', listId: list.id, symbol });
              }
              close();
            }}
          >
            {dialog === 'list' ? (
              <Field label={tx('Nombre de la lista', 'Watchlist name')}>
                <input
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            ) : (
              <Field label={tx('Acción', 'Stock')}>
                <CustomSelect
                  value={symbol}
                  onChange={setSymbol}
                  searchable
                  options={catalog.map((item) => ({
                    value: item.symbol,
                    label: `${item.symbol} · ${item.name}`,
                    disabled:
                      dialog === 'instrument' &&
                      !!list?.instruments.some((i) => i.symbol === item.symbol),
                  }))}
                  ariaLabel={tx('Acción', 'Stock')}
                />
              </Field>
            )}
            {dialog === 'alert' && (
              <>
                <Field
                  label={tx(
                    'Avisarme cuando el precio',
                    'Notify me when the price',
                  )}
                >
                  <CustomSelect
                    value={comparator}
                    onChange={(value) =>
                      setComparator(value as PriceAlertSummary['comparator'])
                    }
                    options={(['above', 'below', 'crosses'] as const).map(
                      (value) => ({ value, label: conditionLabel(value) }),
                    )}
                    ariaLabel={tx('Condición de precio', 'Price condition')}
                  />
                </Field>
                <Field
                  label={tx('Precio objetivo (USD)', 'Target price (USD)')}
                >
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                </Field>
              </>
            )}
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <button className={styles.primaryButton} type="submit">
                {tx('Continuar', 'Continue')}
              </button>
              <button type="button" className={styles.button} onClick={close}>
                {tx('Cancelar', 'Cancel')}
              </button>
            </div>
          </form>
        </WorkspaceDialog>
      )}
    </div>
  );
}
