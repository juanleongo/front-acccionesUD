'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  createBank,
  fetchBanks,
  requestTransfer,
  type BankRelationship,
} from './wallet-api';
import styles from './wallet.module.css';

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
  const [method, setMethod] = useState('PSE / Transferencia Colombia');
  const [banks, setBanks] = useState<BankRelationship[]>([]);
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
    const result = await fetchBanks();
    setBanks(result);
    setBankId((current) =>
      result.some((bank) => bank.id === current && bank.status === 'APPROVED')
        ? current
        : (result.find((bank) => bank.status === 'APPROVED')?.id ?? ''),
    );
  }
  useEffect(() => {
    let active = true;
    fetchBanks()
      .then((result) => {
        if (!active) return;
        setBanks(result);
        setBankId(result.find((bank) => bank.status === 'APPROVED')?.id ?? '');
      })
      .catch(() => {
        if (active)
          setError(
            'No se pudieron consultar las cuentas bancarias. Verifica tu sesión y el estado de tu cuenta KYC.',
          );
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
        `Solicitud registrada. Estado: ${transfer.status}. Referencia: ${transfer.alpaca_transfer_id}.`,
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
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const bank = await createBank({
        account_owner_name: owner.trim(),
        bank_account_type: accountType,
        bank_account_number: account,
        bank_routing_number: routing,
      });
      setNotice(
        `Cuenta vinculada. Estado: ${bank.status}. Actualiza las cuentas para consultar su aprobación.`,
      );
      setAccount('');
      setRouting('');
      await loadBanks();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'No se pudo vincular la cuenta.',
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section className={styles.card} aria-label="Depósitos y retiros">
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
      <h2 className={styles.cardTitle}>
        {direction === 'deposit'
          ? 'Selecciona tu método de depósito'
          : 'Retirar a tu cuenta bancaria'}
      </h2>
      <p className={styles.cardSubtitle}>
        Simulación con fondos de prueba. Los tres métodos usan la misma cuenta
        KYC y transferencia ACH en USD. No se realizan cargos PSE ni a tarjetas.
      </p>
      {direction === 'deposit' && (
        <div className={styles.paymentMethods}>
          {(
            [
              'PSE / Transferencia Colombia',
              'Tarjeta débito / crédito',
              'Transferencia internacional',
            ] as const
          ).map((label, index) => (
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
      <form onSubmit={submit} className={styles.fundingForm}>
        <fieldset disabled={busy} className={styles.fundingFields}>
          <div className={styles.fieldGroup}>
            <label htmlFor="funding-bank" className={styles.fieldLabel}>
              Cuenta bancaria vinculada
            </label>
            <select
              id="funding-bank"
              className={styles.select}
              value={bankId}
              onChange={(event) => setBankId(event.target.value)}
              required
            >
              <option value="">Selecciona una cuenta aprobada</option>
              {banks.map((bank) => (
                <option
                  key={bank.id}
                  value={bank.id}
                  disabled={bank.status !== 'APPROVED'}
                >
                  {bank.owner_name} · ****{bank.account_last4} · {bank.status}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => {
              void loadBanks().catch(() =>
                setError('No se pudieron actualizar las cuentas.'),
              );
            }}
          >
            Actualizar cuentas
          </button>
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
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <p className={styles.cardSubtitle}>
            {direction === 'deposit'
              ? `Método seleccionado: ${method}.`
              : `Saldo retirable: ${available === null ? 'No disponible' : `$${available.toFixed(2)} USD`}.`}{' '}
            Sin conversión de moneda.
          </p>
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
        </fieldset>
      </form>
      <details className={styles.summaryBox}>
        <summary>Vincular cuenta bancaria de prueba</summary>
        <p className={styles.cardSubtitle}>
          La cuenta KYC debe estar activa. Usa datos bancarios de sandbox.
        </p>
        <form onSubmit={linkBank}>
          <fieldset disabled={busy} className={styles.fundingFields}>
            <label className={styles.fieldGroup}>
              Nombre del titular
              <input
                className={styles.input}
                required
                maxLength={200}
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
              />
            </label>
            <label className={styles.fieldGroup}>
              Tipo de cuenta
              <select
                className={styles.select}
                value={accountType}
                onChange={(event) =>
                  setAccountType(event.target.value as 'CHECKING' | 'SAVINGS')
                }
              >
                <option value="CHECKING">Corriente</option>
                <option value="SAVINGS">Ahorros</option>
              </select>
            </label>
            <label className={styles.fieldGroup}>
              Número de cuenta
              <input
                className={styles.input}
                required
                pattern="[0-9]{4,17}"
                inputMode="numeric"
                autoComplete="off"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
              />
            </label>
            <label className={styles.fieldGroup}>
              Routing number (9 dígitos)
              <input
                className={styles.input}
                required
                pattern="[0-9]{9}"
                inputMode="numeric"
                autoComplete="off"
                value={routing}
                onChange={(event) => setRouting(event.target.value)}
              />
            </label>
            <button className={styles.btnSecondary} type="submit">
              Vincular cuenta de prueba
            </button>
          </fieldset>
        </form>
      </details>
      {error && (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={styles.cardSubtitle}>
          {notice}
        </p>
      )}
    </section>
  );
}
