'use client';

import { Icon } from '@/components/ui/Icon';
import { formatPersonName } from '@/lib/format-person-name';
import { formatMarketDateTime } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { BankRelationship } from '../wallet-api';
import { formatBankStatus } from '../wallet-labels';
import styles from '../wallet.module.css';

export function BankAccountDetails({ bank }: { bank: BankRelationship }) {
  const { locale, tx } = useLocale();
  const accountType =
    bank.account_type === 'CHECKING'
      ? tx('Cuenta corriente', 'Checking account')
      : bank.account_type === 'SAVINGS'
        ? tx('Cuenta de ahorros', 'Savings account')
        : bank.account_type || tx('No disponible', 'Unavailable');
  return (
    <section
      className={styles.bankDetails}
      aria-label={tx(
        'Detalle de la cuenta seleccionada',
        'Selected account details',
      )}
      aria-live="polite"
    >
      <div className={styles.bankDetailsHeader}>
        <h3 className={styles.bankDetailsTitle}>
          <Icon name="wallet" size={20} />
          {tx('Detalle de la cuenta', 'Account details')}
        </h3>
        <span className={`${styles.statusBadge} ${styles.badgeSuccess}`}>
          {formatBankStatus(bank.status, locale)}
        </span>
      </div>
      <dl className={styles.bankDetailsGrid}>
        <div>
          <dt>{tx('Titular', 'Account holder')}</dt>
          <dd>{formatPersonName(bank.owner_name)}</dd>
        </div>
        <div>
          <dt>{tx('Tipo de cuenta', 'Account type')}</dt>
          <dd>{accountType}</dd>
        </div>
        <div>
          <dt>{tx('Número de cuenta', 'Account number')}</dt>
          <dd>****{bank.account_last4}</dd>
        </div>
        <div>
          <dt>{tx('Fecha de vinculación', 'Linked on')}</dt>
          <dd>
            {Number.isFinite(Date.parse(bank.created_at))
              ? formatMarketDateTime(bank.created_at, locale)
              : tx('No disponible', 'Unavailable')}
          </dd>
        </div>
      </dl>
    </section>
  );
}
