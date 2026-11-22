'use client';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import { marketInterestsCatalog } from '../contract';
import styles from '../registration.module.css';

const SECTOR_ICONS: IconName[] = [
  'devices',
  'trend',
  'coin',
  'bolt',
  'wallet',
  'globe',
  'shield',
  'pie',
  'grid',
  'star',
];

const INTEREST_LABELS_EN: Record<string, { title: string; subtitle: string }> =
  {
    'Tecnología & Semiconductores': {
      title: 'Tech & Semiconductors',
      subtitle: 'NASDAQ: Apple, NVIDIA, Microsoft',
    },
    'Mercados Tradicionales (NYSE & S&P 500)': {
      title: 'Traditional U.S. Markets',
      subtitle: 'NYSE, S&P 500 & Dow Jones',
    },
    'Materias Primas: Oro & Metales': {
      title: 'Commodities: Gold & Metals',
      subtitle: 'Gold, Silver & Precious Metals (GLD, NEM)',
    },
    'Energía, Petróleo & Gas Natural': {
      title: 'Energy, Oil & Natural Gas',
      subtitle: 'U.S. Energy Leaders (ExxonMobil, Chevron)',
    },
    'Sector Financiero & Banca USA': {
      title: 'U.S. Financials & Banking',
      subtitle: 'Banking & Payments (JPMorgan, Visa, Goldman Sachs)',
    },
    'Inteligencia Artificial & Cloud': {
      title: 'Artificial Intelligence & Cloud',
      subtitle: 'AI Infrastructure, Cloud & Cybersecurity',
    },
    'Salud & Biotecnología': {
      title: 'Healthcare & Biotech',
      subtitle: 'Pharma & Biotech (Eli Lilly, Pfizer, UNH)',
    },
    'ETFs & Fondos Indexados USA': {
      title: 'U.S. ETFs & Index Funds',
      subtitle: 'Exchange-Traded Funds (SPY, QQQ, DIA, IWM)',
    },
    'Consumo Masivo & Retail': {
      title: 'Consumer & Retail',
      subtitle: 'Consumer Staples & E-Commerce (Amazon, Walmart, Coca-Cola)',
    },
    'Bienes Raíces (REITs) & Dividendos': {
      title: 'Real Estate (REITs) & Dividends',
      subtitle: 'REITs & USD Dividend Stocks',
    },
  };

function splitSectorLabel(
  item: { value: string; label: string },
  locale: string,
) {
  if (locale === 'en') {
    const en = INTEREST_LABELS_EN[item.value];
    if (en) return en;
  }
  const match = /\(([^)]+)\)\s*$/.exec(item.label);
  return {
    title: item.value,
    subtitle: match?.[1] ?? item.label,
  };
}

export interface PreferencesStepFieldsProps {
  hidden: boolean;
  disabled: boolean;
  investorLevel: string;
  selectedInterests: string[];
  onChangeInvestorLevel: (nextLevel: string) => void;
  onToggleInterest: (interest: string) => void;
  onRemoveInterest: (interest: string) => void;
}

