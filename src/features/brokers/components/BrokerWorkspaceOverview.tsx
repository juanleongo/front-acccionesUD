'use client';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import styles from '../brokers.module.css';

export function BrokerWorkspaceOverview({
  requests,
  clients,
  reviews,
  onOpen,
}: {
  requests: number;
  clients: number;
  reviews: number;
  onOpen: (section: 'clients' | 'new-proposal' | 'reviews-reports') => void;
}) {
  const { tx } = useLocale();
  return (
    <section
      className={styles.workspace}
      aria-label={tx(
        'Resumen del espacio de asesoría',
        'Advisory workspace overview',
      )}
    >
      <div className={styles.workspaceHeading}>
        <div>
          <span className={styles.workspaceEyebrow}>
            {tx('Espacio de asesoría', 'Advisory workspace')}
          </span>
          <h3>
            {tx('Tu jornada como comisionista', 'Your brokerage workspace')}
          </h3>
          <p>
            {tx(
              'Organiza tus solicitudes, acompaña a tus clientes y prepara nuevas propuestas.',
              'Organize requests, support your clients, and prepare investment proposals.',
            )}
          </p>
        </div>
        <span className={styles.badgeWarning}>
          {tx(
            'Vista previa · Datos ilustrativos',
            'Preview · Illustrative data',
          )}
        </span>
      </div>
      <div className={styles.workspaceGrid}>
        {[
          {
            id: 'clients' as const,
            icon: 'users' as const,
            value: requests,
            label: tx('Solicitudes pendientes', 'Pending requests'),
            hint: tx(
              'Revisa quién solicita tu asesoría',
              'Review new advisory requests',
            ),
          },
          {
            id: 'clients' as const,
            icon: 'user' as const,
            value: clients,
            label: tx('Clientes vinculados', 'Linked clients'),
            hint: tx(
              'Consulta permisos y acompañamiento',
              'Review permissions and advisory links',
            ),
          },
          {
            id: 'reviews-reports' as const,
            icon: 'shield' as const,
            value: reviews,
            label: tx('Órdenes por revisar', 'Orders to review'),
            hint: tx(
              'Da seguimiento a las decisiones de tus clientes',
              'Follow up on client decisions',
            ),
          },
        ].map((item, index) => (
          <button
            type="button"
            className={styles.workspaceMetric}
            key={index}
            onClick={() => onOpen(item.id)}
          >
            <span className={styles.workspaceMetricIcon}>
              <Icon name={item.icon} size={20} />
            </span>
            <span className={styles.workspaceMetricBody}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.hint}</small>
            </span>
            <Icon name="arrow" size={16} />
          </button>
        ))}
      </div>
      <div className={styles.workspaceAction}>
        <span>
          <Icon name="trend" size={18} />
          {tx(
            'Convierte tu análisis en una propuesta para tus clientes.',
            'Turn your analysis into a proposal for your clients.',
          )}
        </span>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => onOpen('new-proposal')}
        >
          {tx('Crear propuesta', 'Create proposal')}
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </section>
  );
}
