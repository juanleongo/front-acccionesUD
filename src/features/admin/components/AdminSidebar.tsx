'use client';

import { Icon, type IconName } from '@/components/ui/Icon';
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
  icon: IconName;
  showBadge?: boolean;
}> = [
  { id: 'kpi', label: 'Resumen & Métricas', icon: 'grid' },
  {
    id: 'brokers',
    label: 'Activación de Comisionistas',
    icon: 'users',
    showBadge: true,
  },
  { id: 'users', label: 'Usuarios & Plan Prémium', icon: 'user' },
  { id: 'rbac', label: 'Roles & Permisos (RBAC)', icon: 'shield' },
  { id: 'markets', label: 'Horarios Bursátiles (Wall St.)', icon: 'trend' },
  { id: 'create-admin', label: 'Alta de Administradores', icon: 'lock' },
  { id: 'audit', label: 'Bitácora de Auditoría', icon: 'devices' },
];

export function AdminSidebar({
  activeTab,
  pendingCount,
  onSelectTab,
}: AdminSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Módulos de Administración</div>
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
          onClick={() => onSelectTab(item.id)}
        >
          <Icon name={item.icon} size={18} /> {item.label}
          {item.showBadge && pendingCount > 0 && (
            <span className={styles.badgeCount}>{pendingCount}</span>
          )}
        </button>
      ))}
    </aside>
  );
}
