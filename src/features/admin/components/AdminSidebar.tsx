'use client';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type { AdminTab } from '../admin-labels';
import styles from '../admin.module.css';

export interface AdminSidebarProps {
  activeTab: AdminTab;
  pendingCount: number;
  onSelectTab: (tab: AdminTab) => void;
}

const navItems: ReadonlyArray<{
  id: AdminTab;
  label: string;
  labelEn: string;
  icon: IconName;
  showBadge?: boolean;
}> = [
  {
    id: 'kpi',
    label: 'Resumen & Métricas',
    labelEn: 'Overview & KPIs',
    icon: 'grid',
  },
  {
    id: 'brokers',
    label: 'Activación de Comisionistas',
    labelEn: 'Broker Activation',
    icon: 'users',
    showBadge: true,
  },
  {
    id: 'users',
    label: 'Usuarios & Plan Prémium',
    labelEn: 'Users & Premium',
    icon: 'user',
  },
  {
    id: 'rbac',
    label: 'Roles & Permisos (RBAC)',
    labelEn: 'Roles & Permissions',
    icon: 'shield',
  },
  {
    id: 'markets',
    label: 'Horarios Bursátiles (Wall St.)',
    labelEn: 'Market Hours (Wall St.)',
    icon: 'trend',
  },
  {
    id: 'create-admin',
    label: 'Alta de Administradores',
    labelEn: 'Create Administrator',
    icon: 'lock',
  },
  {
    id: 'audit',
    label: 'Bitácora de Auditoría',
    labelEn: 'Audit Log',
    icon: 'devices',
  },
];

export function AdminSidebar({
  activeTab,
  pendingCount,
  onSelectTab,
}: AdminSidebarProps) {
  const { tx } = useLocale();
  return (
    <aside
      className={styles.sidebar}
      aria-label={tx('Módulos de Administración', 'Admin Modules')}
    >
      <div className={styles.sidebarTitle}>
        {tx('Módulos de Administración', 'Admin Modules')}
      </div>
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={activeTab === item.id ? 'page' : undefined}
          className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
          onClick={() => onSelectTab(item.id)}
        >
          <Icon name={item.icon} size={18} />
          <span>{tx(item.label, item.labelEn)}</span>
          {item.showBadge && pendingCount > 0 && (
            <span className={styles.badgeCount}>{pendingCount}</span>
          )}
        </button>
      ))}
    </aside>
  );
}
