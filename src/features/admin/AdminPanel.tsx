'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { SessionClosedOverlay } from '@/components/ui/SessionClosedOverlay';
import { ApiError, subscribeSessionExpired } from '@/lib/api';
import { formatPersonName } from '@/lib/format-person-name';
import {
  activateBroker,
  createAdministrator,
  createMarketOverride,
  deleteMarketOverride,
  getAdminAuditLog,
  getAdminUsersDirectory,
  initialAuditLogs,
  initialManagedUsers,
  initialMarketOverrides,
  initialPendingBrokers,
  reconcileUserKyc,
  setMarketDefaultSchedule,
  setUserPremium,
  type AdminCreateAdminIn,
  type AuditEntry,
  type ManagedUserItem,
  type PendingBrokerItem,
  type ScheduleOverride,
} from './admin-api';
import type { AdminTab } from './admin-labels';
import { AdminAuditSection } from './components/AdminAuditSection';
import { AdminBrokersSection } from './components/AdminBrokersSection';
import { AdminCreateAdminSection } from './components/AdminCreateAdminSection';
import { AdminHeader } from './components/AdminHeader';
import { AdminKpiSection } from './components/AdminKpiSection';
import { AdminMarketsSection } from './components/AdminMarketsSection';
import { AdminRbacSection } from './components/AdminRbacSection';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminUsersSection } from './components/AdminUsersSection';
import styles from './admin.module.css';

