'use client';

import { useEffect, useRef, useState } from 'react';
import { useViewportPopover } from '@/components/ui/use-viewport-popover';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import {
  formatSpanishDate,
  getDaysInMonth,
  getFirstWeekdayMondayStart,
  MONTHS_EN,
  MONTHS_ES,
  validateBirthDateAge,
  WEEKDAYS_EN,
  WEEKDAYS_ES,
} from '../kyc-catalog';
import styles from '../registration.module.css';
import { CustomSelect } from './CustomSelect';

export interface BirthDatePickerProps {
  value: string;
  onChange: (nextDob: string) => void;
}

export function BirthDatePicker({ value, onChange }: BirthDatePickerProps) {
  const { locale, tx } = useLocale();
  const monthOptions = (locale === 'en' ? MONTHS_EN : MONTHS_ES).map(
    (m, idx) => ({
      value: String(idx),
      label: m,
    }),
  );
  const weekdays = locale === 'en' ? WEEKDAYS_EN : WEEKDAYS_ES;
  const currentYear = new Date().getFullYear();
  const maxAdultYear = currentYear - 18;
  const minAdultYear = currentYear - 100;

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(maxAdultYear - 4);
  const [viewMonth, setViewMonth] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const popupRef = useRef<HTMLDivElement>(null);
  useViewportPopover(calendarOpen, triggerRef, popupRef);

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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        setCalendarOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
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
        {tx('Fecha de nacimiento', 'Date of birth')}
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
          placeholder={tx('AAAA-MM-DD', 'YYYY-MM-DD')}
          className={styles.srOnly}
          tabIndex={-1}
          required
        />
        <button
          ref={triggerRef}
          type="button"
          className={`${styles.customDateTrigger} ${
            calendarOpen ? styles.customDateTriggerOpen : ''
          }`}
          onClick={() => setCalendarOpen((prev) => !prev)}
          aria-expanded={calendarOpen}
          aria-haspopup="dialog"
          aria-controls="birth-calendar"
        >
          <span
            className={
              value ? styles.customDateValue : styles.customDatePlaceholder
            }
          >
            {value
              ? formatSpanishDate(value, locale)
              : tx('Selecciona fecha (+18 años)', 'Select date (+18 years)')}
          </span>
          <span className={styles.customDateIcon} aria-hidden="true">
            <Icon name="calendar" size={16} />
          </span>
        </button>

        {calendarOpen ? (
          <div
            ref={popupRef}
            id="birth-calendar"
            className={styles.customCalendarPopover}
            role="dialog"
            aria-label={tx(
              'Calendario selector de nacimiento',
              'Birth calendar picker',
            )}
          >
            <div className={styles.customCalendarHeader}>
              <CustomSelect
                id="calendar_month_select"
                name="calendar_month"
                options={monthOptions}
                value={String(viewMonth)}
                onChange={(next) => setViewMonth(Number(next))}
                compact
                searchable={false}
                ariaLabel={tx('Mes de nacimiento', 'Birth month')}
              />
              <CustomSelect
                id="calendar_year_select"
                name="calendar_year"
                options={yearOptions}
                value={String(viewYear)}
                onChange={(next) => setViewYear(Number(next))}
                compact
                searchable
                ariaLabel={tx('Año de nacimiento', 'Birth year')}
              />
            </div>

            <div className={styles.customCalendarWeekdays}>
              {weekdays.map((wd) => (
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
              <span>
                {tx(
                  'Requisito legal: Mayor de 18 años',
                  'Legal requirement: Age 18+',
                )}
              </span>
              {value ? (
                <button
                  type="button"
                  className={styles.customCalendarClearBtn}
                  onClick={() => onChange('')}
                >
                  {tx('Limpiar', 'Clear')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
