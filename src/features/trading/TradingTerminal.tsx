'use client';

import { useState } from 'react';
import { ActiveOrdersTable } from './ActiveOrdersTable';
import { OrderForm } from './OrderForm';
import {
  PriceSlippageAlertModal,
  type SlippageAlertData,
} from './PriceSlippageAlertModal';
import {
  INITIAL_MOCK_ORDERS,
  TRADING_SYMBOLS,
  type OrderRecord,
} from './trading-mock';
import styles from './trading.module.css';

export function TradingTerminal({
  initialSymbol,
}: {
  initialSymbol?: string | undefined;
} = {}) {
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_MOCK_ORDERS);
  const [slippageAlert, setSlippageAlert] = useState<SlippageAlertData | null>(
    null,
  );
  const [pendingReauthOrderId, setPendingReauthOrderId] = useState<
    string | null
  >(null);

  function handleOrderCreated(newOrder: OrderRecord) {
    setOrders((prev) => [newOrder, ...prev]);
  }

  function handleSlippageRequired(
    alertData: SlippageAlertData,
    pendingOrder: OrderRecord,
  ) {
    setOrders((prev) => [pendingOrder, ...prev]);
    setPendingReauthOrderId(pendingOrder.id);
    setSlippageAlert(alertData);
  }

  function handleCancelOrder(orderId: string) {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'CANCELLED' } : ord,
      ),
    );
  }

  function handleOpenReauthorize(order: OrderRecord) {
    const asset = TRADING_SYMBOLS.find((s) => s.symbol === order.symbol);
    const originalPrice =
      order.limit_price_usd ?? order.stop_price_usd ?? asset?.priceUsd ?? 100.0;
    const newPrice = Number((originalPrice * 1.022).toFixed(2));
    setPendingReauthOrderId(order.id);
    setSlippageAlert({
      orderId: order.id,
      symbol: order.symbol,
      quantity: order.quantity,
      originalPriceUsd: originalPrice,
      newPriceUsd: newPrice,
      variationPct: 2.2,
      newTotalUsd: Number((newPrice * order.quantity * 1.02).toFixed(2)),
    });
  }

  function handleConfirmReauthorization() {
    if (!pendingReauthOrderId || !slippageAlert) return;
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === pendingReauthOrderId
          ? {
              ...ord,
              status: 'FILLED',
              execution_price_usd: slippageAlert.newPriceUsd,
              total_usd: slippageAlert.newTotalUsd,
            }
          : ord,
      ),
    );
    setSlippageAlert(null);
    setPendingReauthOrderId(null);
  }

  function handleCancelSlippageModal() {
    if (pendingReauthOrderId) {
      handleCancelOrder(pendingReauthOrderId);
    }
    setSlippageAlert(null);
    setPendingReauthOrderId(null);
  }

  return (
    <div className={styles.tradingContainer}>
      <div className={styles.terminalGrid}>
        <OrderForm
          key={initialSymbol ?? 'default'}
          initialSymbol={initialSymbol}
          onOrderCreated={handleOrderCreated}
          onSlippageRequired={handleSlippageRequired}
        />

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>
                Cotizaciones Rápidas (Wall Street)
              </h2>
              <p className={styles.cardSubtitle}>
                Precios de referencia en tiempo real (USD) vía Alpaca Data Feed.
              </p>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Bolsa</th>
                  <th>Precio (USD)</th>
                  <th>Var.</th>
                </tr>
              </thead>
              <tbody>
                {TRADING_SYMBOLS.map((item) => (
                  <tr key={item.symbol}>
                    <td>
                      <strong>{item.symbol}</strong>
                      <div
                        style={{
                          fontSize: '0.73rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {item.name}
                      </div>
                    </td>
                    <td>{item.exchange}</td>
                    <td>
                      <strong>${item.priceUsd.toFixed(2)}</strong>
                    </td>
                    <td>
                      <strong
                        style={{
                          color: item.changePct >= 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {item.changePct >= 0 ? '+' : ''}
                        {item.changePct.toFixed(2)}%
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ActiveOrdersTable
        orders={orders}
        onCancelOrder={handleCancelOrder}
        onOpenReauthorize={handleOpenReauthorize}
      />

      <PriceSlippageAlertModal
        data={slippageAlert}
        onReauthorize={handleConfirmReauthorization}
        onCancel={handleCancelSlippageModal}
      />
    </div>
  );
}
