'use client';
import { useEffect, useId, useRef, useState } from 'react';
import styles from './registration.module.css';

interface Country {
  code: string;
  name: string;
}

interface CountryComboboxProps {
  countries: Country[];
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
}

export function CountryCombobox({
  countries,
  defaultValue = '',
  disabled = false,
  id = 'country-combobox-input',
}: CountryComboboxProps) {
  const [selectedCode, setSelectedCode] = useState(defaultValue);
  const [query, setQuery] = useState(() => {
    if (!defaultValue) return '';
    return countries.find((c) => c.code === defaultValue)?.name ?? '';
  });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        // Restaurar el texto del país seleccionado si el usuario no eligió
        const current = countries.find((c) => c.code === selectedCode);
        setQuery(current ? current.name : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCode, countries]);

  const filtered = query.trim()
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.code.toLowerCase().includes(query.toLowerCase()),
      )
    : countries;

  function selectCountry(c: Country) {
    setSelectedCode(c.code);
    setQuery(c.name);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className={styles.comboboxContainer} ref={containerRef}>
      {/* Select nativo accesible para sincronización con pruebas y formData */}
      <select
        name="country"
        aria-label="País"
        value={selectedCode}
        disabled={disabled}
        required
        tabIndex={-1}
        className={styles.hiddenNativeSelect}
        onChange={(e) => {
          const val = e.target.value;
          setSelectedCode(val);
          const match = countries.find((c) => c.code === val);
          if (match) setQuery(match.name);
        }}
      >
        <option value="" disabled>
          Selecciona tu país
        </option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Input de búsqueda visible */}
      <div className={styles.comboboxInputWrapper}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listboxId}
          placeholder="Escribe o selecciona tu país..."
          value={query}
          disabled={disabled}
          autoComplete="off"
          className={styles.comboboxInput}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            // Si borra el texto, resetear código
            if (!e.target.value.trim()) setSelectedCode('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
            } else if (e.key === 'ArrowDown' && !open) {
              setOpen(true);
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          className={styles.comboboxToggle}
          aria-label="Abrir listado de países"
          onClick={() => {
            setOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
        >
          <span className={open ? styles.chevronOpen : styles.chevronClosed}>
            ▼
          </span>
        </button>
      </div>

      {/* Menú desplegable acotado en altura */}
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className={styles.comboboxMenu}
          aria-label="Países disponibles"
        >
          {filtered.length === 0 ? (
            <li className={styles.comboboxEmpty}>
              No se encontraron países que coincidan con &ldquo;{query}&rdquo;
            </li>
          ) : (
            filtered.map((c) => {
              const isSelected = c.code === selectedCode;
              return (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.comboboxOption} ${isSelected ? styles.selectedOption : ''}`}
                  onClick={() => selectCountry(c)}
                >
                  <span className={styles.countryCode}>{c.code}</span>
                  <span className={styles.countryName}>{c.name}</span>
                  {isSelected && <span className={styles.countryCheck}>✓</span>}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
