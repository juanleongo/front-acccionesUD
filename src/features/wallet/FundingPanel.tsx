'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  fetchExchangeRates,
  isRecentRate,
  convertedUsd,
  type DepositCurrency,
  type ExchangeRate,
} from './exchange-rates';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { ApiError } from '@/lib/api';
import {
  formatMarketDateTime,
  formatUsd as formatUsdAmount,
} from '@/lib/formatters';
import { formatPersonName } from '@/lib/format-person-name';
import { useLocale } from '@/lib/i18n';
import {
  formatBankLinkError,
  isValidAchRoutingNumber,
} from './bank-validation';
import { LinkBankAccordion } from './components/LinkBankAccordion';
import {
  createBank,
  fetchBanks,
  requestTransfer,
  type BankRelationship,
} from './wallet-api';
import {
  formatBankStatus,
  formatTransferStatus,
  formatUsd,
} from './wallet-labels';
import styles from './wallet.module.css';

const DEPOSIT_METHODS = [
  {
    key: 'pse',
    es: 'PSE / Transferencia Colombia',
    en: 'PSE / Colombia Transfer',
    icon: 'coin',
  },
  {
    key: 'card',
    es: 'Tarjeta débito / crédito',
    en: 'Debit / credit card',
    icon: 'wallet',
  },
  {
    key: 'wire',
    es: 'Transferencia internacional',
    en: 'International wire',
    icon: 'globe',
  },
] as const;

