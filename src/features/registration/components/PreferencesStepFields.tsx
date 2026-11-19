'use client';

import { Icon, type IconName } from '@/components/ui/Icon';
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

function splitSectorLabel(item: { value: string; label: string }) {
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
  return (
    <fieldset hidden={hidden} disabled={disabled}>
      <legend>
        <Icon name="trend" size={18} /> Preferencias e intereses en mercados de
        EE. UU.
      </legend>
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label
            className={styles.sectionBlockTitle}
            htmlFor="investor_level_select"
          >
            1. Nivel de experiencia (opcional)
          </label>
          <select
            id="investor_level_select"
            name="investor_level"
            value={investorLevel}
            onChange={(e) => onChangeInvestorLevel(e.target.value)}
            tabIndex={-1}
            className={styles.hiddenNativeSelect}
          >
            <option value="">Sin especificar</option>
            <option value="beginner">Principiante</option>
            <option value="experienced">Con experiencia</option>
          </select>

          <div
            className={styles.experienceCardsGrid}
            role="radiogroup"
            aria-label="Selección visual de nivel de experiencia"
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
              <strong>Principiante</strong>
              <small>
                Iniciando en Wall Street · Instrumentos de menor volatilidad,
                ETFs y herramientas de aprendizaje.
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
              <strong>Con experiencia</strong>
              <small>
                Operación activa en NYSE / NASDAQ · Órdenes avanzadas (Limit,
                Stop Loss, Take Profit) y análisis bursátil.
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
              2. Intereses (opcional)
            </label>
            <span className={styles.sectorCounterBadge}>
              {selectedInterests.length}{' '}
              {selectedInterests.length === 1
                ? 'seleccionado'
                : 'seleccionados'}
            </span>
          </div>

          <div
            className={styles.interestCatalogGrid}
            role="group"
            aria-label="Catálogo de sectores bursátiles"
          >
            {marketInterestsCatalog.map((item, idx) => {
              const isSelected = selectedInterests.includes(item.value);
              const { title, subtitle } = splitSectorLabel(item);
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
              placeholder="¿Tienes algún otro sector o activo de interés? Escríbelo aquí (opcional)…"
              aria-describedby="interests-help"
            />
          </div>
          <small id="interests-help" className={styles.fieldHelp}>
            Selecciona uno o varios sectores arriba o escribe intereses
            personalizados adicionales.
          </small>
        </div>
      </div>

      {selectedInterests.map((interest) => (
        <input key={interest} type="hidden" name="interests" value={interest} />
      ))}

      {selectedInterests.length > 0 && (
        <div
          className={styles.selectedInterests}
          aria-label="Intereses seleccionados"
        >
          <span className={styles.selectedTitle}>
            Sectores seleccionados ({selectedInterests.length}):
          </span>
          <div className={styles.interestChips}>
            {selectedInterests.map((interest) => (
              <span key={interest} className={styles.interestChip}>
                {interest}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => onRemoveInterest(interest)}
                  aria-label={`Quitar ${interest}`}
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
          3. Servicios Adicionales y Acompañamiento
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
              <strong>Recibir el informe mensual</strong>
              <small>
                Resumen ejecutivo del mercado estadounidense (S&amp;P 500 y
                NASDAQ).
              </small>
            </div>
            <em className={styles.serviceCardTagAccent}>
              Incluido en simulación
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
              <strong>Solicitar acompañamiento de un comisionista</strong>
              <small>
                Asesoría personalizada para estructurar tu portafolio en USD.
              </small>
            </div>
            <em className={styles.serviceCardTagMuted}>Opcional</em>
          </label>

          <label className={`${styles.check} ${styles.serviceCard}`}>
            <div className={styles.serviceCardHeader}>
              <span className={styles.serviceCardIcon}>
                <Icon name="star" size={18} />
              </span>
              <input type="checkbox" name="premium_requested" />
            </div>
            <div className={styles.serviceCardBody}>
              <strong>Solicitar el plan prémium</strong>
              <small>
                Acceso a listas de seguimiento avanzadas y alertas de precio en
                tiempo real.
              </small>
            </div>
            <em className={styles.serviceCardTagAccent}>Simulación Pro</em>
          </label>
        </div>
      </div>
    </fieldset>
  );
}
