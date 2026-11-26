'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const { tx } = useLocale();
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
      <h3 id="broker-public-profile-title" className={styles.cardTitle}>
        {profile.data?.name ?? tx('Perfil del comisionista', 'Broker profile')}
      </h3>
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
        <p className={styles.fieldHint}>{tx('Cargando…', 'Loading…')}</p>
      )}
      <p className={styles.cardDesc}>{profile.data?.description}</p>
      <p className={styles.controlHint}>
        {profile.data?.specialty} · {profile.data?.certifications.join(', ')}
      </p>
      {reputation.data && (
        <p className={styles.controlTitle}>
          ★ {reputation.data.average ?? '—'} · {reputation.data.reviews_count}{' '}
          {tx('reseñas', 'reviews')}
        </p>
      )}
      {reviews.data?.items.map((review, i) => (
        <blockquote key={i} className={styles.reviewQuote}>
          ★ {review.stars} · {review.comment}
          <p className={styles.fieldHint}>{review.created_at}</p>
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
      <button className={styles.secondaryBtn} onClick={onClose}>
        {tx('Cerrar', 'Close')}
      </button>
    </dialog>
  );
}
