'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { ApiError } from '@/lib/api';
import { BalanceSummaryCard } from './BalanceSummaryCard';
import { FundingPanel } from './FundingPanel';
import { TransactionLedgerTable } from './TransactionLedgerTable';
import { fetchWalletBalance } from './wallet-api';
import styles from './wallet.module.css';

export function WalletDashboard() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['wallet', 'funding'],
    queryFn: async ({ signal }) => {
      const balance = await fetchWalletBalance(signal);
      return { balance };
    },
    retry: false,
  });
  const balance = query.isError ? null : (query.data?.balance ?? null);
  const loading = query.isFetching;
  const isSessionExpired =
    query.error instanceof ApiError && query.error.metadata.status === 401;
  const error =
    query.isError && !isSessionExpired
      ? 'No se pudo consultar la billetera. Verifica tu sesión y que tu cuenta de inversión esté activa.'
      : !query.isPending && !query.isError && !balance
        ? 'El saldo no está disponible temporalmente.'
        : '';

  async function refresh() {
    await Promise.all([
      query.refetch(),
      client.invalidateQueries({ queryKey: ['wallet', 'transfers'] }),
    ]);
  }

  return (
    <div className={styles.walletContainer}>
      <div className={styles.walletTopBar}>
        <div>
          <h2 className={styles.cardTitle}>Billetera y fondos</h2>
          <p className={styles.cardSubtitle}>
            Billetera de simulación · fondos virtuales en USD
          </p>
        </div>
        <button
          type="button"
          className={styles.btnCompact}
          disabled={loading}
          onClick={() => {
            void refresh();
          }}
        >
          Actualizar saldos y transferencias
        </button>
      </div>

      {loading && (
        <LoadingState
          mode="compact"
          label="Consultando billetera…"
          detail="Actualizando saldos disponibles, reservas y transferencias."
        />
      )}
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
      <TransactionLedgerTable />
    </div>
  );
}