export function PreferencesStepFields({
  hidden,
  disabled,
  investorLevel,
  selectedInterests,
  onChangeInvestorLevel,
  onToggleInterest,
  onRemoveInterest,
}: PreferencesStepFieldsProps) {
  const { locale, tx } = useLocale();
  return (
    <fieldset hidden={hidden} disabled={disabled}>
      <legend>
        <Icon name="trend" size={18} />{' '}
        {tx(
          'Preferencias e intereses en mercados de EE. UU.',
          'U.S. Market Preferences & Interests',
        )}
      </legend>
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label
            className={styles.sectionBlockTitle}
            htmlFor="investor_level_select"
          >
            {tx(
              '1. Nivel de experiencia (opcional)',
              '1. Experience level (optional)',
            )}
          </label>
          <select
            id="investor_level_select"
            name="investor_level"
            value={investorLevel}
            onChange={(e) => onChangeInvestorLevel(e.target.value)}
            tabIndex={-1}
            className={styles.hiddenNativeSelect}
          >
            <option value="">{tx('Sin especificar', 'Unspecified')}</option>
            <option value="beginner">{tx('Principiante', 'Beginner')}</option>
            <option value="experienced">
              {tx('Con experiencia', 'Experienced')}
            </option>
          </select>

          <div
            className={styles.experienceCardsGrid}
            role="radiogroup"
            aria-label={tx(
              'Selector visual de trayectoria bursátil',
              'Visual trading background selector',
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={investorLevel === 'beginner'}
              onClick={() =>
                onChangeInvestorLevel(
                  investorLevel === 'beginner' ? '' : 'beginner',
                )
              }
              className={`${styles.experienceCard} ${investorLevel === 'beginner' ? styles.experienceCardActive : ''}`}
            >
              <div className={styles.experienceCardTop}>
                <span className={styles.experienceIcon}>
                  <Icon name="user" size={20} />
                </span>
                <span className={styles.experienceRadio} />
              </div>
              <strong>{tx('Principiante', 'Beginner')}</strong>
              <small>
                {tx(
                  'Iniciando en Wall Street · Instrumentos de menor volatilidad, ETFs y herramientas de aprendizaje.',
                  'Getting started on Wall Street · Lower-volatility instruments, ETFs, and learning tools.',
                )}
              </small>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={investorLevel === 'experienced'}
              onClick={() =>
                onChangeInvestorLevel(
                  investorLevel === 'experienced' ? '' : 'experienced',
                )
              }
              className={`${styles.experienceCard} ${investorLevel === 'experienced' ? styles.experienceCardActive : ''}`}
            >
              <div className={styles.experienceCardTop}>
                <span className={styles.experienceIcon}>
                  <Icon name="trend" size={20} />
                </span>
                <span className={styles.experienceRadio} />
              </div>
              <strong>{tx('Con experiencia', 'Experienced')}</strong>
              <small>
                {tx(
                  'Operación activa en NYSE / NASDAQ · Órdenes avanzadas (Limit, Stop Loss, Take Profit) y análisis bursátil.',
                  'Active NYSE / NASDAQ trading · Advanced order types (Limit, Stop Loss, Take Profit) and market analytics.',
                )}
              </small>
            </button>
          </div>
        </div>

        <div className={`${styles.field} ${styles.fullWidth}`}>
          <div className={styles.sectorHeaderRow}>
            <label
              className={styles.sectionBlockTitle}
              htmlFor="interests_input"
            >
              {tx('2. Intereses (opcional)', '2. Interests (optional)')}
            </label>
            <span className={styles.sectorCounterBadge}>
              {selectedInterests.length}{' '}
              {selectedInterests.length === 1
                ? tx('seleccionado', 'selected')
                : tx('seleccionados', 'selected')}
            </span>
          </div>

          <div
            className={styles.interestCatalogGrid}
            role="group"
            aria-label={tx(
              'Catálogo de sectores bursátiles',
              'Market sectors catalog',
            )}
          >
            {marketInterestsCatalog.map((item, idx) => {
              const isSelected = selectedInterests.includes(item.value);
              const { title, subtitle } = splitSectorLabel(item, locale);
              const iconName =
                SECTOR_ICONS[idx % SECTOR_ICONS.length] ?? 'trend';
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleInterest(item.value)}
                  className={`${styles.interestCard} ${isSelected ? styles.interestCardActive : ''}`}
                >
                  <div className={styles.interestCardTop}>
                    <span className={styles.interestSectorIcon}>
                      <Icon name={iconName} size={18} />
                    </span>
                    <span className={styles.interestCheckBadge}>
                      {isSelected ? '✓' : '+'}
                    </span>
                  </div>
                  <strong className={styles.interestCardTitle}>{title}</strong>
                  <span className={styles.interestCardTickers}>{subtitle}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.customInterestsWrap}>
            <textarea
              id="interests_input"
              name="interests"
              rows={1}
              className={styles.customInterestsBox}
              placeholder={tx(
                '¿Tienes algún otro sector o activo de interés? Escríbelo aquí (opcional)…',
                'Have any other sector or stock in mind? Write it here (optional)…',
              )}
              aria-describedby="interests-help"
            />
          </div>
          <small id="interests-help" className={styles.fieldHelp}>
            {tx(
              'Selecciona uno o varios sectores arriba o escribe intereses personalizados adicionales.',
              'Select one or more sectors above or enter additional custom interests.',
            )}
          </small>
        </div>
      </div>

      {selectedInterests.map((interest) => (
        <input key={interest} type="hidden" name="interests" value={interest} />
      ))}

      {selectedInterests.length > 0 && (
        <div
          className={styles.selectedInterests}
          aria-label={tx('Intereses seleccionados', 'Selected interests')}
        >
          <span className={styles.selectedTitle}>
            {tx('Sectores seleccionados', 'Selected sectors')} (
            {selectedInterests.length}):
          </span>
          <div className={styles.interestChips}>
            {selectedInterests.map((interest) => (
              <span key={interest} className={styles.interestChip}>
                {locale === 'en'
                  ? (INTEREST_LABELS_EN[interest]?.title ?? interest)
                  : interest}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => onRemoveInterest(interest)}
                  aria-label={`${tx('Quitar', 'Remove')} ${interest}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.servicesSection}>
        <span className={styles.sectionBlockTitle}>
          {tx(
            '3. Servicios Adicionales y Acompañamiento',
            '3. Additional Services & Advisory',
          )}
        </span>
        <div className={styles.servicesGrid}>
          <label className={`${styles.check} ${styles.serviceCard}`}>
            <div className={styles.serviceCardHeader}>
              <span className={styles.serviceCardIcon}>
                <Icon name="file" size={18} />
              </span>
              <input type="checkbox" name="monthly_report" />
            </div>
            <div className={styles.serviceCardBody}>
              <strong>
                {tx(
                  'Recibir el informe mensual',
                  'Receive monthly market report',
                )}
              </strong>
              <small>
                {tx(
                  'Resumen ejecutivo del mercado estadounidense (S&P 500 y NASDAQ).',
                  'Executive monthly summary of U.S. markets (S&P 500 & NASDAQ).',
                )}
              </small>
            </div>
            <em className={styles.serviceCardTagAccent}>
              {tx('Incluido en simulación', 'Included in simulation')}
            </em>
          </label>

          <label className={`${styles.check} ${styles.serviceCard}`}>
            <div className={styles.serviceCardHeader}>
              <span className={styles.serviceCardIcon}>
                <Icon name="users" size={18} />
              </span>
              <input type="checkbox" name="broker_requested" />
            </div>
            <div className={styles.serviceCardBody}>
              <strong>
                {tx(
                  'Solicitar acompañamiento de un comisionista',
                  'Request licensed broker guidance',
                )}
              </strong>
              <small>
                {tx(
                  'Asesoría personalizada para estructurar tu portafolio en USD.',
                  'Personalized advisory to structure your USD portfolio.',
                )}
              </small>
            </div>
            <em className={styles.serviceCardTagMuted}>
              {tx('Opcional', 'Optional')}
            </em>
          </label>

          <label className={`${styles.check} ${styles.serviceCard}`}>
            <div className={styles.serviceCardHeader}>
              <span className={styles.serviceCardIcon}>
                <Icon name="star" size={18} />
              </span>
              <input type="checkbox" name="premium_requested" />
            </div>
            <div className={styles.serviceCardBody}>
              <strong>
                {tx('Solicitar el plan prémium', 'Request premium plan')}
              </strong>
              <small>
                {tx(
                  'Acceso a listas de seguimiento avanzadas y alertas de precio en tiempo real.',
                  'Access to advanced watchlists and real-time price alerts.',
                )}
              </small>
            </div>
            <em className={styles.serviceCardTagAccent}>
              {tx('Simulación Pro', 'Pro Simulation')}
            </em>
          </label>
        </div>
      </div>
    </fieldset>
  );
}