export function FundingPanel({
  onRefresh,
  available,
}: {
  onRefresh: () => Promise<void>;
  available: number | null;
}) {
  const { locale, tx } = useLocale();
  const [direction, setDirection] = useState<'deposit' | 'withdrawal'>(
    'deposit',
  );
  const [methodKey, setMethodKey] = useState<string>(DEPOSIT_METHODS[0].key);
  const activeMethod =
    DEPOSIT_METHODS.find((item) => item.key === methodKey) ??
    DEPOSIT_METHODS[0];
  const [banks, setBanks] = useState<BankRelationship[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const approvedBanks = banks.filter((bank) => bank.status === 'APPROVED');
  const [bankId, setBankId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<DepositCurrency>('USD');
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(false);
  const [rateRetry, setRateRetry] = useState(0);
  const effectiveCurrency = direction === 'deposit' ? currency : 'USD';
  const rate = rates.find((item) => item.quote === effectiveCurrency);
  const rateUsable = Boolean(rate);
  const unitsPerUsd =
    effectiveCurrency === 'USD' ? 1 : rateUsable && rate ? rate.rate : 0;
  const usdAmount = convertedUsd(amount, unitsPerUsd);
  useEffect(() => {
    const controller = new AbortController();
    fetchExchangeRates(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setRates(
            value.filter(
              (item) =>
                Date.now() - Date.parse(item.date + 'T00:00:00Z') <=
                7 * 86400000,
            ),
          );
          setRatesError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setRatesError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setRatesLoading(false);
      });
    return () => controller.abort();
  }, [rateRetry]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [banksFetchError, setBanksFetchError] = useState(false);
  const [notice, setNotice] = useState('');
  const [owner, setOwner] = useState('');
  const [account, setAccount] = useState('');
  const [routing, setRouting] = useState('');
  const [accountType, setAccountType] = useState<'CHECKING' | 'SAVINGS'>(
    'CHECKING',
  );
  const inFlight = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);

  async function loadBanks() {
    setLoadingBanks(true);
    setBanksFetchError(false);
    try {
      const result = await fetchBanks();
      setBanks(result);
      setBankId((current) =>
        result.some((bank) => bank.id === current && bank.status === 'APPROVED')
          ? current
          : (result.find((bank) => bank.status === 'APPROVED')?.id ?? ''),
      );
    } finally {
      setLoadingBanks(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchBanks()
      .then((result) => {
        if (!active) return;
        setBanks(result);
        setBankId(result.find((bank) => bank.status === 'APPROVED')?.id ?? '');
      })
      .catch((failure: unknown) => {
        if (
          active &&
          !(failure instanceof ApiError && failure.metadata.status === 401)
        ) {
          setBanksFetchError(true);
        }
      })
      .finally(() => {
        if (active) setLoadingBanks(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayedError =
    error ||
    (banksFetchError
      ? tx(
          'No se pudieron consultar las cuentas bancarias. Verifica tu sesión y el estado de tu verificación de identidad.',
          'Could not load linked bank accounts. Verify your session and identity verification status.',
        )
      : '');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    setBanksFetchError(false);
    setError('');
    setNotice('');
    if (
      !/^\d+(\.\d{1,2})?$/.test(amount) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setError(
        tx(
          'Ingresa un monto positivo con máximo dos decimales.',
          'Enter a positive amount with up to two decimal places.',
        ),
      );
      return;
    }
    if (
      !banks.some((bank) => bank.id === bankId && bank.status === 'APPROVED')
    ) {
      setError(
        tx(
          'Selecciona una cuenta bancaria aprobada.',
          'Select an approved bank account.',
        ),
      );
      return;
    }
    if (
      direction === 'withdrawal' &&
      (available === null || Number(amount) > available)
    ) {
      setError(
        tx(
          'El monto supera el saldo retirable o el saldo todavía no está disponible.',
          'Amount exceeds withdrawable balance or balance is not available yet.',
        ),
      );
      return;
    }
    if (
      !usdAmount ||
      Number(usdAmount) < 1 ||
      (effectiveCurrency !== 'USD' &&
        (ratesLoading || ratesError || !rateUsable))
    ) {
      setError(
        tx(
          'Necesitas una tasa disponible y un equivalente de al menos 1 USD.',
          'A valid exchange rate and an equivalent of at least 1 USD are required.',
        ),
      );
      return;
    }
    if (effectiveCurrency !== 'USD' && rate && !isRecentRate(rate.date)) {
      setRatesLoading(true);
      setRateRetry((value) => value + 1);
      setError(
        tx(
          'La tasa venció. Actualizando la cotización; revisa el importe y confirma de nuevo.',
          'Rate expired. Refreshing the quote; review the amount and confirm again.',
        ),
      );
      return;
    }
    const normalized = usdAmount;
    const fingerprint = `${direction}:${bankId}:${normalized}`;
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, key: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true);
    try {
      const transfer = await requestTransfer(
        direction,
        bankId,
        normalized,
        attempt.current.key,
      );
      setNotice(
        tx(
          `Solicitud registrada correctamente. Estado: ${formatTransferStatus(transfer.status, locale)} (${transfer.status}).`,
          `Request submitted successfully. Status: ${formatTransferStatus(transfer.status, locale)} (${transfer.status}).`,
        ),
      );
      setAmount('');
      attempt.current = null;
      await onRefresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : tx(
              'No se pudo confirmar la operación.',
              'Could not confirm the transfer.',
            ),
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function linkBank(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    setBanksFetchError(false);
    setError('');
    const normalizedOwner = formatPersonName(owner);
    setOwner(normalizedOwner);
    if (!normalizedOwner) {
      setError(
        tx(
          'Escribe el nombre completo del titular, tal como aparece en tu cuenta verificada.',
          'Enter the account holder’s full name as registered on your verified account.',
        ),
      );
      return;
    }
    if (!/^[0-9]{4,17}$/.test(account)) {
      setError(
        tx(
          'El número de cuenta debe tener entre 4 y 17 dígitos, sin espacios ni guiones.',
          'Account number must contain 4 to 17 digits without spaces or hyphens.',
        ),
      );
      return;
    }
    if (!/^[0-9]{9}$/.test(routing)) {
      setError(
        tx(
          'El código bancario ACH (routing number) debe tener exactamente 9 dígitos.',
          'ACH routing number must contain exactly 9 digits.',
        ),
      );
      return;
    }
    if (!isValidAchRoutingNumber(routing)) {
      setError(
        tx(
          'El código bancario no es un routing number ABA válido. Revisa los 9 dígitos con tu banco de prueba de Estados Unidos; no uses un código colombiano, PSE o SWIFT.',
          'The routing number is not a valid US ABA routing number. Check the 9 digits with your US test bank; do not use Colombian, PSE, or SWIFT codes.',
        ),
      );
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const bank = await createBank({
        account_owner_name: normalizedOwner,
        bank_account_type: accountType,
        bank_account_number: account,
        bank_routing_number: routing,
      });
      setNotice(
        tx(
          `Cuenta vinculada correctamente. Estado: ${formatBankStatus(bank.status, locale)}. Actualiza las cuentas para consultar su aprobación.`,
          `Account linked successfully. Status: ${formatBankStatus(bank.status, locale)}. Refresh accounts to check approval.`,
        ),
      );
      setAccount('');
      setRouting('');
      await loadBanks();
    } catch (failure) {
      setError(formatBankLinkError(failure, locale));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section
      className={styles.card}
      aria-label={tx('Depósitos y retiros', 'Deposits and withdrawals')}
    >
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>
            {direction === 'deposit'
              ? tx(
                  'Selecciona tu método de depósito',
                  'Select your deposit method',
                )
              : tx(
                  'Retirar a tu cuenta bancaria',
                  'Withdraw to your bank account',
                )}
          </h2>
          <p className={styles.cardSubtitle}>
            {tx(
              'Simulación con fondos de prueba en USD mediante transferencia ACH. No se realizan cargos reales a tarjetas ni PSE.',
              'Simulated USD test funding via ACH transfer. No real charges are made to cards or bank accounts.',
            )}
          </p>
        </div>

        <div
          className={styles.filterRow}
          aria-label={tx('Tipo de operación', 'Operation type')}
        >
          {(['deposit', 'withdrawal'] as const).map((value) => (
            <button
              key={value}
              type="button"
              disabled={busy}
              aria-pressed={direction === value}
              className={`${styles.filterPill} ${direction === value ? styles.filterPillActive : ''}`}
              onClick={() => {
                setDirection(value);
                setBanksFetchError(false);
                setError('');
                setNotice('');
              }}
            >
              {value === 'deposit'
                ? tx('Depositar fondos', 'Deposit funds')
                : tx('Retirar fondos', 'Withdraw funds')}
            </button>
          ))}
        </div>
      </div>

      {direction === 'deposit' && (
        <div className={styles.paymentMethods}>
          {DEPOSIT_METHODS.map((item) => (
            <button
              type="button"
              key={item.key}
              disabled={busy}
              aria-pressed={methodKey === item.key}
              className={styles.paymentMethod}
              onClick={() => setMethodKey(item.key)}
            >
              <Icon name={item.icon} />
              <strong>{tx(item.es, item.en)}</strong>
              <span>
                {tx('Depósito simulado · USD', 'Simulated deposit · USD')}
              </span>
            </button>
          ))}
        </div>
      )}

      <LinkBankAccordion
        busy={busy}
        initiallyOpen={!loadingBanks && approvedBanks.length === 0}
        owner={owner}
        accountType={accountType}
        account={account}
        routing={routing}
        onOwnerChange={setOwner}
        onAccountTypeChange={setAccountType}
        onAccountChange={setAccount}
        onRoutingChange={setRouting}
        onSubmit={linkBank}
      />

      {loadingBanks && (
        <LoadingState
          mode="compact"
          label={tx('Consultando cuentas vinculadas…', 'Loading linked banks…')}
        />
      )}
      {!loadingBanks && approvedBanks.length === 0 && (
        <div className={styles.bankEmpty}>
          <Icon name="wallet" size={22} />
          <div>
            <strong>
              {banks.length
                ? tx(
                    'Tu cuenta está pendiente de aprobación',
                    'Your bank account is pending approval',
                  )
                : tx(
                    'Primero vincula una cuenta bancaria',
                    'Link a bank account first',
                  )}
            </strong>
            <p>
              {banks.length
                ? tx(
                    'Cuando esté aprobada podrás seleccionarla para depositar o retirar fondos.',
                    'Once approved, you can select it to deposit or withdraw funds.',
                  )
                : tx(
                    'Completa el formulario de arriba para habilitar depósitos y retiros de prueba.',
                    'Complete the form above to enable test deposits and withdrawals.',
                  )}
            </p>
          </div>
          <button
            type="button"
            className={styles.btnCompact}
            onClick={() => {
              void loadBanks().catch(() =>
                setError(
                  tx(
                    'No se pudieron actualizar las cuentas. Inténtalo de nuevo.',
                    'Could not refresh bank accounts. Try again.',
                  ),
                ),
              );
            }}
          >
            {tx('Actualizar cuentas', 'Refresh accounts')}
          </button>
        </div>
      )}
      <form onSubmit={submit} className={styles.fundingForm} noValidate>
        <fieldset
          disabled={busy || loadingBanks || approvedBanks.length === 0}
          className={styles.fundingFields}
        >
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="funding-bank" className={styles.fieldLabel}>
                {tx('Cuenta bancaria vinculada', 'Linked bank account')}
              </label>
              <div className={styles.selectActionRow}>
                <CustomSelect
                  id="funding-bank"
                  value={bankId}
                  onChange={setBankId}
                  required
                  disabled={busy || loadingBanks || approvedBanks.length === 0}
                  placeholder={tx(
                    'Selecciona una cuenta aprobada',
                    'Select an approved account',
                  )}
                  searchable={approvedBanks.length > 5}
                  options={[
                    {
                      value: '',
                      label: tx(
                        'Selecciona una cuenta aprobada',
                        'Select an approved account',
                      ),
                    },
                    ...approvedBanks.map((bank) => ({
                      value: bank.id,
                      disabled: bank.status !== 'APPROVED',
                      label: `${formatPersonName(bank.owner_name)} · ****${bank.account_last4} · ${formatBankStatus(bank.status, locale)}`,
                    })),
                  ]}
                />
                <button
                  type="button"
                  className={styles.btnCompact}
                  onClick={() => {
                    void loadBanks().catch((failure: unknown) => {
                      if (!(
                        failure instanceof ApiError &&
                        failure.metadata.status === 401
                      )) {
                        setError(
                          tx(
                            'No se pudieron actualizar las cuentas.',
                            'Could not refresh bank accounts.',
                          ),
                        );
                      }
                    });
                  }}
                >
                  {tx('Actualizar cuentas', 'Refresh accounts')}
                </button>
              </div>
            </div>

            {direction === 'deposit' && (
              <div className={styles.fieldGroup}>
                <label htmlFor="deposit-currency" className={styles.fieldLabel}>
                  {tx('Moneda del depósito', 'Deposit currency')}
                </label>
                <CustomSelect
                  id="deposit-currency"
                  value={currency}
                  onChange={setCurrency}
                  searchable
                  searchPlaceholder={tx(
                    'Buscar moneda o código…',
                    'Search currency or code…',
                  )}
                  options={Array.from(
                    new Set([
                      'USD',
                      'COP',
                      'EUR',
                      'GBP',
                      ...rates.map((item) => item.quote),
                    ]),
                  )
                    .sort()
                    .map((code) => ({
                      value: code,
                      label: `${code} · ${new Intl.DisplayNames([locale], { type: 'currency' }).of(code) ?? code}`,
                    }))}
                />
                <p className={styles.noteHelper}>
                  {ratesLoading
                    ? tx('Cargando divisas…', 'Loading currencies…')
                    : tx(
                        'Divisas con cotización disponible en el proveedor.',
                        'Currencies with an available provider rate.',
                      )}
                </p>
              </div>
            )}
            <div className={styles.fieldGroup}>
              <label htmlFor="funding-amount" className={styles.fieldLabel}>
                {effectiveCurrency === 'USD'
                  ? tx('Monto en USD', 'Amount (USD)')
                  : `${tx('Monto en', 'Amount in')} ${effectiveCurrency}`}
              </label>
              <input
                id="funding-amount"
                className={`${styles.input} ${styles.tabularNum}`}
                type="number"
                min="0.01"
                step="0.01"
                placeholder={tx('Ej. 100.00', 'E.g. 100.00')}
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
          </div>

          <p className={`${styles.noteHelper} ${styles.tabularNum}`}>
            {direction === 'deposit'
              ? `${tx('Método seleccionado:', 'Selected method:')} ${tx(activeMethod.es, activeMethod.en)}.`
              : `${tx('Saldo retirable:', 'Withdrawable cash:')} ${available === null ? tx('No disponible', 'Unavailable') : `$${formatUsd(available)} USD`}.`}{' '}
            {effectiveCurrency === 'USD'
              ? tx('Sin conversión de moneda.', 'No currency conversion.')
              : tx(
                  'Conversión de referencia para fondos virtuales.',
                  'Reference conversion for virtual funds.',
                )}
          </p>

          {direction === 'deposit' && (
            <div className={styles.summaryBox} aria-live="polite">
              {effectiveCurrency !== 'USD' &&
                (ratesLoading ? (
                  <LoadingState
                    mode="compact"
                    label={tx('Consultando tasa…', 'Loading exchange rate…')}
                  />
                ) : ratesError || !rateUsable ? (
                  <div role="alert" className={styles.fxError}>
                    {tx(
                      'No hay una tasa reciente disponible.',
                      'No recent exchange rate available.',
                    )}{' '}
                    <button
                      type="button"
                      className={styles.btnCompact}
                      onClick={() => {
                        setRatesLoading(true);
                        setRatesError(false);
                        setRateRetry((value) => value + 1);
                      }}
                    >
                      {tx('Reintentar', 'Retry')}
                    </button>
                  </div>
                ) : (
                  <p className={styles.fxRate}>
                    1 USD = {rate?.rate.toLocaleString(locale)} {currency} ·{' '}
                    {tx('Fecha de la tasa', 'Rate date')}:{' '}
                    {rate?.date
                      ? formatMarketDateTime(`${rate.date}T12:00:00Z`, locale, {
                          includeTime: false,
                          timeZone: 'UTC',
                        })
                      : '—'}{' '}
                    ·{' '}
                    <a
                      className={styles.fxSource}
                      href="https://frankfurter.dev"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Frankfurter
                    </a>
                  </p>
                ))}
              <strong className={styles.fxTotal}>
                {tx(
                  'Monto a depositar en tu cuenta',
                  'Amount to deposit in your account',
                )}
                :{' '}
                {usdAmount
                  ? formatUsdAmount(usdAmount, { withCode: true })
                  : '—'}
              </strong>
              <small className={styles.fxCaption}>
                {tx(
                  'Redondeado a dos decimales. Confirma este equivalente antes de enviar.',
                  'Rounded to two decimals. Confirm this equivalent before submitting.',
                )}
              </small>
            </div>
          )}
          <div className={styles.actionsRow}>
            <button
              className={styles.btnPrimary}
              type="submit"
              disabled={
                !bankId ||
                (effectiveCurrency !== 'USD' &&
                  (ratesLoading || ratesError || !rateUsable))
              }
            >
              {busy
                ? tx('Procesando…', 'Processing…')
                : direction === 'deposit'
                  ? tx('Confirmar depósito de prueba', 'Confirm test deposit')
                  : tx('Confirmar retiro de prueba', 'Confirm test withdrawal')}
            </button>
          </div>
        </fieldset>
      </form>

      {displayedError && (
        <div role="alert" className={styles.fundingError}>
          <Icon name="shield" size={20} />
          <div>
            <strong>{tx('Revisa la solicitud', 'Check your request')}</strong>
            <p>{displayedError}</p>
          </div>
        </div>
      )}
      {notice && (
        <p role="status" className={styles.alertSuccess}>
          {notice}
        </p>
      )}
    </section>
  );
}
