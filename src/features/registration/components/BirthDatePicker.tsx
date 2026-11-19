'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  formatSpanishDate,
  getDaysInMonth,
  getFirstWeekdayMondayStart,
  MONTHS_ES,
  validateBirthDateAge,
  WEEKDAYS_ES,
} from '../kyc-catalog';
import styles from '../registration.module.css';
import { CustomSelect } from './CustomSelect';

export interface BirthDatePickerProps {
  value: string;
  onChange: (nextDob: string) => void;
}

const MONTH_OPTIONS = MONTHS_ES.map((m, idx) => ({
  value: String(idx),
  label: m,
}));

export function BirthDatePicker({ value, onChange }: BirthDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const maxAdultYear = currentYear - 18;
  const minAdultYear = currentYear - 100;

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(maxAdultYear - 4);
  const [viewMonth, setViewMonth] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarOpen) return;
    function handleOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [calendarOpen]);

  const yearOptions: { value: string; label: string }[] = [];
  for (let y = maxAdultYear; y >= minAdultYear; y -= 1) {
    yearOptions.push({ value: String(y), label: String(y) });
  }

  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekdayOffset = getFirstWeekdayMondayStart(viewYear, viewMonth);

  function selectCalendarDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setCalendarOpen(false);
  }

  return (
    <div className={styles.field} ref={calendarRef}>
      <label className={styles.fieldLabel} htmlFor="kyc_dob">
        Fecha de nacimiento
      </label>
      <div className={styles.customDateWrapper}>
        <input
          id="kyc_dob"
          type="text"
          name="date_of_birth"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
            if (match) {
              setViewYear(Number(match[1]));
              setViewMonth(Number(match[2]) - 1);
            }
          }}
          placeholder="AAAA-MM-DD"
          className={styles.srOnly}
          tabIndex={-1}
          required
        />
        <button
          type="button"
          className={`${styles.customDateTrigger} ${
            calendarOpen ? styles.customDateTriggerOpen : ''
          }`}
          onClick={() => setCalendarOpen((prev) => !prev)}
          aria-expanded={calendarOpen}
        >
          <span
            className={
              value ? styles.customDateValue : styles.customDatePlaceholder
            }
          >
            {value ? formatSpanishDate(value) : 'Selecciona fecha (+18 años)'}
          </span>
          <span className={styles.customDateIcon} aria-hidden="true">
            <Icon name="calendar" size={16} />
          </span>
        </button>

        {calendarOpen ? (
          <div
            className={styles.customCalendarPopover}
            role="dialog"
            aria-label="Selector de fecha de nacimiento"
          >
            <div className={styles.customCalendarHeader}>
              <CustomSelect
                id="calendar_month_select"
                name="calendar_month"
                options={MONTH_OPTIONS}
                value={String(viewMonth)}
                onChange={(next) => setViewMonth(Number(next))}
                compact
                searchable={false}
                ariaLabel="Mes de nacimiento"
              />
              <CustomSelect
                id="calendar_year_select"
                name="calendar_year"
                options={yearOptions}
                value={String(viewYear)}
                onChange={(next) => setViewYear(Number(next))}
                compact
                searchable
                ariaLabel="Año de nacimiento"
              />
            </div>

            <div className={styles.customCalendarWeekdays}>
              {WEEKDAYS_ES.map((wd) => (
                <span key={wd} className={styles.customCalendarWeekday}>
                  {wd}
                </span>
              ))}
            </div>

            <div className={styles.customCalendarDays}>
              {Array.from({ length: firstWeekdayOffset }).map((_, i) => (
                <span
                  key={`empty-${i}`}
                  className={styles.customCalendarDayEmpty}
                />
              ))}
              {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isoCandidate = `${viewYear}-${String(
                  viewMonth + 1,
                ).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = value === isoCandidate;
                const isUnderage = validateBirthDateAge(isoCandidate) !== null;
                return (
                  <button
                    key={dayNum}
                    type="button"
                    disabled={isUnderage}
                    className={`${styles.customCalendarDayBtn} ${
                      isSelected ? styles.customCalendarDaySelected : ''
                    }`}
                    onClick={() => selectCalendarDay(dayNum)}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            <div className={styles.customCalendarFooter}>
              <span>Requisito legal: Mayor de 18 años</span>
              {value ? (
                <button
                  type="button"
                  className={styles.customCalendarClearBtn}
                  onClick={() => onChange('')}
                >
                  Limpiar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
