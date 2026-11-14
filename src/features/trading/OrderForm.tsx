'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { OrderTypeSelector } from './OrderTypeSelector';
import { PriceValidityTimer } from './PriceValidityTimer';
import type { SlippageAlertData } from './PriceSlippageAlertModal';
import {
  TRADING_SYMBOLS,
  type OrderPreview,
  type OrderRecord,
  type OrderSide,
  type OrderType,
  type TimeInForce,
} from './trading-mock';
import styles from './trading.module.css';

const PREVIEW_TTL_SECONDS = 10;

export function OrderForm({
  initialSymbol,
  onOrderCreated,
  onSlippageRequired,
}: {
  initialSymbol?: string | undefined;
  onOrderCreated: (order: OrderRecord) => void;
  onSlippageRequired: (
    alert: SlippageAlertData,
    pendingOrder: OrderRecord,
  ) => void;
}) {
  const defaultSymbol = TRADING_SYMBOLS[0]?.symbol ?? 'AAPL';
  const [symbol, setSymbol] = useState(
    initialSymbol && TRADING_SYMBOLS.some((s) => s.symbol === initialSymbol)
      ? initialSymbol
      : defaultSymbol,
  );
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [quantity, setQuantity] = useState(10);
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('DAY');
  const [limitPrice, setLimitPrice] = useState('224.00');
  const [stopPrice, setStopPrice] = useState('215.00');
  const [marketOpen, setMarketOpen] = useState(true);
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [previewExpired, setPreviewExpired] = useState(false);
  const [feedback, setFeedback] = useState('');

  const selectedAsset = TRADING_SYMBOLS.find(
    (item) => item.symbol === symbol,
  ) ?? {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ' as const,
    priceUsd: 224.23,
    changePct: 1.42,
  };

  const generatePreview = useCallback(() => {
    setFeedback('');
    setPreviewExpired(false);
    const basePrice =
      orderType === 'limit'
        ? parseFloat(limitPrice) || selectedAsset.priceUsd
        : orderType === 'stop_loss' || orderType === 'take_profit'
          ? parseFloat(stopPrice) || selectedAsset.priceUsd
          : selectedAsset.priceUsd;
    const subtotal = basePrice * quantity;
    const platformFee = subtotal * 0.012;
    const advisorFee = subtotal * 0.008;
    const total =
      side === 'buy'
        ? subtotal + platformFee + advisorFee
        : subtotal - platformFee - advisorFee;

    setPreview({
      preview_id: `prv-${Date.now().toString(36)}`,
      symbol: selectedAsset.symbol,
      side,
      order_type: orderType,
      quantity,
      quoted_price_usd: selectedAsset.priceUsd,
      limit_price_usd: orderType === 'limit' ? basePrice : null,
      stop_price_usd:
        orderType === 'stop_loss' || orderType === 'take_profit'
          ? basePrice
          : null,
      subtotal_usd: subtotal,
      platform_fee_usd: platformFee,
      advisor_fee_usd: advisorFee,
      total_usd: total,
      expires_at_ms: Date.now() + PREVIEW_TTL_SECONDS * 1000,
      ttl_seconds: PREVIEW_TTL_SECONDS,
      market_open: marketOpen,
    });
  }, [
    limitPrice,
    marketOpen,
    orderType,
    quantity,
    selectedAsset.priceUsd,
    selectedAsset.symbol,
    side,
    stopPrice,
  ]);

  function buildOrderRecord(forceReauth = false): OrderRecord {
    const activePreview = preview!;
    const status = forceReauth
      ? 'REAUTHORIZATION_REQUIRED'
      : !marketOpen
        ? 'QUEUED_OUT_OF_HOURS'
        : activePreview.order_type === 'market'
          ? 'FILLED'
          : 'OPEN';

    return {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      client_order_id: `cli-${activePreview.symbol.toLowerCase()}-${Date.now().toString(36)}`,
      symbol: activePreview.symbol,
      side: activePreview.side,
      order_type: activePreview.order_type,
      time_in_force: timeInForce,
      quantity: activePreview.quantity,
      execution_price_usd:
        status === 'FILLED' ? activePreview.quoted_price_usd : null,
      limit_price_usd: activePreview.limit_price_usd,
      stop_price_usd: activePreview.stop_price_usd,
      total_usd: activePreview.total_usd,
      status,
      execution_source: 'Alpaca Sandbox (US)',
      created_at:
        new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' ET',
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!preview || previewExpired) {
      generatePreview();
      return;
    }

    const order = buildOrderRecord(false);
    onOrderCreated(order);
    setFeedback(
      order.status === 'QUEUED_OUT_OF_HOURS'
        ? `Orden ${order.id} encolada fuera de horario para la apertura de Wall Street.`
        : `Orden ${order.id} (${order.symbol}) enviada con Idempotency-Key y Preview ${preview.preview_id}.`,
    );
    setPreview(null);
  }

  function handleSimulateSlippage() {
    if (!preview) return;
    const newPrice = Number((preview.quoted_price_usd * 1.024).toFixed(2));
    const newSubtotal = newPrice * preview.quantity;
    const newTotal = newSubtotal * 1.02;
    const pendingOrder = buildOrderRecord(true);
    onSlippageRequired(
      {
        orderId: pendingOrder.id,
        symbol: preview.symbol,
        quantity: preview.quantity,
        originalPriceUsd: preview.quoted_price_usd,
        newPriceUsd: newPrice,
        variationPct: 2.4,
        newTotalUsd: newTotal,
      },
      pendingOrder,
    );
    setPreview(null);
  }

  return (
    <section className={styles.card} aria-labelledby="order-form-heading">
      <div className={styles.cardHeader}>
        <div>
          <h2 id="order-form-heading" className={styles.cardTitle}>
            Terminal de Órdenes · ExecutionRouter (Mockup 06)
          </h2>
          <p className={styles.cardSubtitle}>
            Envío de órdenes hacia Alpaca Broker Sandbox (NYSE / NASDAQ) en
            dólares estadounidenses (USD).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMarketOpen((prev) => !prev);
            setPreview(null);
          }}
          className={
            marketOpen ? styles.marketBadgeOpen : styles.marketBadgeClosed
          }
          title="Alternar simulación de horario bursátil"
        >
          <span className={styles.dotPulse} />
          {marketOpen
            ? 'Mercado Abierto · Ejecución Directa'
            : 'Fuera de Horario · Encolamiento'}
        </button>
      </div>

      {feedback && (
        <div className={styles.alertBanner} role="status">
          {feedback}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.sideToggle} role="group" aria-label="Sentido">
          <button
            type="button"
            onClick={() => {
              setSide('buy');
              setPreview(null);
            }}
            className={`${styles.sideBtn} ${side === 'buy' ? styles.sideBtnBuyActive : ''}`}
          >
            Comprar (Buy)
          </button>
          <button
            type="button"
            onClick={() => {
              setSide('sell');
              setPreview(null);
            }}
            className={`${styles.sideBtn} ${side === 'sell' ? styles.sideBtnSellActive : ''}`}
          >
            Vender (Sell)
          </button>
        </div>

        <OrderTypeSelector
          value={orderType}
          onChange={(nextType) => {
            setOrderType(nextType);
            setPreview(null);
          }}
        />

        <div className={styles.formGrid}>
          <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
            <label htmlFor="trading-symbol" className={styles.fieldLabel}>
              Activo Financiero (Wall Street)
            </label>
            <select
              id="trading-symbol"
              className={styles.select}
              value={symbol}
              onChange={(e) => {
                const nextSym = e.target.value;
                setSymbol(nextSym);
                const found = TRADING_SYMBOLS.find((s) => s.symbol === nextSym);
                if (found) {
                  setLimitPrice(found.priceUsd.toFixed(2));
                  setStopPrice((found.priceUsd * 0.96).toFixed(2));
                }
                setPreview(null);
              }}
            >
              {TRADING_SYMBOLS.map((item) => (
                <option key={item.symbol} value={item.symbol}>
                  {item.symbol} · {item.name} ({item.exchange}) — $
                  {item.priceUsd.toFixed(2)} USD
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="trading-qty" className={styles.fieldLabel}>
              Cantidad (Títulos)
            </label>
            <input
              id="trading-qty"
              type="number"
              min={1}
              max={10000}
              className={styles.input}
              value={quantity}
              onChange={(e) => {
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1));
                setPreview(null);
              }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="trading-tif" className={styles.fieldLabel}>
              Vigencia (Time in Force)
            </label>
            <select
              id="trading-tif"
              className={styles.select}
              value={timeInForce}
              onChange={(e) => setTimeInForce(e.target.value as TimeInForce)}
            >
              <option value="DAY">DAY (Válida hoy)</option>
              <option value="GTC">GTC (Hasta cancelar)</option>
              <option value="IOC">IOC (Inmediata o cancelar)</option>
            </select>
          </div>

          {orderType === 'limit' && (
            <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
              <label htmlFor="trading-limit" className={styles.fieldLabel}>
                Precio Límite (USD)
              </label>
              <input
                id="trading-limit"
                type="number"
                step="0.01"
                min="0.01"
                className={styles.input}
                value={limitPrice}
                onChange={(e) => {
                  setLimitPrice(e.target.value);
                  setPreview(null);
                }}
              />
            </div>
          )}

          {(orderType === 'stop_loss' || orderType === 'take_profit') && (
            <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
              <label htmlFor="trading-stop" className={styles.fieldLabel}>
                {orderType === 'stop_loss'
                  ? 'Precio de Disparo Stop Loss (USD)'
                  : 'Precio Objetivo Take Profit (USD)'}
              </label>
              <input
                id="trading-stop"
                type="number"
                step="0.01"
                min="0.01"
                className={styles.input}
                value={stopPrice}
                onChange={(e) => {
                  setStopPrice(e.target.value);
                  setPreview(null);
                }}
              />
            </div>
          )}
        </div>

        {preview && (
          <>
            <PriceValidityTimer
              key={preview.preview_id}
              expiresAtMs={preview.expires_at_ms}
              ttlSeconds={preview.ttl_seconds}
              onRefresh={generatePreview}
              onExpire={() => setPreviewExpired(true)}
            />

            <div className={styles.previewBox}>
              <div className={styles.summaryRow}>
                <span>
                  Preview ID: <code>{preview.preview_id}</code>
                </span>
                <strong>${preview.quoted_price_usd.toFixed(2)} USD</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Subtotal ({preview.quantity} acciones):</span>
                <strong>${preview.subtotal_usd.toFixed(2)} USD</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Comisión Plataforma (1.2%):</span>
                <strong>${preview.platform_fee_usd.toFixed(2)} USD</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Comisión Asesor (0.8%):</span>
                <strong>${preview.advisor_fee_usd.toFixed(2)} USD</strong>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>
                  {side === 'buy'
                    ? 'Total Estimado a Debitar:'
                    : 'Total Neto Estimado a Recibir:'}
                </span>
                <strong>${preview.total_usd.toFixed(2)} USD</strong>
              </div>
            </div>
          </>
        )}

        <div className={styles.actionsRow}>
          {!preview || previewExpired ? (
            <button
              type="button"
              onClick={generatePreview}
              className={styles.btnPrimary}
            >
              Calcular Preview (Vigencia 10s)
            </button>
          ) : (
            <>
              <button type="submit" className={styles.btnPrimary}>
                {side === 'buy'
                  ? `Confirmar Compra (${symbol})`
                  : `Confirmar Venta (${symbol})`}
              </button>
              <button
                type="button"
                onClick={handleSimulateSlippage}
                className={styles.btnSecondary}
                title="Simula una variación brusca de precio para probar el modal de reautorización"
              >
                Simular Slippage (+2.4%)
              </button>
            </>
          )}
        </div>
      </form>
    </section>
  );
}
