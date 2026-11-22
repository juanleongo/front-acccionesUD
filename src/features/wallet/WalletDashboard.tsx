'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { ApiError, QUERY_STALE_TIMES, queryKeys } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { BalanceSummaryCard } from './BalanceSummaryCard';
import { FundingPanel } from './FundingPanel';
import { TransactionLedgerTable } from './TransactionLedgerTable';
import { fetchWalletBalance } from './wallet-api';
import styles from './wallet.module.css';

export function WalletDashboard() {
  const client = useQueryClient();
  const { tx } = useLocale();
  const query = useQuery({
    queryKey: queryKeys.wallet.funding(),
    queryFn: async ({ signal }) => {
      const balance = await fetchWalletBalance(signal);
      return { balance };
    },
    staleTime: QUERY_STALE_TIMES.realtime,
    retry: false,
  });
  const balance = query.isError ? null : (query.data?.balance ?? null);
  const loading = query.isFetching;
  const isSessionExpired =
    query.error instanceof ApiError && query.error.metadata.status === 401;
  const error =
    query.isError && !isSessionExpired
      ? tx(
          'No se pudo consultar la billetera. Verifica tu sesión y que tu cuenta de inversión esté activa.',
          'Could not load the wallet. Verify your session and active brokerage account.',
        )
      : !query.isPending && !query.isError && !balance
        ? tx(
            'El saldo no está disponible temporalmente.',
            'Balance is temporarily unavailable.',
          )
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
        <div className={styles.walletHeading}>
          <span className={styles.walletHeadingIcon}>
            <Icon name="wallet" size={25} />
          </span>
          <div>
            <span className={styles.sectionEyebrow}>
              {tx('Gestión de fondos', 'Funds management')}
            </span>
            <h2 className={styles.cardTitle}>
              {tx('Depósitos y retiros', 'Deposits & withdrawals')}
            </h2>
            <p className={styles.cardSubtitle}>
              {tx(
                'Consulta tus saldos, vincula tus cuentas y gestiona tus movimientos en USD.',
                'Review balances, link bank accounts, and manage USD transactions.',
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          className={styles.btnCompact}
          disabled={loading}
          onClick={() => {
            void refresh();
          }}
        >
          {tx(
            'Actualizar saldos y transferencias',
            'Refresh balances & transfers',
          )}
        </button>
      </div>

      {loading && (
        <LoadingState
          mode="compact"
          label={tx('Consultando billetera…', 'Loading wallet…')}
          detail={tx(
            'Actualizando saldos disponibles, reservas y transferencias.',
            'Refreshing available cash, reserves, and transfers.',
          )}
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
