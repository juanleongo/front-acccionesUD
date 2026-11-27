'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatMarketDateTime } from '@/lib/formatters';
import { BrokerAvatar } from './BrokerAvatar';
import ui from '../brokers-details.module.css';
import { useLocale } from '@/lib/i18n';
import { brokerRequest } from '../brokers-api';
import {
  brokerSchema,
  reputationSchema,
  pageSchema,
  reviewSchema,
} from '../brokers-schemas';
import { Pager } from './HistoryFilters';
import styles from '../brokers.module.css';
export function BrokerProfileDialog({
  id,
  userId,
  onClose,
}: {
  id: string;
  userId: string;
  onClose: () => void;
}) {
  const { tx, locale } = useLocale();
  const [cursors, setCursors] = useState(['']);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  const profile = useQuery({
    queryKey: ['brokers', userId, 'public-profile', id],
    queryFn: ({ signal }) =>
      brokerRequest(
        `brokers/${id}`,
        brokerSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    retry: false,
  });
  const reputation = useQuery({
    queryKey: ['brokers', userId, 'reputation', id],
    queryFn: ({ signal }) =>
      brokerRequest(
        `brokers/${id}/reputation`,
        reputationSchema,
        'GET',
        undefined,
        undefined,
        signal,
      ),
    retry: false,
  });
  const reviews = useQuery({
    queryKey: ['brokers', userId, 'reviews', id, cursors.at(-1)],
    queryFn: ({ signal }) =>
      brokerRequest(
        `brokers/${id}/reviews`,
        pageSchema(reviewSchema),
        'GET',
        undefined,
        {
          page_size: '10',
          ...(cursors.at(-1) ? { cursor: cursors.at(-1)! } : {}),
        },
        signal,
      ),
    retry: false,
  });
  return (
    <dialog
      ref={ref}
      className={styles.confirmDialog}
      aria-labelledby="broker-public-profile-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className={ui.dialogHeader}>
        <div className={ui.identity}>
          <BrokerAvatar
            brokerId={id}
            name={profile.data?.name ?? tx('Comisionista', 'Broker')}
            size={64}
          />
          <div>
            <p className={ui.eyebrow}>
              {tx('Perfil profesional', 'Professional profile')}
            </p>
            <h3 id="broker-public-profile-title" className={styles.cardTitle}>
              {profile.data?.name ??
                tx('Perfil del comisionista', 'Broker profile')}
            </h3>
            <p className={styles.cardDesc}>{profile.data?.firm_name}</p>
          </div>
        </div>
        <button
          type="button"
          className={ui.close}
          aria-label={tx('Cerrar perfil', 'Close profile')}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      {[profile, reputation, reviews]
        .filter((q) => q.isError)
        .map((q, i) => (
          <p key={i} role="alert" className={styles.formError}>
            {q.error?.message}
            <button
              className={styles.secondaryBtn}
              onClick={() => void q.refetch()}
            >
              {tx('Reintentar', 'Retry')}
            </button>
          </p>
        ))}
      {profile.isPending && (
        <LoadingState
          mode="compact"
          label={tx('Consultando perfil…', 'Loading profile…')}
        />
      )}
      <p className={styles.cardDesc}>{profile.data?.description}</p>
      {profile.data && (
        <div className={ui.profileFacts}>
          <div>
            <span className={ui.eyebrow}>
              {tx('Especialidad', 'Specialty')}
            </span>
            <strong>{profile.data.specialty}</strong>
          </div>
          <div>
            <span className={ui.eyebrow}>
              {tx('Experiencia', 'Experience')}
            </span>
            <strong>
              {profile.data.years_experience} {tx('años', 'years')}
            </strong>
          </div>
        </div>
      )}
      {profile.data && profile.data.certifications.length > 0 && (
        <ul
          className={ui.chips}
          aria-label={tx('Certificaciones', 'Certifications')}
        >
          {profile.data.certifications.map((certification) => (
            <li key={certification}>
              <Icon name="check" size={15} />
              {certification}
            </li>
          ))}
        </ul>
      )}
      {reputation.data && (
        <p className={ui.reputation}>
          ★{' '}
          {reputation.data.average === null
            ? '—'
            : Number(reputation.data.average).toLocaleString(locale, {
                maximumFractionDigits: 2,
              })}{' '}
          · {reputation.data.reviews_count}{' '}
          {reputation.data.reviews_count === 1
            ? tx('reseña', 'review')
            : tx('reseñas', 'reviews')}
        </p>
      )}
      <h4 className={ui.sectionTitle}>
        {tx('Opiniones de inversionistas', 'Investor reviews')}
      </h4>
      {reviews.isPending && (
        <LoadingState
          mode="compact"
          label={tx('Consultando reseñas…', 'Loading reviews…')}
        />
      )}
      {reviews.data?.items.map((review, i) => (
        <blockquote key={i} className={ui.review}>
          <div className={ui.reviewMeta}>
            <strong
              aria-label={`${review.stars} ${tx('de 5 estrellas', 'out of 5 stars')}`}
            >
              {'★'.repeat(review.stars)}
              {'☆'.repeat(5 - review.stars)}
            </strong>
            <time dateTime={review.created_at}>
              {formatMarketDateTime(review.created_at, locale, {
                timeZone: 'America/New_York',
              })}{' '}
              ET
            </time>
          </div>
          <p>
            {review.comment ||
              tx('Sin comentario adicional.', 'No additional comment.')}
          </p>
        </blockquote>
      ))}
      {reviews.isSuccess && reviews.data.items.length === 0 && (
        <p className={styles.fieldHint}>
          {tx('Sin reseñas todavía.', 'No reviews yet.')}
        </p>
      )}
      <Pager
        index={cursors.length - 1}
        hasNext={Boolean(reviews.data?.next_cursor)}
        onPrevious={() => setCursors((c) => c.slice(0, -1))}
        onNext={() => setCursors((c) => [...c, reviews.data!.next_cursor!])}
      />
      <button
        type="button"
        className={`${styles.secondaryBtn} ${ui.footerClose}`}
        onClick={onClose}
      >
        {tx('Cerrar', 'Close')}
      </button>
    </dialog>
  );
}
