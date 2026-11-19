'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
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
  const advisorDialog = useRef<HTMLDialogElement>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorItem | null>(
    null,
  );

  function openAdvisorModal(advisor: AdvisorItem) {
    setSelectedAdvisor(advisor);
    advisorDialog.current?.showModal();
  }

  return (
    <>
      <div className={styles.galleryHeader}>
        <h2>Fichas Técnicas y Galería de Comisionistas Destacados</h2>
        <p>
          Profesionales acreditados para estructurar y supervisar tu portafolio
          en mercados de Estados Unidos (NYSE / NASDAQ).
        </p>
      </div>

      <div className={styles.advisorsGrid}>
        {advisorsData.map((adv) => (
          <div key={adv.id} className={styles.advisorCardDetailed}>
            <div className={styles.advisorCardHeader}>
              <div className={styles.advisorPhotoWrap}>
                <button
                  type="button"
                  className={styles.advisorPhotoBtn}
                  onClick={() => openAdvisorModal(adv)}
                  title={`Ampliar foto y ver ficha técnica de ${adv.name}`}
                  aria-label={`Ver foto y ficha técnica de ${adv.name}`}
                >
                  <Image
                    src={adv.photo}
                    alt={`Foto ${adv.name}`}
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
                    <span className={styles.assigned}>Asignado</span>
                  )}
                </div>
                <small className={styles.advisorLicenseText}>
                  {adv.license}
                </small>
                <div className={styles.advisorRatingRow}>
                  ★ {adv.rating} · {adv.success} Acierto ({adv.proposals}{' '}
                  propuestas)
                </div>
              </div>
            </div>

            <p className={styles.advisorBioText}>{adv.bio}</p>

            <div className={styles.advisorActionList}>
              {adv.assigned ? (
                <>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() =>
                      alert(
                        `Sesión de asesoría agendada con ${adv.name}. Te llegará un correo de confirmación.`,
                      )
                    }
                  >
                    Agendar Asesoría
                  </button>
                  <button
                    type="button"
                    className={styles.borderedNavBtn}
                    onClick={() => onNavigate('orders')}
                  >
                    Operar con su estrategia
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() =>
                    alert(
                      `Solicitud de asignación enviada para estructurar tu portafolio con ${adv.name}.`,
                    )
                  }
                >
                  Seleccionar como Asesor
                </button>
              )}
              <button
                type="button"
                className={styles.borderedNavBtn}
                onClick={() => openAdvisorModal(adv)}
              >
                🔍 Ver Ficha Técnica y Foto Ampliada
              </button>
            </div>
          </div>
        ))}
      </div>

      <dialog ref={advisorDialog} className={styles.advisorDetailDialog}>
        <form method="dialog">
          <button className={styles.modalCloseBtn} aria-label="Cerrar ventana">
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
                    <span className={styles.assigned}>Asesor Asignado</span>
                  )}
                </div>
                <small className={styles.advisorLicenseText}>
                  {selectedAdvisor.license}
                </small>
                <div className={styles.advisorRatingRow}>
                  ★ {selectedAdvisor.rating} · Calificación auditada
                </div>
              </div>
            </div>

            <div className={styles.advisorStatsGrid}>
              <div className={styles.advisorStatBox}>
                <small>Efectividad</small>
                <strong>{selectedAdvisor.success}</strong>
              </div>
              <div className={styles.advisorStatBox}>
                <small>Propuestas</small>
                <strong>{selectedAdvisor.proposals}</strong>
              </div>
              <div className={styles.advisorStatBox}>
                <small>Mercados</small>
                <strong>NYSE / NASDAQ</strong>
              </div>
            </div>

            <div className={styles.advisorStrategyBox}>
              <h4>Especialidad y Perfil Profesional</h4>
              <p>{selectedAdvisor.bio}</p>
            </div>

            <div className={styles.advisorStrategyBox}>
              <h4>Tesis y Estrategia de Inversión</h4>
              <p>{selectedAdvisor.strategy}</p>
              <div className={styles.advisorAssetsPills}>
                <span className={styles.advisorLicenseText}>
                  Activos recomendados:
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
                Cerrar
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  advisorDialog.current?.close();
                  onNavigate('orders');
                }}
              >
                Operar con su estrategia en Wall Street
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
