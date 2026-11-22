'use client';

import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import styles from './language-toggle.module.css';

export function LanguageToggle({
  className,
  size = 16,
}: {
  className?: string | undefined;
  size?: number | undefined;
}) {
  const { locale, toggleLocale, tx } = useLocale();
  const nextLabel = locale === 'es' ? 'English (EN)' : 'Español (ES)';
  const currentCode = locale.toUpperCase();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={className ? className : styles.languageButton}
      aria-label={tx('Cambiar idioma a inglés', 'Switch language to Spanish')}
      title={tx(
        `Idioma actual: Español · Cambiar a ${nextLabel}`,
        `Current language: English · Switch to ${nextLabel}`,
      )}
    >
      <Icon name="globe" size={size} />
      <span>{currentCode}</span>
    </button>
  );
}
