'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '../registration.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  id: string;
  name: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  compact?: boolean;
  searchable?: boolean;
  ariaLabel?: string;
}

export function CustomSelect({
  id,
  name,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  compact = false,
  searchable,
  ariaLabel,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value);
  const showSearch = searchable ?? options.length > 7;
  const filteredOptions = showSearch
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  return (
    <div className={styles.customSelectWrapper} ref={wrapperRef}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className={styles.hiddenNativeSelect}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${styles.customSelectTrigger} ${
          compact ? styles.customSelectTriggerCompact : ''
        } ${open ? styles.customSelectTriggerOpen : ''}`}
        onClick={() => {
          setOpen((prev) => !prev);
          setSearch('');
        }}
        aria-expanded={open}
      >
        <span
          className={
            selectedOption
              ? styles.customSelectValue
              : styles.customSelectPlaceholder
          }
        >
          {selectedOption
            ? selectedOption.label
            : (placeholder ?? 'Seleccionar')}
        </span>
        <span
          className={`${styles.customSelectChevron} ${
            open ? styles.chevronOpen : ''
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {open ? (
        <div className={styles.customSelectMenu}>
          {showSearch ? (
            <div className={styles.customSelectSearchBox}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className={styles.customSelectSearchInput}
                autoFocus
              />
            </div>
          ) : null}
          <ul className={styles.customSelectList} role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.customSelectOption} ${
                      isSelected ? styles.customSelectOptionActive : ''
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected ? (
                      <span className={styles.countryCheck} aria-hidden="true">
                        ✓
                      </span>
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className={styles.comboboxEmpty}>
                No se encontraron coincidencias
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
