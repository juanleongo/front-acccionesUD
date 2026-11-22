'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n';
import { advisorsPreview } from '../data/advisors-preview';
import { Icon } from '@/components/ui/Icon';
import { UpcomingButton } from './LandingActions';
import styles from '../landing.module.css';

export function AdvisorsCarousel() {
  const { locale, tx } = useLocale();
  const viewport = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const focused = useRef(false);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const reducedMotion =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    let frame = 0;
    let last = 0;
    let position = element.scrollLeft;
    function animate(time: number) {
      if (!element) return;
      const step =
        ((element.firstElementChild as HTMLElement)?.offsetWidth ?? 320) + 24;
      if (
        last &&
        !paused &&
        !hovering.current &&
        !focused.current &&
        !reducedMotion &&
        !document.hidden
      ) {
        position += Math.min(time - last, 100) * 0.058;
        if (position >= step * advisorsPreview.length)
          position -= step * advisorsPreview.length;
        element.scrollLeft = position;
      } else position = element.scrollLeft;
      last = time;
      if (
        typeof window !== 'undefined' &&
        typeof window.requestAnimationFrame === 'function'
      ) {
        frame = requestAnimationFrame(animate);
      }
    }
    if (
      typeof window !== 'undefined' &&
      typeof window.requestAnimationFrame === 'function'
    ) {
      frame = requestAnimationFrame(animate);
    }
    return () => {
      if (
        typeof window !== 'undefined' &&
        typeof window.cancelAnimationFrame === 'function'
      ) {
        cancelAnimationFrame(frame);
      }
    };
  }, [paused]);

  function navigate(index: number) {
    setPaused(true);
    const next = (index + advisorsPreview.length) % advisorsPreview.length;
    const element = viewport.current;
    if (element)
      element.scrollLeft =
        next *
        (((element.firstElementChild as HTMLElement)?.offsetWidth ?? 320) + 24);
    setActive(next);
  }

  return (
    <section
      id="comisionistas"
      className={`${styles.container} ${styles.advisors}`}
      aria-labelledby="advisors-title"
      aria-roledescription="carrusel"
    >
      <div className={styles.advisorsHeading}>
        <div className={styles.advisorsIntro}>
          <span className={styles.advisorsIntroIcon} aria-hidden="true">
            <Icon name="users" size={26} />
          </span>
          <div>
            <p className={styles.eyebrow}>
              {tx(
                'Acompañamiento para tus inversiones',
                'Support for your investments',
              )}
            </p>
            <h2 id="advisors-title" className={styles.sectionTitle}>
              {tx('Conoce a tus próximos asesores', 'Meet your next advisors')}
            </h2>
            <p className={styles.advisorsSubtitle}>
              {tx(
                'Explora perfiles profesionales, compara especialidades y encuentra acompañamiento para tus decisiones en los mercados de Estados Unidos.',
                'Explore professional profiles, compare specialties, and find support for your decisions in U.S. markets.',
              )}
            </p>
          </div>
        </div>
        <div className={styles.advisorControls}>
          <UpcomingButton
            feature={tx('Directorio de comisionistas', 'Brokers directory')}
            className={styles.directoryButton}
          >
            {tx('Ver Directorio Completo →', 'View Full Directory →')}
          </UpcomingButton>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setPaused(!paused)}
            aria-label={
              paused
                ? tx('Reanudar carrusel', 'Resume carousel')
                : tx('Pausar carrusel', 'Pause carousel')
            }
            title={
              paused
                ? tx('Reanudar carrusel', 'Resume carousel')
                : tx('Pausar carrusel', 'Pause carousel')
            }
          >
            {paused ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <polygon points="6,4 20,12 6,20" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={tx('Comisionista anterior', 'Previous broker')}
            title={tx('Comisionista anterior', 'Previous broker')}
            onClick={() => navigate(active - 1)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={tx('Comisionista siguiente', 'Next broker')}
            title={tx('Comisionista siguiente', 'Next broker')}
            onClick={() => navigate(active + 1)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <p className={styles.advisorDisclaimer}>
        <Icon name="info" size={16} />
        {tx(
          'Perfiles, licencias y resultados de demostración en mercados de EE. UU.',
          'Sample profiles, licenses, and illustrative metrics for U.S. markets.',
        )}
      </p>
      <div
        ref={viewport}
        className={styles.advisorViewport}
        onMouseEnter={() => {
          hovering.current = true;
        }}
        onMouseLeave={() => {
          hovering.current = false;
        }}
        onFocusCapture={() => {
          focused.current = true;
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            focused.current = false;
        }}
        onTouchStart={() => setPaused(true)}
        onScroll={(event) => {
          const el = event.currentTarget;
          const step =
            ((el.firstElementChild as HTMLElement)?.offsetWidth ?? 320) + 24;
          setActive(Math.round(el.scrollLeft / step) % advisorsPreview.length);
        }}
      >
        {[...advisorsPreview, ...advisorsPreview].map((advisor, index) => (
          <article
            key={index}
            className={styles.advisorCard}
            inert={index >= advisorsPreview.length}
            aria-hidden={index >= advisorsPreview.length ? true : undefined}
          >
            <span className={styles.advisorBadge}>
              {locale === 'en' ? advisor.badgeEn : advisor.badge}
            </span>
            <div className={styles.advisorIdentity}>
              <Image
                src={advisor.photo}
                alt={advisor.name}
                width={64}
                height={64}
              />
              <div className={styles.advisorIdentityMeta}>
                <h3 className={styles.advisorName}>{advisor.name}</h3>
                <p className={styles.advisorLicense}>
                  {locale === 'en' ? advisor.licenseEn : advisor.license}
                </p>
                <span className={styles.advisorRating}>{advisor.rating}</span>{' '}
                <small className={styles.advisorProposals}>
                  {locale === 'en' ? advisor.proposalsEn : advisor.proposals}
                </small>
              </div>
            </div>
            <p className={styles.advisorDescription}>
              {locale === 'en' ? advisor.descriptionEn : advisor.description}
            </p>
            <dl className={styles.advisorMetrics}>
              <div>
                <dt>{tx('Portafolio activo', 'Active portfolio')}</dt>
                <dd>{advisor.portfolio}</dd>
              </div>
              <div>
                <dt>{tx('Tasa de éxito', 'Success rate')}</dt>
                <dd>{advisor.success}</dd>
              </div>
              <div>
                <dt>{tx('Especialidad:', 'Specialty:')}</dt>
                <dd>
                  {locale === 'en' ? advisor.specialtyEn : advisor.specialty}
                </dd>
              </div>
            </dl>
            <UpcomingButton
              feature={`${tx('Solicitar propuesta', 'Request proposal')} · ${advisor.name}`}
              className={styles.primaryButton}
            >
              {tx('Solicitar Propuesta ↗', 'Request Proposal ↗')}
            </UpcomingButton>
          </article>
        ))}
      </div>
      <div className={styles.advisorBottom}>
        <div className={styles.advisorDots}>
          {advisorsPreview.map((advisor, index) => (
            <button
              key={advisor.name}
              type="button"
              aria-label={`${tx('Ver comisionista', 'View broker')} ${index + 1}`}
              aria-pressed={active === index}
              onClick={() => navigate(index)}
            />
          ))}
        </div>
        <span className={styles.advisorScrollHint}>
          {paused
            ? tx('En pausa', 'Paused')
            : tx(
                'Desplazamiento automático · Pase el cursor para pausar',
                'Auto-scrolling · Hover to pause',
              )}
        </span>
      </div>
    </section>
  );
}
