'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { advisorsPreview } from '../data/advisors-preview';
import { UpcomingButton } from './LandingActions';
import styles from '../landing.module.css';

export function AdvisorsCarousel() {
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
        <div>
          <p className={styles.securityBadge}>
            Red de Asesoría Bursátil Autorizada · Mercados de EE. UU.
          </p>
          <h2 id="advisors-title" className={styles.sectionTitle}>
            Comisionistas Financieros Calificados
          </h2>
          <p>
            Asesores bursátiles certificados para formular y acompañar
            propuestas de inversión personalizadas en las bolsas de Estados
            Unidos (NYSE, NASDAQ y NYSE Arca). Transparencia con comisiones
            institucionales bajo esquema 60/40.
          </p>
        </div>
        <div className={styles.advisorControls}>
          <UpcomingButton
            feature="Directorio de comisionistas"
            className={styles.directoryButton}
          >
            Ver Directorio Completo →
          </UpcomingButton>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setPaused(!paused)}
            aria-label={paused ? 'Reanudar carrusel' : 'Pausar carrusel'}
            title={paused ? 'Reanudar carrusel' : 'Pausar carrusel'}
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
            aria-label="Comisionista anterior"
            title="Comisionista anterior"
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
            aria-label="Comisionista siguiente"
            title="Comisionista siguiente"
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
        Perfiles, licencias y resultados de demostración en mercados de EE. UU.
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
            <span className={styles.advisorBadge}>{advisor.badge}</span>
            <div className={styles.advisorIdentity}>
              <Image
                src={advisor.photo}
                alt={advisor.name}
                width={64}
                height={64}
              />
              <div>
                <h3>{advisor.name}</h3>
                <p>{advisor.license}</p>
                <span className={styles.advisorRating}>
                  {advisor.rating}
                </span>{' '}
                <small>{advisor.proposals}</small>
              </div>
            </div>
            <p className={styles.advisorDescription}>{advisor.description}</p>
            <dl className={styles.advisorMetrics}>
              <div>
                <dt>Portafolio activo</dt>
                <dd>{advisor.portfolio}</dd>
              </div>
              <div>
                <dt>Tasa de éxito</dt>
                <dd>{advisor.success}</dd>
              </div>
              <div>
                <dt>Especialidad:</dt>
                <dd>{advisor.specialty}</dd>
              </div>
            </dl>
            <UpcomingButton
              feature={`Solicitar propuesta · ${advisor.name}`}
              className={styles.primaryButton}
            >
              Solicitar Propuesta ↗
            </UpcomingButton>
          </article>
        ))}
      </div>
      <div className={styles.advisorBottom}>
        <div className={styles.advisorDots}>
          {advisorsPreview.map((advisor, index) => (
            <button
              key={advisor.name}
              aria-label={`Ver comisionista ${index + 1}`}
              aria-pressed={active === index}
              onClick={() => navigate(index)}
            />
          ))}
        </div>
        <span>
          {paused
            ? 'En pausa'
            : 'Desplazamiento automático · Pase el cursor para pausar'}
        </span>
      </div>
    </section>
  );
}
