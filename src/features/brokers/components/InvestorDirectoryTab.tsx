'use client';

import { Icon } from '@/components/ui/Icon';
import { formatDecimalNumber } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import type { BrokerDirectoryItem, BrokerReviewItem } from '../brokers-mock';
import { BrokerAvatar } from './BrokerAvatar';
import styles from '../brokers.module.css';

export function InvestorDirectoryTab({
  directory,
  totalCount,
  activeBrokerId,
  reviewsByBroker,
  searchQuery,
  onSearchChange,
  onRequestLink,
}: {
  directory: BrokerDirectoryItem[];
  totalCount: number;
  activeBrokerId: string | null;
  reviewsByBroker: Record<string, BrokerReviewItem[]>;
  searchQuery: string;
  onSearchChange: (nextQuery: string) => void;
  onRequestLink: (broker: BrokerDirectoryItem) => void;
}) {
  const { locale, tx } = useLocale();
  const hasFilter = searchQuery.trim().length > 0;

  return (
    <div className={styles.card} role="tabpanel">
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h3 className={styles.cardTitle}>
            {tx(
              'Directorio Oficial de Comisionistas Certificados',
              'Official Certified Broker Directory',
            )}
          </h3>
          <p className={styles.cardDesc}>
            {tx(
              'Conoce la trayectoria, especialidad y calificaciones de los asesores disponibles para acompañarte en NYSE y NASDAQ.',
              'Review track record, specialties, and ratings of certified advisors available for NYSE and NASDAQ.',
            )}
          </p>
        </div>

        <div className={styles.searchBoxWrap}>
          <div className={styles.searchInputShell}>
            <span className={styles.searchIcon} aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              type="search"
              aria-label={tx(
                'Buscar comisionista por nombre, firma o especialidad',
                'Search broker by name, firm, or specialty',
              )}
              className={styles.searchInput}
              placeholder={tx(
                'Buscar por nombre, firma o especialidad…',
                'Search by name, firm, or specialty…',
              )}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {hasFilter && (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => onSearchChange('')}
              >
                {tx('Limpiar', 'Clear')}
              </button>
            )}
          </div>
          <span className={styles.directoryCountMeta}>
            {tx(
              `Mostrando ${directory.length} de ${totalCount} asesores`,
              `Showing ${directory.length} of ${totalCount} advisors`,
            )}
          </span>
        </div>
      </div>

      {directory.length === 0 ? (
        <div className={styles.emptyNotice}>
          <div className={styles.controlTitle}>
            {tx(
              'No encontramos comisionistas con ese criterio',
              'No brokers found matching your search',
            )}
          </div>
          <p className={styles.controlHint}>
            {tx(
              'Intenta buscar por otra especialidad, firma o limpia el filtro actual.',
              'Try searching by another specialty, firm, or clear the current filter.',
            )}
          </p>
          {hasFilter && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => onSearchChange('')}
            >
              {tx('Mostrar todos los comisionistas', 'Show all brokers')}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.directoryGrid}>
          {directory.map((broker) => {
            const isLinked = activeBrokerId === broker.id;
            const brokerReviews = reviewsByBroker[broker.id] ?? [];
            const ratingValue = broker.reputation.average ?? '5.0';

            return (
              <article
                key={broker.id}
                className={`${styles.brokerCard} ${
                  isLinked ? styles.brokerCardLinked : ''
                }`}
              >
                <div className={styles.brokerCardBody}>
                  <div className={styles.brokerCardHeaderBand}>
                    <div className={styles.brokerHeader}>
                      <BrokerAvatar
                        brokerId={broker.id}
                        name={broker.name}
                        avatarUrl={broker.avatarUrl}
                        size={58}
                        verified
                      />
                      <div className={styles.brokerIdentity}>
                        <div className={styles.brokerName}>{broker.name}</div>
                        <div className={styles.brokerFirm}>
                          {broker.firm_name}
                        </div>
                      </div>
                    </div>

                    <span
                      className={styles.ratingPill}
                      aria-label={tx(
                        `Calificación ${ratingValue} de 5`,
                        `Rating ${ratingValue} out of 5`,
                      )}
                    >
                      ★ {ratingValue}
                    </span>
                  </div>

                  <div className={styles.specialtyCallout}>
                    <span className={styles.specialtyLabel}>
                      {tx('Especialidad Principal', 'Primary Specialty')}
                    </span>
                    <div className={styles.brokerSpecialty}>
                      {broker.specialty}
                    </div>
                  </div>

                  {broker.description && (
                    <p className={styles.brokerDescription}>
                      {broker.description}
                    </p>
                  )}

                  <div className={styles.certRow}>
                    {broker.certifications.map((cert) => (
                      <span key={cert} className={styles.certChip}>
                        {cert}
                      </span>
                    ))}
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>
                        {tx('Reseñas', 'Reviews')}
                      </span>
                      <span className={styles.statVal}>
                        {formatDecimalNumber(
                          broker.reputation.reviews_count,
                          locale,
                          0,
                        )}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>
                        {tx('Experiencia', 'Experience')}
                      </span>
                      <span className={styles.statVal}>
                        {broker.years_experience} {tx('años', 'yrs')}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>
                        {tx('Ejecutadas', 'Executed')}
                      </span>
                      <span className={styles.statVal}>
                        {formatDecimalNumber(
                          broker.reputation.converted_proposals,
                          locale,
                          0,
                        )}
                      </span>
                    </div>
                  </div>

                  {brokerReviews[0] && (
                    <blockquote className={styles.reviewQuote}>
                      “{brokerReviews[0].comment}”
                      <span className={styles.reviewQuoteStars}>
                        ★ {brokerReviews[0].stars}/5
                      </span>
                    </blockquote>
                  )}
                </div>

                <div className={styles.brokerCardFooter}>
                  <span className={styles.directoryCountMeta}>
                    {formatDecimalNumber(
                      broker.reputation.distinct_investors,
                      locale,
                      0,
                    )}{' '}
                    {tx('inversionistas activos', 'active investors')}
                  </span>

                  {isLinked ? (
                    <span className={styles.badgeSuccess}>
                      {tx('✓ Tu Comisionista Actual', '✓ Your Current Broker')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => onRequestLink(broker)}
                    >
                      {tx('Solicitar Vinculación', 'Request Advisory Link')}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
