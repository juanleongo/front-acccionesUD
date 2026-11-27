'use client';

import {
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocale } from '@/lib/i18n';
import styles from './custom-select.module.css';

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  hint?: string;
  leading?: ReactNode;
}

export interface CustomSelectProps {
  id?: string;
  name?: string;
  options: readonly CustomSelectOption[];
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  ariaLabel?: string;
  describedBy?: string;
  align?: 'left' | 'right';
  className?: string;
}

export function CustomSelect({
  id,
  name,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  compact = false,
  searchable = false,
  searchPlaceholder,
  emptyText,
  ariaLabel,
  describedBy,
  align = 'left',
  className,
}: CustomSelectProps) {
  const { tx } = useLocale();
  const effectivePlaceholder =
    placeholder ?? tx('Selecciona una opción', 'Select an option');
  const effectiveSearchPlaceholder =
    searchPlaceholder ?? tx('Buscar…', 'Search…');
  const effectiveEmptyText = emptyText ?? tx('Sin coincidencias', 'No matches');
  const generatedId = useId();
  const selectId = id ?? `custom-select-${generatedId}`;
  const listboxId = `${selectId}-listbox`;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  if (disabled && open) setOpen(false);

  useLayoutEffect(() => {
    if (!open) return;
    function positionMenu() {
      const menu = menuRef.current;
      const trigger = triggerRef.current;
      if (!menu || !trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const bottom =
        (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight);
      const header = document.querySelector('header');
      const top = Math.max(
        8,
        Math.min(header?.getBoundingClientRect().bottom ?? 8, bottom - 80),
      );
      const below = bottom - rect.bottom - 12;
      const above = rect.top - top - 12;
      const flip = below < 240 && above > below;
      const left = (viewport?.offsetLeft ?? 0) + 8;
      const width = Math.min(
        rect.width,
        (viewport?.width ?? window.innerWidth) - 16,
      );
      menu.style.width = `${width}px`;
      menu.style.left = `${Math.max(left, Math.min(rect.left, left + (viewport?.width ?? window.innerWidth) - 16 - width))}px`;
      menu.style.right = 'auto';
      menu.style.bottom = 'auto';
      menu.style.maxHeight = `${Math.max(32, Math.min(352, bottom - top - 16, flip ? above : below))}px`;
      menu.style.top = `${Math.max(top, Math.min(flip ? rect.top - menu.getBoundingClientRect().height - 6 : rect.bottom + 6, bottom - menu.getBoundingClientRect().height - 8))}px`;
    }
    positionMenu();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(positionMenu);
    if (menuRef.current) observer?.observe(menuRef.current);
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    window.visualViewport?.addEventListener('resize', positionMenu);
    window.visualViewport?.addEventListener('scroll', positionMenu);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
      window.visualViewport?.removeEventListener('resize', positionMenu);
      window.visualViewport?.removeEventListener('scroll', positionMenu);
    };
  }, [open]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.hint ? opt.hint.toLowerCase().includes(q) : false),
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        setSearch('');
        triggerRef.current?.focus();
      }
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      const timer = window.setTimeout(() => {
        searchRef.current?.focus();
      }, 10);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open, searchable]);

  function handleSelectOption(opt: CustomSelectOption) {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    setSearch('');
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      }
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={className ? `${styles.wrapper} ${className}` : styles.wrapper}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          setSearch('');
          triggerRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <select
        id={selectId}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden={open || undefined}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        className={styles.srOnlySelect}
        onChange={(e) => onChange(e.target.value)}
      >
        {!options.some((opt) => opt.value === '') && (
          <option value="" disabled={required}>
            {effectivePlaceholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onKeyDown={handleTriggerKeyDown}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={`${styles.trigger} ${
          compact ? styles.triggerCompact : ''
        } ${open ? styles.triggerOpen : ''}`}
      >
        {selectedOption?.leading && (
          <span className={styles.leading} aria-hidden="true">
            {selectedOption.leading}
          </span>
        )}
        <span
          className={
            selectedOption
              ? styles.value
              : `${styles.value} ${styles.placeholder}`
          }
        >
          {selectedOption ? selectedOption.label : effectivePlaceholder}
        </span>
        <span
          className={
            open ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron
          }
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className={
            align === 'right'
              ? `${styles.menu} ${styles.menuAlignRight}`
              : styles.menu
          }
        >
          {(searchable || options.length > 8) && (
            <div className={styles.searchBox}>
              <input
                ref={searchRef}
                type="search"
                className={styles.searchInput}
                value={search}
                placeholder={effectiveSearchPlaceholder}
                aria-label={effectiveSearchPlaceholder}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel ?? effectivePlaceholder}
              className={styles.emptyState}
            >
              <span role="option" aria-disabled="true" aria-selected="false">
                {effectiveEmptyText}
              </span>
            </div>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel ?? effectivePlaceholder}
              className={styles.list}
            >
              {filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value} className={styles.optionItem}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => handleSelectOption(opt)}
                      className={
                        isSelected
                          ? `${styles.option} ${styles.optionActive}`
                          : styles.option
                      }
                    >
                      {opt.leading && (
                        <span className={styles.leading} aria-hidden="true">
                          {opt.leading}
                        </span>
                      )}
                      <span className={styles.optionTextWrap}>
                        <span className={styles.optionLabel}>{opt.label}</span>
                        {opt.hint && (
                          <span className={styles.optionHint}>{opt.hint}</span>
                        )}
                      </span>
                      {isSelected && (
                        <span className={styles.optionCheck} aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
