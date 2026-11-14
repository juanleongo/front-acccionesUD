'use client';

import { useState } from 'react';
import { BalanceSummaryCard } from './BalanceSummaryCard';
import { CurrencyConverterWidget } from './CurrencyConverterWidget';
import { DepositModal } from './DepositModal';
import { TransactionLedgerTable } from './TransactionLedgerTable';
import { WithdrawalModal } from './WithdrawalModal';
import {
  INITIAL_LEDGER_TRANSACTIONS,
  INITIAL_WALLET_BALANCE,
  type CurrencyCode,
  type LedgerTransaction,
  type WalletBalance,
} from './wallet-mock';
import styles from './wallet.module.css';

export function WalletDashboard() {
  const [balance, setBalance] = useState<WalletBalance>(INITIAL_WALLET_BALANCE);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(
    INITIAL_LEDGER_TRANSACTIONS,
  );
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  function handleConfirmDeposit(payload: {
    currency: CurrencyCode;
    originalAmount: number;
    amountUsd: number;
    feeUsd: number;
    method: string;
  }) {
    const newAvailable = Number(
      (balance.available_balance_usd + payload.amountUsd).toFixed(2),
    );
    setBalance((prev) => ({
      ...prev,
      available_balance_usd: newAvailable,
    }));

    const newTx: LedgerTransaction = {
      id: `tx-${Date.now().toString(36)}`,
      tx_type: 'DEPOSIT',
      concept: `Depósito ${payload.currency} → USD (${payload.method})`,
      original_currency: payload.currency,
      original_amount: payload.originalAmount,
      amount_usd: payload.amountUsd,
      fee_usd: payload.feeUsd,
      balance_after_usd: newAvailable + balance.reserved_balance_usd,
      external_ref: `STRIPE-SIM-${Math.floor(100 + Math.random() * 900)}`,
      status: 'COMPLETADO',
      created_at: new Date().toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setTransactions((prev) => [newTx, ...prev]);
  }

  function handleConfirmWithdrawal(payload: {
    amountUsd: number;
    destination: string;
  }) {
    const newAvailable = Math.max(
      0,
      Number((balance.available_balance_usd - payload.amountUsd).toFixed(2)),
    );
    setBalance((prev) => ({
      ...prev,
      available_balance_usd: newAvailable,
    }));

    const newTx: LedgerTransaction = {
      id: `tx-${Date.now().toString(36)}`,
      tx_type: 'WITHDRAWAL',
      concept: `Retiro hacia ${payload.destination}`,
      original_currency: 'USD',
      original_amount: payload.amountUsd,
      amount_usd: -payload.amountUsd,
      fee_usd: 0,
      balance_after_usd: newAvailable + balance.reserved_balance_usd,
      external_ref: `WD-SIM-${Math.floor(100 + Math.random() * 900)}`,
      status: 'COMPLETADO',
      created_at: new Date().toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setTransactions((prev) => [newTx, ...prev]);
  }

  return (
    <div className={styles.walletContainer}>
      <div className={styles.topGrid}>
        <BalanceSummaryCard
          balance={balance}
          onOpenDeposit={() => setDepositOpen(true)}
          onOpenWithdrawal={() => setWithdrawalOpen(true)}
        />
        <CurrencyConverterWidget />
      </div>

      <TransactionLedgerTable transactions={transactions} />

      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onConfirmDeposit={handleConfirmDeposit}
      />

      <WithdrawalModal
        open={withdrawalOpen}
        availableBalanceUsd={balance.available_balance_usd}
        reservedBalanceUsd={balance.reserved_balance_usd}
        onClose={() => setWithdrawalOpen(false)}
        onConfirmWithdrawal={handleConfirmWithdrawal}
      />
    </div>
  );
}
