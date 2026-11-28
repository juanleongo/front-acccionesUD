'use client';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useLocale } from '@/lib/i18n';
import { CustomSelect } from '@/components/ui/CustomSelect';
import * as api from './premium-api';
import styles from './premium.module.css';
export function PremiumTools({ userId }: { userId: string }) {
  const { tx } = useLocale();
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [listId, setListId] = useState('');
  const [symbol, setSymbol] = useState('');
  const [alertSymbol, setAlertSymbol] = useState('');
  const [comparator, setComparator] = useState('above');
  const [threshold, setThreshold] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [deleteId, setDeleteId] = useState('');
  const lists = useQuery({
    queryKey: ['premium', userId, 'watchlists'],
    queryFn: ({ signal }) =>
      api.premiumRequest(
        'watchlists',
        z.array(api.watchlistSchema),
        'GET',
        undefined,
        undefined,
        signal,
      ),
    retry: false,
  });
  const id = lists.data?.some((l) => l.id === listId)
    ? listId
    : (lists.data?.[0]?.id ?? '');
  const detail = useQuery({
    queryKey: ['premium', userId, 'watchlist', id],
    queryFn: ({ signal }) =>
      api.premiumRequest(
        `watchlists/${id}`,
        api.watchlistSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: Boolean(id),
    retry: false,
  });
  const alerts = useQuery({
    queryKey: ['premium', userId, 'alerts'],
    queryFn: ({ signal }) =>
      api.premiumRequest(
        'price-alerts',
        z.array(api.alertSchema),
        'GET',
        undefined,
        undefined,
        signal,
      ),
    retry: false,
  });
  async function run(work: () => Promise<unknown>) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
      await client.invalidateQueries({ queryKey: ['premium', userId] });
      setNotice(tx('Cambio guardado.', 'Change saved.'));
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : tx('No se pudo completar.', 'Could not complete.'),
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function checkedSymbol(raw: string) {
    const value = raw.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9./-]{0,19}$/.test(value)) {
      setError(
        tx(
          'Introduce un símbolo válido, por ejemplo AAPL o BRK.B.',
          'Enter a valid symbol, such as AAPL or BRK.B.',
        ),
      );
      return null;
    }
    return value;
  }
  return (
    <fieldset
      className={styles.fields}
      disabled={busy || lists.isPending || alerts.isPending}
    >
      <h3 className={styles.title}>
        {tx('Herramientas Premium', 'Premium tools')}
      </h3>
      {[lists, detail, alerts]
        .filter((q) => q.isError)
        .map((q, i) => (
          <div key={i} role="alert" className={styles.error}>
            {q.error?.message}
            <button className={styles.button} onClick={() => void q.refetch()}>
              {tx('Reintentar', 'Retry')}
            </button>
          </div>
        ))}
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
      <div className={styles.card}>
        <h4 className={styles.title}>
          {tx('Listas de seguimiento', 'Watchlists')}
        </h4>
        <form
          className={styles.row}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setError(
                tx('Escribe el nombre de la lista.', 'Enter a list name.'),
              );
              return;
            }
            void run(() =>
              api.premiumRequest('watchlists', api.watchlistSchema, 'POST', {
                name: name.trim(),
              }),
            ).then((ok) => {
              if (ok) setName('');
            });
          }}
        >
          <label className={styles.field}>
            {tx('Nombre de la lista', 'List name')}
            <input
              className={styles.input}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button className={styles.button}>
            {tx('Crear lista', 'Create list')}
          </button>
        </form>
        {lists.isPending && (
          <p className={styles.note}>
            {tx('Cargando listas…', 'Loading watchlists…')}
          </p>
        )}
        {lists.data?.length === 0 && (
          <p className={styles.note}>
            {tx('Crea tu primera lista.', 'Create your first watchlist.')}
          </p>
        )}
        {Boolean(lists.data?.length) && (
          <>
            <label htmlFor="premium-list" className={styles.field}>
              {tx('Selecciona una lista', 'Select a watchlist')}
            </label>
            <CustomSelect
              id="premium-list"
              value={id}
              onChange={setListId}
              options={lists.data!.map((l) => ({ value: l.id, label: l.name }))}
            />
            <form
              className={styles.row}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const value = checkedSymbol(symbol);
                if (value)
                  void run(() =>
                    api.premiumRequest(
                      `watchlists/${id}/items`,
                      api.watchlistSchema,
                      'POST',
                      { symbol: value },
                    ),
                  ).then((ok) => {
                    if (ok) setSymbol('');
                  });
              }}
            >
              <label className={styles.field}>
                {tx('Símbolo para seguir', 'Symbol to watch')}
                <input
                  className={styles.input}
                  maxLength={20}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                />
              </label>
              <button className={styles.button}>
                {tx('Agregar instrumento', 'Add instrument')}
              </button>
            </form>
            {detail.data?.symbols.map((value) => (
              <div className={styles.row} key={value}>
                <strong>{value}</strong>
                <button
                  className={styles.button}
                  onClick={() => {
                    void run(() =>
                      api.premiumRequest(
                        `watchlists/${id}/items/${value.split('/').map(encodeURIComponent).join('/')}`,
                        api.watchlistSchema,
                        'DELETE',
                      ),
                    );
                  }}
                >
                  {tx('Quitar', 'Remove')} {value}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
      <div className={styles.card}>
        <h4 className={styles.title}>
          {tx('Alertas de precio', 'Price alerts')}
        </h4>
        <form
          className={styles.grid}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const value = checkedSymbol(alertSymbol);
            if (!value) return;
            if (
              !/^\d+(\.\d+)?$/.test(threshold) ||
              Number(threshold) <= 0 ||
              Number(threshold) > 999999999.99 ||
              !Number.isFinite(Number(threshold))
            ) {
              setError(
                tx(
                  'El precio debe ser un número positivo.',
                  'Price must be a positive number.',
                ),
              );
              return;
            }
            void run(() =>
              api.premiumRequest('price-alerts', api.alertSchema, 'POST', {
                symbol: value,
                comparator,
                threshold,
              }),
            ).then((ok) => {
              if (ok) setThreshold('');
            });
          }}
        >
          <label className={styles.field}>
            {tx('Símbolo de la alerta', 'Alert symbol')}
            <input
              className={styles.input}
              maxLength={20}
              value={alertSymbol}
              onChange={(e) => setAlertSymbol(e.target.value)}
            />
          </label>
          <div className={styles.field}>
            <label htmlFor="premium-comparator">
              {tx('Condición', 'Condition')}
            </label>
            <CustomSelect
              id="premium-comparator"
              value={comparator}
              onChange={setComparator}
              options={[
                { value: 'above', label: tx('Por encima de', 'Above') },
                { value: 'below', label: tx('Por debajo de', 'Below') },
                {
                  value: 'crosses',
                  label: tx('Cruza el precio', 'Crosses price'),
                },
              ]}
            />
          </div>
          <label className={styles.field}>
            {tx('Precio objetivo (USD)', 'Target price (USD)')}
            <input
              className={styles.input}
              inputMode="decimal"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
          <button className={styles.button}>
            {tx('Crear alerta', 'Create alert')}
          </button>
        </form>
        {alerts.isPending && (
          <p className={styles.note}>
            {tx('Cargando alertas…', 'Loading alerts…')}
          </p>
        )}
        {alerts.data?.length === 0 && (
          <p className={styles.note}>
            {tx('No hay alertas registradas.', 'No alerts recorded.')}
          </p>
        )}
        {alerts.data?.map((alert) => (
          <article key={alert.id} className={styles.card}>
            <strong>
              {alert.symbol} ·{' '}
              {{
                above: tx('Por encima de', 'Above'),
                below: tx('Por debajo de', 'Below'),
                crosses: tx('Cruza', 'Crosses'),
              }[alert.comparator] ?? alert.comparator}{' '}
              {alert.threshold} USD
            </strong>
            <p className={styles.note}>
              {alert.status}{' '}
              {alert.triggered_at ? `· ${alert.triggered_at}` : ''}
            </p>
            <div className={styles.row}>
              <button
                className={styles.button}
                onClick={() => {
                  void run(() =>
                    api.premiumRequest(
                      `price-alerts/${alert.id}/${alert.status === 'active' ? 'deactivate' : 'activate'}`,
                      api.alertSchema,
                      'POST',
                    ),
                  );
                }}
              >
                {alert.status === 'active'
                  ? tx('Desactivar', 'Deactivate')
                  : tx('Activar', 'Activate')}
              </button>
              <button
                className={styles.button}
                onClick={() => setDeleteId(alert.id)}
              >
                {tx('Eliminar', 'Delete')}
              </button>
            </div>
            {deleteId === alert.id && (
              <div className={styles.row}>
                <p className={styles.note}>
                  {tx(
                    '¿Eliminar definitivamente esta alerta?',
                    'Permanently delete this alert?',
                  )}
                </p>
                <button
                  className={styles.button}
                  onClick={() => {
                    void run(() => api.deleteAlert(alert.id)).then((ok) => {
                      if (ok) setDeleteId('');
                    });
                  }}
                >
                  {tx('Confirmar eliminación', 'Confirm deletion')}
                </button>
                <button
                  className={styles.button}
                  onClick={() => setDeleteId('')}
                >
                  {tx('Volver', 'Back')}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </fieldset>
  );
}
