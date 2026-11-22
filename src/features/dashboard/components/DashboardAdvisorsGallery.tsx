'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import {
  advisorsData,
  type AdvisorItem,
  type DashboardSection,
} from '../dashboard-constants';
import styles from '../dashboard.module.css';

export interface DashboardAdvisorsGalleryProps {
  onNavigate: (section: DashboardSection) => void;
}

export function DashboardAdvisorsGallery({
  onNavigate,
}: DashboardAdvisorsGalleryProps) {
  const { locale, tx } = useLocale();
  const advisorDialog = useRef<HTMLDialogElement>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorItem | null>(
    null,
  );
  const [actionFeedback, setActionFeedback] = useState('');

  function openAdvisorModal(advisor: AdvisorItem) {
    setSelectedAdvisor(advisor);
    advisorDialog.current?.showModal();
  }

  return (
    <>
      <div className={styles.galleryHeader}>
        <h2>
          {tx(
            'Fichas Técnicas y Galería de Comisionistas Destacados',
            'Featured Broker Profiles & Credentials Gallery',
          )}
        </h2>
        <p>
          {tx(
            'Profesionales acreditados para estructurar y supervisar tu portafolio en mercados de Estados Unidos (NYSE / NASDAQ).',
            'Accredited professionals to structure and oversee your portfolio across U.S. equity markets (NYSE / NASDAQ).',
          )}
        </p>
      </div>

      {actionFeedback && (
        <div className={styles.actionFeedback} role="status">
          <span>{actionFeedback}</span>
          <button
            type="button"
            className={styles.actionFeedbackDismiss}
            onClick={() => setActionFeedback('')}
          >
            {tx('Cerrar', 'Dismiss')}
          </button>
        </div>
      )}

      <div className={styles.advisorsGrid}>
        {advisorsData.map((adv) => (
          <div key={adv.id} className={styles.advisorCardDetailed}>
            <div className={styles.advisorCardHeader}>
              <div className={styles.advisorPhotoWrap}>
                <button
                  type="button"
                  className={styles.advisorPhotoBtn}
                  onClick={() => openAdvisorModal(adv)}
                  title={tx(
                    `Ampliar foto y ver ficha técnica de ${adv.name}`,
                    `Enlarge photo and view profile of ${adv.name}`,
                  )}
                  aria-label={tx(
                    `Ver foto y ficha técnica de ${adv.name}`,
                    `View photo and profile of ${adv.name}`,
                  )}
                >
                  <Image
                    src={adv.photo}
                    alt={`${tx('Foto', 'Photo')} ${adv.name}`}
                    width={56}
                    height={56}
                    className={styles.advisorPhotoLarge}
                  />
                </button>
                <span
                  className={styles.advisorPhotoZoomIcon}
                  aria-hidden="true"
                >
                  <Icon name="search" size={11} />
                </span>
              </div>

              <div className={styles.advisorMetaCol}>
                <div className={styles.advisorTitleRow}>
                  <h3>{adv.name}</h3>
                  {adv.assigned && (
                    <span className={styles.assigned}>
                      {tx('Asignado', 'Assigned')}
                    </span>
                  )}
                </div>
                <small className={styles.advisorLicenseText}>
                  {locale === 'en' ? adv.licenseEn : adv.license}
                </small>
                <div className={styles.advisorRatingRow}>
                  ★ {adv.rating} {tx('de 5.0', 'out of 5.0')} · {adv.success}{' '}
                  {tx('Acierto', 'Win rate')} ({adv.proposals}{' '}
                  {tx('propuestas', 'proposals')})
                </div>
              </div>
            </div>

            <p className={styles.advisorBioText}>
              {locale === 'en' ? adv.bioEn : adv.bio}
            </p>

            <div className={styles.advisorActionList}>
              {adv.assigned ? (
                <>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() =>
                      setActionFeedback(
                        tx(
                          `Sesión de asesoría agendada con ${adv.name}. Te llegará un correo de confirmación.`,
                          `Advisory session scheduled with ${adv.name}. You will receive a confirmation email.`,
                        ),
                      )
                    }
                  >
                    {tx('Agendar Asesoría', 'Schedule Advisory')}
                  </button>
                  <button
                    type="button"
                    className={styles.borderedNavBtn}
                    onClick={() => onNavigate('orders')}
                  >
                    {tx(
                      'Operar con su estrategia',
                      'Trade with their strategy',
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() =>
                    setActionFeedback(
                      tx(
                        `Solicitud de asignación enviada para estructurar tu portafolio con ${adv.name}.`,
                        `Assignment request sent to structure your portfolio with ${adv.name}.`,
                      ),
                    )
                  }
                >
                  {tx('Seleccionar como Asesor', 'Select as Advisor')}
                </button>
              )}
              <button
                type="button"
                className={styles.borderedNavBtn}
                onClick={() => openAdvisorModal(adv)}
              >
                {tx(
                  '🔍 Ver Ficha Técnica y Foto Ampliada',
                  '🔍 View Profile & Enlarged Photo',
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <dialog ref={advisorDialog} className={styles.advisorDetailDialog}>
        <form method="dialog">
          <button
            className={styles.modalCloseBtn}
            aria-label={tx('Cerrar ventana', 'Close dialog')}
          >
            <Icon name="close" size={16} />
          </button>
        </form>

        {selectedAdvisor && (
          <div>
            <div className={styles.advisorModalHeader}>
              <div className={styles.advisorModalPhoto}>
                <Image
                  src={selectedAdvisor.photo}
                  alt={selectedAdvisor.name}
                  width={96}
                  height={96}
                  className={styles.advisorModalImg}
                />
              </div>
              <div className={styles.advisorMetaCol}>
                <div className={styles.advisorTitleRow}>
                  <h3>{selectedAdvisor.name}</h3>
                  {selectedAdvisor.assigned && (
                    <span className={styles.assigned}>
                      {tx('Asesor Asignado', 'Assigned Advisor')}
                    </span>
                  )}
                </div>
                <small className={styles.advisorLicenseText}>
                  {locale === 'en'
                    ? selectedAdvisor.licenseEn
                    : selectedAdvisor.license}
                </small>
                <div className={styles.advisorRatingRow}>
                  ★ {selectedAdvisor.rating} {tx('de 5.0', 'out of 5.0')} ·{' '}
                  {tx('Calificación auditada', 'Audited rating')}
                </div>
              </div>
            </div>

            <div className={styles.advisorStatsGrid}>
              <div className={styles.advisorStatBox}>
                <small>{tx('Efectividad', 'Success Rate')}</small>
                <strong>{selectedAdvisor.success}</strong>
              </div>
              <div className={styles.advisorStatBox}>
                <small>{tx('Propuestas', 'Proposals')}</small>
                <strong>{selectedAdvisor.proposals}</strong>
              </div>
              <div className={styles.advisorStatBox}>
                <small>{tx('Mercados', 'Markets')}</small>
                <strong>NYSE / NASDAQ</strong>
              </div>
            </div>

            <div className={styles.advisorStrategyBox}>
              <h4>
                {tx(
                  'Especialidad y Perfil Profesional',
                  'Specialty & Professional Profile',
                )}
              </h4>
              <p>
                {locale === 'en' ? selectedAdvisor.bioEn : selectedAdvisor.bio}
              </p>
            </div>

            <div className={styles.advisorStrategyBox}>
              <h4>
                {tx(
                  'Tesis y Estrategia de Inversión',
                  'Investment Thesis & Strategy',
                )}
              </h4>
              <p>
                {locale === 'en'
                  ? selectedAdvisor.strategyEn
                  : selectedAdvisor.strategy}
              </p>
              <div className={styles.advisorAssetsPills}>
                <span className={styles.advisorLicenseText}>
                  {tx('Activos recomendados:', 'Recommended assets:')}
                </span>
                {selectedAdvisor.recommendedAssets.map((sym) => (
                  <span key={sym} className={styles.advisorAssetPill}>
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.modalFooterActions}>
              <button
                type="button"
                className={styles.chipBtn}
                onClick={() => advisorDialog.current?.close()}
              >
                {tx('Cerrar', 'Close')}
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  advisorDialog.current?.close();
                  onNavigate('orders');
                }}
              >
                {tx(
                  'Operar con su estrategia en Wall Street',
                  'Trade this strategy on Wall Street',
                )}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
