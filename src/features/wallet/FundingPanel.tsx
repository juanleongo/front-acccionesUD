'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { ApiError } from '@/lib/api';
import { formatPersonName } from '@/lib/format-person-name';
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
  'PSE / Transferencia Colombia',
  'Tarjeta débito / crédito',
  'Transferencia internacional',
] as const;

export function FundingPanel({
  onRefresh,
  available,
}: {
  onRefresh: () => Promise<void>;
  available: number | null;
}) {
  const [direction, setDirection] = useState<'deposit' | 'withdrawal'>(
    'deposit',
  );
  const [method, setMethod] = useState<string>(DEPOSIT_METHODS[0]);
  const [banks, setBanks] = useState<BankRelationship[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const approvedBanks = banks.filter((bank) => bank.status === 'APPROVED');
  const [bankId, setBankId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
        )
          setError(
            'No se pudieron consultar las cuentas bancarias. Verifica tu sesión y el estado de tu verificación de identidad.',
          );
      })
      .finally(() => {
        if (active) setLoadingBanks(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    setError('');
    setNotice('');
    if (
      !/^\d+(\.\d{1,2})?$/.test(amount) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 1
    ) {
      setError('Ingresa un monto de al menos 1 USD con máximo dos decimales.');
      return;
    }
    if (
      !banks.some((bank) => bank.id === bankId && bank.status === 'APPROVED')
    ) {
      setError('Selecciona una cuenta bancaria aprobada.');
      return;
    }
    if (
      direction === 'withdrawal' &&
      (available === null || Number(amount) > available)
    ) {
      setError(
        'El monto supera el saldo retirable o el saldo todavía no está disponible.',
      );
      return;
    }
    const normalized = Number(amount).toFixed(2);
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
        `Solicitud registrada correctamente. Estado: ${formatTransferStatus(transfer.status)} (${transfer.status}).`,
      );
      setAmount('');
      attempt.current = null;
      await onRefresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'No se pudo confirmar la operación.',
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function linkBank(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    setError('');
    const normalizedOwner = formatPersonName(owner);
    setOwner(normalizedOwner);
    if (!normalizedOwner) {
      setError(
        'Escribe el nombre completo del titular, tal como aparece en tu cuenta verificada.',
      );
      return;
    }
    if (!/^[0-9]{4,17}$/.test(account)) {
      setError(
        'El número de cuenta debe tener entre 4 y 17 dígitos, sin espacios ni guiones.',
      );
      return;
    }
    if (!/^[0-9]{9}$/.test(routing)) {
      setError(
        'El código bancario ACH (routing number) debe tener exactamente 9 dígitos.',
      );
      return;
    }
    if (!isValidAchRoutingNumber(routing)) {
      setError(
        'El código bancario no es un routing number ABA válido. Revisa los 9 dígitos con tu banco de prueba de Estados Unidos; no uses un código colombiano, PSE o SWIFT.',
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
        `Cuenta vinculada correctamente. Estado: ${formatBankStatus(bank.status)}. Actualiza las cuentas para consultar su aprobación.`,
      );
      setAccount('');
      setRouting('');
      await loadBanks();
    } catch (failure) {
      setError(formatBankLinkError(failure));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section className={styles.card} aria-label="Depósitos y retiros">
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>
            {direction === 'deposit'
              ? 'Selecciona tu método de depósito'
              : 'Retirar a tu cuenta bancaria'}
          </h2>
          <p className={styles.cardSubtitle}>
            Simulación con fondos de prueba en USD mediante transferencia ACH.
            No se realizan cargos reales a tarjetas ni PSE.
          </p>
        </div>

        <div className={styles.filterRow} aria-label="Tipo de operación">
          {(['deposit', 'withdrawal'] as const).map((value) => (
            <button
              key={value}
              type="button"
              disabled={busy}
              aria-pressed={direction === value}
              className={`${styles.filterPill} ${direction === value ? styles.filterPillActive : ''}`}
              onClick={() => {
                setDirection(value);
                setError('');
                setNotice('');
              }}
            >
              {value === 'deposit' ? 'Depositar fondos' : 'Retirar fondos'}
            </button>
          ))}
        </div>
      </div>

      {direction === 'deposit' && (
        <div className={styles.paymentMethods}>
          {DEPOSIT_METHODS.map((label, index) => (
            <button
              type="button"
              key={label}
              disabled={busy}
              aria-pressed={method === label}
              className={styles.paymentMethod}
              onClick={() => setMethod(label)}
            >
              <Icon
                name={index === 0 ? 'coin' : index === 1 ? 'wallet' : 'globe'}
              />
              <strong>{label}</strong>
              <span>Depósito simulado · USD</span>
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
        <LoadingState mode="compact" label="Consultando cuentas vinculadas…" />
      )}
      {!loadingBanks && approvedBanks.length === 0 && (
        <div className={styles.bankEmpty}>
          <Icon name="wallet" size={22} />
          <div>
            <strong>
              {banks.length
                ? 'Tu cuenta está pendiente de aprobación'
                : 'Primero vincula una cuenta bancaria'}
            </strong>
            <p>
              {banks.length
                ? 'Cuando esté aprobada podrás seleccionarla para depositar o retirar fondos.'
                : 'Completa el formulario de arriba para habilitar depósitos y retiros de prueba.'}
            </p>
          </div>
          <button
            type="button"
            className={styles.btnCompact}
            onClick={() => {
              void loadBanks().catch(() =>
                setError(
                  'No se pudieron actualizar las cuentas. Inténtalo de nuevo.',
                ),
              );
            }}
          >
            Actualizar cuentas
          </button>
        </div>
      )}
      <form onSubmit={submit} className={styles.fundingForm}>
        <fieldset
          disabled={busy || loadingBanks || approvedBanks.length === 0}
          className={styles.fundingFields}
        >
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="funding-bank" className={styles.fieldLabel}>
                Cuenta bancaria vinculada
              </label>
              <div className={styles.selectActionRow}>
                <select
                  id="funding-bank"
                  className={styles.select}
                  value={bankId}
                  onChange={(event) => setBankId(event.target.value)}
                  required
                >
                  <option value="">Selecciona una cuenta aprobada</option>
                  {approvedBanks.map((bank) => (
                    <option
                      key={bank.id}
                      value={bank.id}
                      disabled={bank.status !== 'APPROVED'}
                    >
                      {formatPersonName(bank.owner_name)} · ****
                      {bank.account_last4} · {formatBankStatus(bank.status)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.btnCompact}
                  onClick={() => {
                    void loadBanks().catch((failure: unknown) => {
                      if (!(
                        failure instanceof ApiError &&
                        failure.metadata.status === 401
                      )) {
                        setError('No se pudieron actualizar las cuentas.');
                      }
                    });
                  }}
                >
                  Actualizar cuentas
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="funding-amount" className={styles.fieldLabel}>
                Monto en USD
              </label>
              <input
                id="funding-amount"
                className={styles.input}
                type="number"
                min="1"
                step="0.01"
                placeholder="Ej. 100.00"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
          </div>

          <p className={styles.noteHelper}>
            {direction === 'deposit'
              ? `Método seleccionado: ${method}.`
              : `Saldo retirable: ${available === null ? 'No disponible' : `$${formatUsd(available)} USD`}.`}{' '}
            Sin conversión de moneda.
          </p>

          <div className={styles.actionsRow}>
            <button
              className={styles.btnPrimary}
              type="submit"
              disabled={!bankId}
            >
              {busy
                ? 'Procesando…'
                : direction === 'deposit'
                  ? 'Confirmar depósito de prueba'
                  : 'Confirmar retiro de prueba'}
            </button>
          </div>
        </fieldset>
      </form>

      {error && (
        <div role="alert" className={styles.fundingError}>
          <Icon name="shield" size={20} />
          <div>
            <strong>Revisa la solicitud</strong>
            <p>{error}</p>
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
