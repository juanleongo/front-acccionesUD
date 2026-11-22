'use client';

import { useState, type FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { BrokerClientItem } from '../brokers-mock';
import styles from '../brokers.module.css';

export interface BrokerProposalDraft {
  clientId: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: string;
  type: 'market' | 'limit';
  limitPrice: string;
}

export function BrokerPortalNewProposalTab({
  brokerClients,
  onCreateProposal,
}: {
  brokerClients: BrokerClientItem[];
  onCreateProposal: (draft: BrokerProposalDraft) => void;
}) {
  const { tx } = useLocale();
  const [clientId, setClientId] = useState(brokerClients[0]?.investor_id ?? '');
  const [symbol, setSymbol] = useState('NVDA');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState('10');
  const [type, setType] = useState<'market' | 'limit'>('limit');
  const [limitPrice, setLimitPrice] = useState('885.00');
  const [error, setError] = useState('');

  const effectiveClientId = clientId || brokerClients[0]?.investor_id || '';
  const estimatedNotional = (() => {
    const nQty = Number(qty);
    const nPrice = type === 'limit' ? Number(limitPrice) : 175;
    if (
      !Number.isFinite(nQty) ||
      nQty <= 0 ||
      !Number.isFinite(nPrice) ||
      nPrice <= 0
    ) {
      return null;
    }
    return nQty * nPrice * 1.02;
  })();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleanedSymbol = symbol.trim().toUpperCase();
    const numericQty = Number(qty);
    const numericPrice = Number(limitPrice);

    if (!effectiveClientId) {
      setError(
        tx(
          'Selecciona el cliente inversionista para emitir la propuesta.',
          'Select the investor client for this proposal.',
        ),
      );
      return;
    }
    if (!/^[A-Z]{1,10}(?:[.-][A-Z]{1,4})?$/.test(cleanedSymbol)) {
      setError(
        tx(
          'Ingresa un símbolo bursátil válido (ej. AAPL, NVDA, SPY).',
          'Enter a valid ticker symbol (e.g. AAPL, NVDA, SPY).',
        ),
      );
      return;
    }
    if (!Number.isFinite(numericQty) || numericQty <= 0) {
      setError(
        tx(
          'Ingresa una cantidad de acciones mayor a cero.',
          'Enter a share quantity greater than zero.',
        ),
      );
      return;
    }
    if (
      type === 'limit' &&
      (!Number.isFinite(numericPrice) || numericPrice <= 0)
    ) {
      setError(
        tx(
          'Ingresa un precio límite válido mayor a cero en USD.',
          'Enter a valid limit price greater than zero in USD.',
        ),
      );
      return;
    }
    setError('');
    onCreateProposal({
      clientId: effectiveClientId,
      symbol: cleanedSymbol,
      side,
      qty: qty.trim(),
      type,
      limitPrice: limitPrice.trim(),
    });
  }

  return (
    <form
      className={styles.card}
      onSubmit={handleSubmit}
      role="tabpanel"
      noValidate
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h3 className={styles.cardTitle}>
            {tx(
              'Estructurar y Enviar Nueva Propuesta a un Cliente',
              'Create & Send New Client Proposal',
            )}
          </h3>
          <p className={styles.cardDesc}>
            {tx(
              'La propuesta quedará disponible en la bandeja del inversionista para su revisión y firma con código 2FA.',
              'The proposal will appear in the investor inbox for review and 2FA signature.',
            )}
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prop-client" className={styles.fieldLabel}>
            {tx('Cliente Inversionista', 'Investor Client')}
          </label>
          <CustomSelect
            id="broker-prop-client"
            value={effectiveClientId}
            onChange={(val) => {
              setClientId(val);
              setError('');
            }}
            placeholder={tx('Selecciona un cliente', 'Select a client')}
            options={brokerClients.map((c) => ({
              value: c.investor_id,
              label: c.name,
            }))}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prop-symbol" className={styles.fieldLabel}>
            {tx('Símbolo (NYSE / NASDAQ)', 'Symbol (NYSE / NASDAQ)')}
          </label>
          <input
            id="broker-prop-symbol"
            type="text"
            className={styles.inputField}
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value.toUpperCase());
              setError('');
            }}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prop-side" className={styles.fieldLabel}>
            {tx('Tipo de Operación', 'Order Side')}
          </label>
          <CustomSelect
            id="broker-prop-side"
            value={side}
            onChange={(val) => setSide(val as 'buy' | 'sell')}
            options={[
              { value: 'buy', label: tx('Compra', 'Buy') },
              { value: 'sell', label: tx('Venta', 'Sell') },
            ]}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prop-qty" className={styles.fieldLabel}>
            {tx('Cantidad de Acciones', 'Share Quantity')}
          </label>
          <input
            id="broker-prop-qty"
            type="number"
            min="0.0001"
            step="any"
            className={styles.inputField}
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setError('');
            }}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="broker-prop-type" className={styles.fieldLabel}>
            {tx('Tipo de Orden', 'Order Type')}
          </label>
          <CustomSelect
            id="broker-prop-type"
            value={type}
            onChange={(val) => {
              setType(val as 'market' | 'limit');
              setError('');
            }}
            options={[
              {
                value: 'limit',
                label: tx('Orden Límite (Limit)', 'Limit Order'),
              },
              {
                value: 'market',
                label: tx('Orden de Mercado (Market)', 'Market Order'),
              },
            ]}
          />
        </div>

        {type === 'limit' && (
          <div className={styles.fieldGroup}>
            <label htmlFor="broker-prop-limit" className={styles.fieldLabel}>
              {tx('Precio Límite (USD)', 'Limit Price (USD)')}
            </label>
            <input
              id="broker-prop-limit"
              type="number"
              step="0.01"
              min="0.01"
              className={styles.inputField}
              value={limitPrice}
              onChange={(e) => {
                setLimitPrice(e.target.value);
                setError('');
              }}
              required
            />
          </div>
        )}
      </div>

      {estimatedNotional !== null && (
        <div className={styles.previewStrip}>
          <span>
            {tx(
              'Monto estimado con comisión (2%):',
              'Estimated total incl. 2% fee:',
            )}
          </span>
          <strong>{formatUsd(estimatedNotional, { withCode: true })}</strong>
        </div>
      )}

      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}

      <div className={styles.btnRow}>
        <button type="submit" className={styles.primaryBtn}>
          <Icon name="trend" size={15} />
          {tx('Enviar Propuesta al Cliente', 'Send Proposal to Client')}
        </button>
      </div>
    </form>
  );
}
