'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import landing from '../landing.module.css';
import styles from '../device-showcase.module.css';

function WorkspacePreview({ compact = false }: { compact?: boolean }) {
  const { tx } = useLocale();
  return (
    <div className={styles.preview}>
      <div className={styles.previewBar}>
        <Image src="/logo-acciones-ud.png" alt="" width={23} height={23} />
        <strong>Acciones UD</strong>
        <Icon name="menu" size={14} />
      </div>
      <div className={styles.previewBody}>
        {!compact && (
          <div className={styles.previewNav}>
            <Icon name="grid" size={15} />
            <Icon name="trend" size={15} />
            <Icon name="pie" size={15} />
            <Icon name="wallet" size={15} />
          </div>
        )}
        <div className={styles.previewContent}>
          <span className={styles.previewEyebrow}>
            {tx('Tu espacio de inversión', 'Your investing workspace')}
          </span>
          <strong className={styles.previewTitle}>
            {tx('Explora. Aprende. Practica.', 'Explore. Learn. Practice.')}
          </strong>
          <div className={styles.previewCompanies}>
            {['AAPL', 'NVDA', 'TSLA'].map((symbol, index) => (
              <span key={symbol}>
                <Image
                  src={`/brands/${['apple.svg', 'nvidia.svg', 'tesla.svg'][index]}`}
                  alt=""
                  width={18}
                  height={18}
                />
                {symbol}
              </span>
            ))}
          </div>
          <div className={styles.previewChart} aria-hidden="true">
            <svg viewBox="0 0 400 145" preserveAspectRatio="none">
              <path d="M0 118L25 109L48 116L72 91L96 100L122 76L151 85L177 55L206 67L229 36L253 49L280 21L309 38L334 17L362 25L400 6" />
            </svg>
          </div>
          <div className={styles.previewBlocks}>
            <span>
              <Icon name="pie" size={17} />
              {tx('Portafolio', 'Portfolio')}
            </span>
            <span>
              <Icon name="shield" size={17} />
              {tx('Acceso seguro', 'Secure access')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeviceShowcase() {
  const { tx } = useLocale();
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'phone'>(
    'desktop',
  );
  return (
    <section
      id="dispositivos"
      className={`${landing.container} ${styles.section}`}
      aria-labelledby="devices-title"
    >
      <div className={styles.intro}>
        <p className={landing.eyebrow}>
          {tx('Tu pantalla. Tu momento.', 'Your screen. Your moment.')}
        </p>
        <h2 id="devices-title">
          {tx('El mismo espacio.', 'The same workspace.')}
          <br />
          <span>{tx('Donde tú estés.', 'Wherever you are.')}</span>
        </h2>
        <p>
          {tx(
            'Una experiencia que se adapta a ti. Consulta acciones desde el móvil, analiza en tu tablet y organiza tu portafolio desde el computador.',
            'An experience that adapts to you. Explore stocks on your phone, analyze on your tablet and organize your portfolio on your computer.',
          )}
        </p>
        <div
          className={styles.deviceOptions}
          role="group"
          aria-label={tx('Vista por dispositivo', 'Device preview')}
        >
          {(
            [
              { value: 'desktop', es: 'Computador', en: 'Computer' },
              { value: 'tablet', es: 'Tablet', en: 'Tablet' },
              { value: 'phone', es: 'Móvil', en: 'Phone' },
            ] as const
          ).map((option) => (
            <button
              type="button"
              key={option.value}
              aria-pressed={device === option.value}
              onClick={() => setDevice(option.value)}
            >
              {tx(option.es, option.en)}
            </button>
          ))}
        </div>
        <Link href="/registro" className={landing.primaryButton}>
          {tx('Empieza desde tu dispositivo', 'Start on your device')}
          <Icon name="arrow" size={18} />
        </Link>
      </div>
      <figure
        className={styles.deviceFigure}
        data-device={device}
        aria-label={tx(
          'Vista ilustrativa de Acciones UD en computador, tablet y móvil',
          'Illustration of Acciones UD on a computer, tablet and phone',
        )}
      >
        <div className={styles.stage} aria-hidden="true">
          <div className={styles.laptop}>
            <div className={styles.laptopScreen}>
              <WorkspacePreview />
            </div>
            <div className={styles.laptopBase} />
          </div>
          <div className={styles.tablet}>
            <WorkspacePreview />
          </div>
          <div className={styles.phone}>
            <div className={styles.notch} />
            <WorkspacePreview compact />
          </div>
        </div>
        <figcaption>
          {tx('Vista ilustrativa de la plataforma', 'Platform illustration')}
        </figcaption>
      </figure>
    </section>
  );
}
