'use client';

import { useQuery } from '@tanstack/react-query';
import { BalanceSummaryCard } from './BalanceSummaryCard';
import { TransactionLedgerTable } from './TransactionLedgerTable';
import { FundingPanel } from './FundingPanel';
import { fetchWalletBalance, fetchWalletTransfers } from './wallet-api';
import styles from './wallet.module.css';

export function WalletDashboard() {
  const query = useQuery({
    queryKey: ['wallet', 'funding'],
    queryFn: async ({ signal }) => {
      const [balance, transactions] = await Promise.all([
        fetchWalletBalance(signal),
        fetchWalletTransfers(signal),
      ]);
      return { balance, transactions };
    },
    retry: false,
  });
  const balance = query.isError ? null : (query.data?.balance ?? null);
  const transactions = query.isError ? [] : (query.data?.transactions ?? []);
  const loading = query.isFetching;
  const error = query.isError
    ? 'No se pudo consultar la billetera. Verifica tu sesión y que tu cuenta KYC esté activa.'
    : !query.isPending && !balance
      ? 'El saldo no está disponible temporalmente.'
      : '';
  async function refresh() {
    await query.refetch();
  }
  return (
    <div className={styles.walletContainer}>
      <p className={styles.cardSubtitle}>
        Billetera de simulación · fondos virtuales en USD
      </p>
      <button
        type="button"
        className={styles.btnSecondary}
        disabled={loading}
        onClick={() => {
          void refresh();
        }}
      >
        Actualizar saldos y transferencias
      </button>
      {loading && <p role="status">Consultando billetera…</p>}
      {error && (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      )}
      {balance && <BalanceSummaryCard balance={balance} />}
      <FundingPanel
        onRefresh={refresh}
        available={balance?.available_balance_usd ?? null}
      />
      <TransactionLedgerTable transactions={transactions} />
    </div>
  );
}