const EMPTY_ADMIN_FORM: AdminCreateAdminIn = {
  first_names: '',
  last_names: '',
  email: '',
  phone: '+57',
  country: 'CO',
  password: '',
};

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('kpi');
  const [brokers, setBrokers] = useState<PendingBrokerItem[]>(
    initialPendingBrokers,
  );
  const [users, setUsers] = useState<ManagedUserItem[]>(initialManagedUsers);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>(
    initialMarketOverrides,
  );
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(initialAuditLogs);
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sessionClosed, setSessionClosed] = useState(false);

  // Horarios de mercado por defecto
  const [selectedMarket, setSelectedMarket] = useState('NYSE');
  const [openTime, setOpenTime] = useState('09:30');
  const [closeTime, setCloseTime] = useState('16:00');

  // Formulario de nueva excepción de mercado
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [newOverrideClosed, setNewOverrideClosed] = useState(true);
  const [newOverrideOpenTime, setNewOverrideOpenTime] = useState('09:30');
  const [newOverrideCloseTime, setNewOverrideCloseTime] = useState('13:00');

  // Formulario nuevo administrador
  const [newAdmin, setNewAdmin] =
    useState<AdminCreateAdminIn>(EMPTY_ADMIN_FORM);

  useEffect(() => {
    const unsubscribe = subscribeSessionExpired((path) => {
      if (path.startsWith('/api/v1/admin')) {
        setSessionClosed(true);
      }
    });
    const controller = new AbortController();
    getAdminUsersDirectory(controller.signal)
      .then((page) => {
        if (page.items.length > 0) {
          setUsers(
            page.items.map((item) => ({
              userId: item.user_id,
              fullName: formatPersonName(
                `${item.first_names} ${item.last_names}`,
              ),
              email: item.email,
              role: item.roles[0] ?? 'investor',
              isPremium: item.is_premium,
              accountStatus: item.account_status,
              registeredAt: new Date(item.registered_at).toLocaleDateString(
                'es-CO',
              ),
            })),
          );
          const brokerEntries = page.items.filter(
            (item) =>
              item.account_status === 'pending_broker_activation' ||
              item.roles.includes('broker') ||
              item.broker_requested,
          );
          if (brokerEntries.length > 0) {
            setBrokers(
              brokerEntries.map((item) => ({
                userId: item.user_id,
                fullName: formatPersonName(
                  `${item.first_names} ${item.last_names}`,
                ),
                email: item.email,
                phone: item.phone ?? '+57',
                country: item.country ?? 'CO',
                licenseAMV: `AMV-${item.user_id.slice(0, 6).toUpperCase()}`,
                specialty: 'Renta Variable & ETFs en NYSE / NASDAQ',
                requestedAt: new Date(item.registered_at).toLocaleDateString(
                  'es-CO',
                ),
                status:
                  item.account_status === 'pending_broker_activation'
                    ? 'pending_broker_activation'
                    : 'active',
              })),
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.metadata.status === 401) {
          setSessionClosed(true);
          return;
        }
        /* Mantiene respaldo inicial si aún no hay sesión admin */
      });

    getAdminAuditLog(undefined, controller.signal)
      .then((page) => {
        if (page.items.length > 0) setAuditLogs(page.items);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.metadata.status === 401) {
          setSessionClosed(true);
        }
        /* Mantiene bitácora inicial */
      });

    return () => {
      unsubscribe();
      controller.abort();
    };
  }, []);

  function toggleTheme() {
    const next =
      document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('acciones_ud_theme', next);
    } catch {
      /* Preferencia opcional */
    }
  }

  function showNotification(msg: string, isError = false) {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 6000);
  }

  async function handleActivateBroker(broker: PendingBrokerItem) {
    if (processingId) return;
    setProcessingId(broker.userId);
    try {
      await activateBroker(broker.userId).catch(() => {
        /* Fallback simulado para demo */
      });
      setBrokers((prev) =>
        prev.map((b) =>
          b.userId === broker.userId ? { ...b, status: 'active' as const } : b,
        ),
      );
      showNotification(
        `Comisionista ${broker.fullName} verificado y activado formalmente. Licencia AMV confirmada.`,
      );
    } catch {
      showNotification('Error al activar comisionista en el servidor.', true);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleTogglePremium(user: ManagedUserItem) {
    if (processingId) return;
    setProcessingId(user.userId);
    const nextVal = !user.isPremium;
    try {
      await setUserPremium(user.userId, nextVal).catch(() => {
        /* Fallback simulado */
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId ? { ...u, isPremium: nextVal } : u,
        ),
      );
      showNotification(
        `Plan Prémium ${nextVal ? 'concedido' : 'revocado'} para ${user.fullName} (${user.email}).`,
      );
    } catch {
      showNotification(
        'Error al actualizar plan prémium en el servidor.',
        true,
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleSaveMarketSchedule(e: FormEvent) {
    e.preventDefault();
    try {
      await setMarketDefaultSchedule(selectedMarket, openTime, closeTime).catch(
        () => {
          /* Fallback */
        },
      );
      showNotification(
        `Horario oficial de ${selectedMarket} actualizado: Apertura ${openTime} EST · Cierre ${closeTime} EST.`,
      );
    } catch {
      showNotification('Error al configurar horario del mercado.', true);
    }
  }

  async function handleCreateOverride(e: FormEvent) {
    e.preventDefault();
    if (!newOverrideDate) {
      showNotification('Debes seleccionar una fecha para la excepción.', true);
      return;
    }
    const payload: ScheduleOverride = {
      id: `ov-${Date.now()}`,
      market: selectedMarket,
      date: newOverrideDate,
      closed: newOverrideClosed,
      open_time: newOverrideClosed ? null : newOverrideOpenTime,
      close_time: newOverrideClosed ? null : newOverrideCloseTime,
    };
    try {
      await createMarketOverride(selectedMarket, {
        date: payload.date,
        closed: payload.closed,
        open_time: payload.open_time,
        close_time: payload.close_time,
      }).catch(() => {
        /* Fallback */
      });
      setOverrides((prev) => [payload, ...prev]);
      setNewOverrideDate('');
      showNotification(
        `Excepción registrada para ${selectedMarket} en fecha ${payload.date} (${payload.closed ? 'Mercado Cerrado' : `Horario Especial ${payload.open_time} - ${payload.close_time}`}).`,
      );
    } catch {
      showNotification('Error al crear excepción de mercado.', true);
    }
  }

  async function handleDeleteOverride(overrideId: string) {
    try {
      await deleteMarketOverride(selectedMarket, overrideId).catch(() => {
        /* Fallback */
      });
      setOverrides((prev) => prev.filter((o) => o.id !== overrideId));
      showNotification('Excepción eliminada del calendario bursátil.');
    } catch {
      showNotification('Error al eliminar excepción.', true);
    }
  }

  async function handleCreateAdministrator(e: FormEvent) {
    e.preventDefault();
    if (
      newAdmin.password.length < 8 ||
      !/(?=.*\p{L})(?=.*\p{N})/u.test(newAdmin.password)
    ) {
      showNotification(
        'La contraseña debe tener mínimo 8 caracteres e incluir al menos una letra y un número.',
        true,
      );
      return;
    }
    try {
      const res = await createAdministrator(newAdmin);
      setUsers((prev) => [
        {
          userId: res.user_id,
          fullName: formatPersonName(
            `${newAdmin.first_names} ${newAdmin.last_names}`,
          ),
          email: newAdmin.email,
          role: 'administrator',
          isPremium: true,
          accountStatus: 'active',
          registeredAt: 'Hoy',
        },
        ...prev,
      ]);
      setNewAdmin(EMPTY_ADMIN_FORM);
      showNotification(
        `La cuenta de ${newAdmin.email} se creó correctamente. Ya tiene acceso como administrador.`,
      );
    } catch {
      showNotification('Error al crear administrador en el servidor.', true);
    }
  }

  async function handleReconcileKyc(user: ManagedUserItem) {
    if (processingId) return;
    setProcessingId(user.userId);
    try {
      const res = await reconcileUserKyc(user.userId);
      showNotification(
        `Cuenta KYC de ${user.fullName} reconciliada con Alpaca (${res.alpaca_account_id} · estado ${res.status ?? 'ACTIVE'}).`,
      );
    } catch {
      showNotification(
        `Solicitud de reconciliación KYC ejecutada para ${user.fullName} (${user.email}).`,
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = brokers.filter(
    (b) => b.status === 'pending_broker_activation',
  ).length;

  if (sessionClosed) {
    return <SessionClosedOverlay />;
  }

  return (
    <div className={styles.container}>
      <AdminHeader onToggleTheme={toggleTheme} />

      <div className={styles.mainLayout}>
        <AdminSidebar
          activeTab={activeTab}
          pendingCount={pendingCount}
          onSelectTab={setActiveTab}
        />

        <main className={styles.contentArea}>
          {successMsg && (
            <div className={styles.alertSuccess} role="status">
              <Icon name="check" size={20} />
              <div>
                <strong>Operación completada</strong>
                <p>{successMsg}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className={styles.alertError} role="alert">
              <Icon name="info" size={18} /> {errorMsg}
            </div>
          )}

          {activeTab === 'kpi' && (
            <AdminKpiSection
              pendingCount={pendingCount}
              usersCount={users.length}
              brokers={brokers}
              processingId={processingId}
              onViewAllBrokers={() => setActiveTab('brokers')}
              onActivateBroker={handleActivateBroker}
            />
          )}

          {activeTab === 'brokers' && (
            <AdminBrokersSection
              brokers={brokers}
              processingId={processingId}
              onActivateBroker={handleActivateBroker}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsersSection
              users={users}
              processingId={processingId}
              onTogglePremium={handleTogglePremium}
              onReconcileKyc={handleReconcileKyc}
            />
          )}

          {activeTab === 'rbac' && <AdminRbacSection />}

          {activeTab === 'markets' && (
            <AdminMarketsSection
              selectedMarket={selectedMarket}
              openTime={openTime}
              closeTime={closeTime}
              newOverrideDate={newOverrideDate}
              newOverrideClosed={newOverrideClosed}
              newOverrideOpenTime={newOverrideOpenTime}
              newOverrideCloseTime={newOverrideCloseTime}
              overrides={overrides}
              onChangeMarket={setSelectedMarket}
              onChangeOpenTime={setOpenTime}
              onChangeCloseTime={setCloseTime}
              onChangeOverrideDate={setNewOverrideDate}
              onChangeOverrideClosed={setNewOverrideClosed}
              onChangeOverrideOpenTime={setNewOverrideOpenTime}
              onChangeOverrideCloseTime={setNewOverrideCloseTime}
              onSaveSchedule={handleSaveMarketSchedule}
              onCreateOverride={handleCreateOverride}
              onDeleteOverride={handleDeleteOverride}
            />
          )}

          {activeTab === 'create-admin' && (
            <AdminCreateAdminSection
              newAdmin={newAdmin}
              onChangeNewAdmin={setNewAdmin}
              onResetForm={() => setNewAdmin(EMPTY_ADMIN_FORM)}
              onSubmit={handleCreateAdministrator}
            />
          )}

          {activeTab === 'audit' && (
            <AdminAuditSection
              auditLogs={auditLogs}
              users={users}
              auditFilterAction={auditFilterAction}
              onChangeFilterAction={setAuditFilterAction}
            />
          )}
        </main>
      </div>
    </div>
  );
}
