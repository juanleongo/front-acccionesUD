'use client';

import type { FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { formatPersonName } from '@/lib/format-person-name';
import { useLocale } from '@/lib/i18n';
import styles from '../wallet.module.css';

export function LinkBankAccordion({
  busy,
  initiallyOpen = false,
  owner,
  accountType,
  account,
  routing,
  onOwnerChange,
  onAccountTypeChange,
  onAccountChange,
  onRoutingChange,
  onSubmit,
}: {
  busy: boolean;
  initiallyOpen?: boolean;
  owner: string;
  accountType: 'CHECKING' | 'SAVINGS';
  account: string;
  routing: string;
  onOwnerChange: (value: string) => void;
  onAccountTypeChange: (value: 'CHECKING' | 'SAVINGS') => void;
  onAccountChange: (value: string) => void;
  onRoutingChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const { tx } = useLocale();
  return (
    <details
      className={styles.detailsAccordion}
      open={initiallyOpen || undefined}
    >
      <summary className={styles.detailsSummary}>
        <span>
          {tx('Vincular cuenta bancaria de prueba', 'Link test bank account')}
        </span>
        <span className={styles.detailsSummaryHint}>
          {tx('Configurar cuenta', 'Set up account')}
        </span>
      </summary>
      <div className={styles.detailsBody}>
        <p className={styles.cardSubtitle}>
          {tx(
            'Tu verificación de identidad debe estar activa. Usa datos bancarios de prueba para simular depósitos y retiros.',
            'Your identity verification must be active. Use test bank details to simulate deposits and withdrawals.',
          )}
        </p>
        <form onSubmit={onSubmit} noValidate>
          <fieldset disabled={busy} className={styles.fundingFields}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label htmlFor="bank-owner" className={styles.fieldLabel}>
                  {tx(
                    'Nombre completo del titular',
                    'Account holder full name',
                  )}
                </label>
                <input
                  id="bank-owner"
                  className={styles.input}
                  placeholder={tx('Ej. Dante Santos', 'E.g. John Smith')}
                  required
                  maxLength={200}
                  value={owner}
                  onBlur={() => onOwnerChange(formatPersonName(owner))}
                  aria-describedby="bank-owner-help"
                  onChange={(event) => onOwnerChange(event.target.value)}
                />
                <small id="bank-owner-help" className={styles.bankFieldHint}>
                  {tx(
                    'Debe coincidir con el nombre completo de tu cuenta verificada en Acciones UD.',
                    'Must match the full name on your verified Acciones UD account.',
                  )}
                </small>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="bank-type" className={styles.fieldLabel}>
                  {tx('Tipo de cuenta', 'Account type')}
                </label>
                <CustomSelect
                  id="bank-type"
                  value={accountType}
                  onChange={(nextVal) =>
                    onAccountTypeChange(nextVal as 'CHECKING' | 'SAVINGS')
                  }
                  options={[
                    { value: 'CHECKING', label: tx('Corriente', 'Checking') },
                    { value: 'SAVINGS', label: tx('Ahorros', 'Savings') },
                  ]}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="bank-account" className={styles.fieldLabel}>
                  {tx('Número de cuenta', 'Account number')}
                </label>
                <input
                  id="bank-account"
                  className={`${styles.input} ${styles.tabularNum}`}
                  required
                  pattern="[0-9]{4,17}"
                  maxLength={17}
                  aria-describedby="bank-account-help"
                  inputMode="numeric"
                  autoComplete="off"
                  value={account}
                  onChange={(event) => onAccountChange(event.target.value)}
                />
                <small id="bank-account-help" className={styles.bankFieldHint}>
                  {tx(
                    'Entre 4 y 17 dígitos. Sin espacios ni guiones.',
                    'Between 4 and 17 digits. No spaces or hyphens.',
                  )}
                </small>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="bank-routing" className={styles.fieldLabel}>
                  {tx(
                    'Código bancario ACH (routing number)',
                    'ACH Routing Number',
                  )}
                </label>
                <input
                  id="bank-routing"
                  className={`${styles.input} ${styles.tabularNum}`}
                  required
                  pattern="[0-9]{9}"
                  maxLength={9}
                  aria-describedby="bank-routing-help"
                  inputMode="numeric"
                  autoComplete="off"
                  value={routing}
                  onChange={(event) => onRoutingChange(event.target.value)}
                />
                <small id="bank-routing-help" className={styles.bankFieldHint}>
                  {tx(
                    'Identifica al banco en Estados Unidos: exactamente 9 dígitos. Usa el código ACH que proporciona tu banco de prueba; no es el número de cuenta ni un código SWIFT.',
                    'Identifies the US bank: exactly 9 digits. Use the ACH code provided by your test bank; not the account number or a SWIFT code.',
                  )}
                </small>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button className={styles.btnSecondary} type="submit">
                {tx('Vincular cuenta de prueba', 'Link test account')}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </details>
  );
}
