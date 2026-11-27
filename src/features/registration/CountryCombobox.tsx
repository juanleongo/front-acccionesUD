'use client';
import Image from 'next/image';
import { useState } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useLocale } from '@/lib/i18n';
import styles from './registration.module.css';

interface Country {
  code: string;
  name: string;
}

interface CountryComboboxProps {
  countries: Country[];
  onCountryChange?: (code: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
}

export function CountryCombobox({
  countries,
  onCountryChange,
  defaultValue = '',
  disabled = false,
  id = 'country-combobox-input',
}: CountryComboboxProps) {
  const { tx } = useLocale();
  const [selectedCode, setSelectedCode] = useState(defaultValue);
  return (
    <CustomSelect
      id={id}
      name="country"
      className={styles.comboboxContainer ?? ''}
      ariaLabel={tx('País', 'Country')}
      value={selectedCode}
      disabled={disabled}
      required
      searchable
      placeholder={tx('Selecciona tu país', 'Select your country')}
      searchPlaceholder={tx('Buscar país o código…', 'Search country or code…')}
      options={countries.map((country) => ({
        value: country.code,
        label: country.name,
        leading: (
          <Image
            key={country.code}
            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
            width={24}
            height={16}
            alt=""
            unoptimized
            loading="lazy"
            className={styles.countryFlag}
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden';
            }}
          />
        ),
      }))}
      onChange={(code) => {
        setSelectedCode(code);
        onCountryChange?.(code);
      }}
    />
  );
}
