'use client';

import type { FormEvent } from 'react';
import { formatPersonName } from '@/lib/format-person-name';
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
  return (
    <details
      className={styles.detailsAccordion}
      open={initiallyOpen || undefined}
    >
      <summary className={styles.detailsSummary}>
        <span>Vincular cuenta bancaria de prueba</span>
        <span className={styles.detailsSummaryHint}>Configurar cuenta</span>
      </summary>
      <div className={styles.detailsBody}>
        <p className={styles.cardSubtitle}>
          Tu verificación de identidad debe estar activa. Usa datos bancarios de
          prueba para simular depósitos y retiros.
        </p>
        <form onSubmit={onSubmit} noValidate>
          <fieldset disabled={busy} className={styles.fundingFields}>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label htmlFor="bank-owner">Nombre completo del titular</label>
                <input
                  id="bank-owner"
                  className={styles.input}
                  placeholder="Ej. Dante Santos"
                  required
                  maxLength={200}
                  value={owner}
                  onBlur={() => onOwnerChange(formatPersonName(owner))}
                  aria-describedby="bank-owner-help"
                  onChange={(event) => onOwnerChange(event.target.value)}
                />
                <small id="bank-owner-help" className={styles.bankFieldHint}>
                  Debe coincidir con el nombre completo de tu cuenta verificada
                  en Acciones UD.
                </small>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="bank-type">Tipo de cuenta</label>
                <select
                  id="bank-type"
                  className={styles.select}
                  value={accountType}
                  onChange={(event) =>
                    onAccountTypeChange(
                      event.target.value as 'CHECKING' | 'SAVINGS',
                    )
                  }
                >
                  <option value="CHECKING">Corriente</option>
                  <option value="SAVINGS">Ahorros</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="bank-account">Número de cuenta</label>
                <input
                  id="bank-account"
                  className={styles.input}
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
                  Entre 4 y 17 dígitos. Sin espacios ni guiones.
                </small>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="bank-routing">
                  Código bancario ACH (routing number)
                </label>
                <input
                  id="bank-routing"
                  className={styles.input}
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
                  Identifica al banco en Estados Unidos: exactamente 9 dígitos.
                  Usa el código ACH que proporciona tu banco de prueba; no es el
                  número de cuenta ni un código SWIFT.
                </small>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button className={styles.btnSecondary} type="submit">
                Vincular cuenta de prueba
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </details>
  );
}
