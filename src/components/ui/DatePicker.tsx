'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n';
import { Icon } from './Icon';
import styles from './date-picker.module.css';

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Calendar dates stay as YYYY-MM-DD; no conversion to a market time zone. */
export function DatePicker({
  id,
  value,
  onChange,
  label,
  min,
  max,
  disabled = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  min?: string | undefined;
  max?: string | undefined;
  disabled?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? `date-${generatedId}`;
  const { intl, tx } = useLocale();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    (value || new Date().toISOString().slice(0, 10)).slice(0, 7),
  );
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const calendar = useRef<HTMLDivElement>(null);
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const monthIndex = monthNumber - 1;
  const offset = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const dateFormatter = new Intl.DateTimeFormat(intl, {
    timeZone: 'UTC',
    dateStyle: 'medium',
  });
  const allowed = (date: string) =>
    (!min || date >= min) && (!max || date <= max);

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function select(date: string) {
    onChange(date);
    close();
  }
  function moveMonth(delta: number) {
    const next = new Date(Date.UTC(year, monthIndex + delta, 1));
    setMonth(isoDate(next.getUTCFullYear(), next.getUTCMonth(), 1).slice(0, 7));
  }
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    const selected = calendar.current?.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    const firstAvailable = calendar.current?.querySelector<HTMLButtonElement>(
      '[data-day]:not(:disabled)',
    );
    (selected ?? firstAvailable)?.focus({ preventScroll: true });
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  return (
    <div
      ref={wrapper}
      className={styles.wrapper}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <input
        id={inputId}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        tabIndex={-1}
        aria-label={label}
        aria-hidden="true"
        className={styles.nativeValue}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        className={styles.trigger}
        aria-label={`${tx('Elegir fecha', 'Choose date')}: ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${inputId}-calendar` : undefined}
        onClick={() => {
          if (!open)
            setMonth(
              (value || new Date().toISOString().slice(0, 10)).slice(0, 7),
            );
          setOpen(!open);
        }}
      >
        <span>
          {value
            ? dateFormatter.format(new Date(`${value}T00:00:00Z`))
            : tx('Selecciona fecha', 'Select date')}
        </span>
        <Icon name="calendar" size={17} />
      </button>
      {open && (
        <div
          ref={calendar}
          id={`${inputId}-calendar`}
          role="dialog"
          aria-label={`${tx('Calendario', 'Calendar')}: ${label}`}
          className={styles.calendar}
        >
          <div className={styles.heading}>
            <button
              type="button"
              aria-label={tx('Mes anterior', 'Previous month')}
              onClick={() => moveMonth(-1)}
            >
              ‹
            </button>
            <strong aria-live="polite">
              {new Intl.DateTimeFormat(intl, {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              }).format(new Date(Date.UTC(year, monthIndex, 1)))}
            </strong>
            <button
              type="button"
              aria-label={tx('Mes siguiente', 'Next month')}
              onClick={() => moveMonth(1)}
            >
              ›
            </button>
          </div>
          <div className={styles.days}>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={`weekday-${i}`} className={styles.weekday}>
                {new Intl.DateTimeFormat(intl, {
                  weekday: 'short',
                  timeZone: 'UTC',
                }).format(new Date(Date.UTC(2024, 0, 1 + i)))}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = isoDate(year, monthIndex, i + 1);
              return (
                <button
                  key={date}
                  type="button"
                  data-day
                  aria-label={dateFormatter.format(
                    new Date(`${date}T00:00:00Z`),
                  )}
                  aria-pressed={date === value}
                  disabled={!allowed(date)}
                  onClick={() => select(date)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className={styles.footer}>
            <button type="button" onClick={() => select('')}>
              {tx('Limpiar', 'Clear')}
            </button>
            <button type="button" onClick={close}>
              {tx('Cerrar', 'Close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
