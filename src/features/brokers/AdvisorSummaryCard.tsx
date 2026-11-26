'use client';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/lib/i18n';
import { fetchLatestActiveLink } from './advisor-summary-api';
import { brokerRequest } from './brokers-api';
import { brokerSchema } from './brokers-schemas';
import { getInitials } from './broker-labels';
import styles from './advisor-summary.module.css';
export function AdvisorSummaryCard({
  userId,
  onExplore,
  onOpenAdvisor,
}: {
  userId: string | undefined;
  onExplore: () => void;
  onOpenAdvisor: () => void;
}) {
  const { tx, locale } = useLocale();
  const link = useQuery({
    queryKey: ['brokers', userId, 'advisor-summary'],
    queryFn: ({ signal }) => fetchLatestActiveLink(signal),
    enabled: Boolean(userId),
    retry: false,
  });
  const brokerId = link.data?.broker_id;
  const profile = useQuery({
    queryKey: ['brokers', userId, 'public-profile', brokerId],
    queryFn: ({ signal }) =>
      brokerRequest(
        `brokers/${brokerId}`,
        brokerSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    enabled: Boolean(brokerId),
    retry: false,
  });
  const name = link.data?.broker.name;
  const reputation = profile.data?.reputation;
  return (
    <section
      className={styles.card}
      aria-label={tx('Tu Asesor Bursátil', 'Your Stock Broker')}
    >
      <div className={styles.heading}>
        <h2>{tx('Tu Asesor Bursátil', 'Your Stock Broker')}</h2>
        {link.data && (
          <span className={styles.badge}>● {tx('Asignado', 'Assigned')}</span>
        )}
      </div>
      {!userId || link.isPending ? (
        <p className={styles.note}>
          {tx('Consultando tu comisionista…', 'Loading your broker…')}
        </p>
      ) : link.isError ? (
        <div role="alert" className={styles.note}>
          <p>
            {tx(
              'No se pudo consultar tu comisionista.',
              'Could not load your broker.',
            )}
          </p>
          <button className={styles.button} onClick={() => void link.refetch()}>
            {tx('Reintentar', 'Retry')}
          </button>
        </div>
      ) : link.data && name ? (
        <div className={styles.advisor}>
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(name)}
          </span>
          <div className={styles.details}>
            <strong>{name}</strong>
            <small>
              {profile.data?.firm_name ?? link.data.broker.firm_name}
              {profile.data?.specialty ? ` · ${profile.data.specialty}` : ''}
            </small>
            {reputation ? (
              <b>
                {reputation.average === null
                  ? tx('Sin calificaciones', 'No ratings yet')
                  : `★ ${Number(reputation.average).toLocaleString(locale, { maximumFractionDigits: 2 })} ${tx('de 5.0', 'out of 5.0')}`}{' '}
                ({reputation.converted_proposals}{' '}
                {tx(
                  'propuestas convertidas en órdenes',
                  'proposals converted to orders',
                )}
                )
              </b>
            ) : profile.isError ? (
              <small role="alert">
                {tx('Reputación no disponible.', 'Reputation unavailable.')}{' '}
                <button
                  className={styles.button}
                  onClick={() => void profile.refetch()}
                >
                  {tx('Reintentar', 'Retry')}
                </button>
              </small>
            ) : (
              <small>
                {tx('Consultando reputación…', 'Loading reputation…')}
              </small>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.note}>
          {tx(
            'Aún no tienes un comisionista asociado. Explora el directorio para elegir tu asesor.',
            'You do not have an assigned broker yet. Explore the directory to choose an advisor.',
          )}
        </p>
      )}
      <button
        type="button"
        className={styles.button}
        onClick={link.data ? onOpenAdvisor : onExplore}
      >
        {link.data
          ? tx(
              'Consultar Asesores & Estrategias',
              'Explore Advisors & Strategies',
            )
          : tx('Explorar comisionistas', 'Explore brokers')}
      </button>
    </section>
  );
}
