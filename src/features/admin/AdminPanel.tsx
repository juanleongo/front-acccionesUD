'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/ui/LoadingState';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { SessionClosedOverlay } from '@/components/ui/SessionClosedOverlay';
import { ApiError, subscribeSessionExpired } from '@/lib/api';
import { formatPersonName } from '@/lib/format-person-name';
import { useLocale } from '@/lib/i18n';
import { toggleDocumentTheme } from '@/lib/theme';
import {
  activateBroker,
  createAdministrator,
  createMarketOverride,
  deleteMarketOverride,
  getAdminAuditLog,
  getAdminUsersDirectory,
  listMarketOverrides,
  reconcileUserKyc,
  setMarketDefaultSchedule,
  setUserPremium,
  type AdminCreateAdminIn,
  type AuditEntry,
  type ManagedUserItem,
  type PendingBrokerItem,
  type ScheduleOverride,
} from './admin-api';
import { adminRead, marketSchema } from './operations/operations-api';
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

const RealKpis = dynamic(() =>
  import('./operations/FinanceOperations').then((module) => module.RealKpis),
);
const CommissionOperations = dynamic(() =>
  import('./operations/FinanceOperations').then(
    (module) => module.CommissionOperations,
  ),
);
const FeeOperations = dynamic(() =>
  import('./operations/FinanceOperations').then(
    (module) => module.FeeOperations,
  ),
);
const HaltOperations = dynamic(() =>
  import('./operations/HaltOperations').then((module) => module.HaltOperations),
);
const ComplianceOperations = dynamic(() =>
  import('./operations/ComplianceOperations').then(
    (module) => module.ComplianceOperations,
  ),
);
const AuditOperations = dynamic(() =>
  import('./operations/AuditOperations').then(
    (module) => module.AuditOperations,
  ),
);
const MarketOperations = dynamic(() =>
  import('./operations/MarketOperations').then(
    (module) => module.MarketOperations,
  ),
);

const EMPTY_ADMIN_FORM: AdminCreateAdminIn = {
  first_names: '',
  last_names: '',
  email: '',
  phone: '+57',
  country: 'CO',
  password: '',
};

interface AuditState {
  items: AuditEntry[];
  loadedForFilter: string | null;
  isLive: boolean;
}

export function AdminPanel() {
  const { tx } = useLocale();
  const [marketLoadedFor, setMarketLoadedFor] = useState<string | null>(null);
  const [marketError, setMarketError] = useState(false);
  const [auditError, setAuditError] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('kpi');
  const [brokers, setBrokers] = useState<PendingBrokerItem[]>([]);
  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [auditState, setAuditState] = useState<AuditState>({
    items: [],
    loadedForFilter: null,
    isLive: false,
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const notificationTimerRef = useRef<number | null>(null);

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
        if (!controller.signal.aborted) {
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
              registeredAt: item.registered_at,
            })),
          );
          const brokerEntries = page.items.filter(
            (item) =>
              item.account_status === 'pending_broker_activation' ||
              item.roles.includes('broker') ||
              item.broker_requested,
          );
          {
            setBrokers(
              brokerEntries.map((item) => ({
                userId: item.user_id,
                fullName: formatPersonName(
                  `${item.first_names} ${item.last_names}`,
                ),
                email: item.email,
                phone: item.phone ?? '—',
                country: item.country ?? '—',
                licenseAMV: '—',
                specialty: '—',
                requestedAt: item.registered_at,
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
        if (!controller.signal.aborted) setDirectoryError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDirectoryLoading(false);
      });

    return () => {
      unsubscribe();
      controller.abort();
      if (notificationTimerRef.current !== null) {
        window.clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getAdminAuditLog(auditFilterAction || undefined, controller.signal)
      .then((page) => {
        setAuditError(false);
        setAuditState({
          items: page.items,
          loadedForFilter: auditFilterAction,
          isLive: true,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.metadata.status === 401) {
          setSessionClosed(true);
          return;
        }
        if (controller.signal.aborted) return;
        setAuditError(true);
        setAuditState((prev) => ({
          items: prev.isLive ? prev.items : [],
          loadedForFilter: auditFilterAction,
          isLive: prev.isLive,
        }));
      });

    return () => controller.abort();
  }, [auditFilterAction]);

  useEffect(() => {
    if (activeTab !== 'markets') return;
    const controller = new AbortController();
    Promise.all([
      adminRead(
        `/admin/markets/${encodeURIComponent(selectedMarket)}`,
        marketSchema,
        {},
        controller.signal,
      ),
      listMarketOverrides(selectedMarket, controller.signal),
    ])
      .then(([market, overrides]) => {
        if (controller.signal.aborted) return;
        setOpenTime(
          typeof market.default_schedule?.open_time === 'string'
            ? market.default_schedule.open_time.slice(0, 5)
            : '',
        );
        setCloseTime(
          typeof market.default_schedule?.close_time === 'string'
            ? market.default_schedule.close_time.slice(0, 5)
            : '',
        );
        setOverrides(overrides);
        setMarketError(false);
        setMarketLoadedFor(selectedMarket);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMarketError(true);
          setMarketLoadedFor(selectedMarket);
        }
      });
    return () => controller.abort();
  }, [activeTab, selectedMarket]);

  function clearNotification() {
    if (notificationTimerRef.current !== null) {
      window.clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setSuccessMsg('');
    setErrorMsg('');
  }

  function showNotification(msg: string, isError = false) {
    if (notificationTimerRef.current !== null) {
      window.clearTimeout(notificationTimerRef.current);
    }
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
    notificationTimerRef.current = window.setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
      notificationTimerRef.current = null;
    }, 6000);
  }

  async function handleActivateBroker(broker: PendingBrokerItem) {
    if (processingId) return;
    setProcessingId(broker.userId);
    try {
      await activateBroker(broker.userId);
      setBrokers((prev) =>
        prev.map((b) =>
          b.userId === broker.userId ? { ...b, status: 'active' as const } : b,
        ),
      );
      showNotification(
        tx(
          `Comisionista ${broker.fullName} verificado y activado formalmente. Licencia AMV confirmada.`,
          `Broker ${broker.fullName} verified and officially activated. AMV license confirmed.`,
        ),
      );
    } catch {
      showNotification(
        tx(
          'Error al activar comisionista en el servidor.',
          'Failed to activate broker on server.',
        ),
        true,
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleTogglePremium(user: ManagedUserItem) {
    if (processingId) return;
    setProcessingId(user.userId);
    const nextVal = !user.isPremium;
    try {
      await setUserPremium(user.userId, nextVal);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId ? { ...u, isPremium: nextVal } : u,
        ),
      );
      showNotification(
        tx(
          `Plan Prémium ${nextVal ? 'concedido' : 'revocado'} para ${user.fullName} (${user.email}).`,
          `Premium Plan ${nextVal ? 'granted' : 'revoked'} for ${user.fullName} (${user.email}).`,
        ),
      );
    } catch {
      showNotification(
        tx(
          'Error al actualizar plan prémium en el servidor.',
          'Failed to update premium plan on server.',
        ),
        true,
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleSaveMarketSchedule(e: FormEvent) {
    e.preventDefault();
    if (!openTime || !closeTime || openTime >= closeTime) {
      showNotification(
        tx(
          'Ingresa un horario válido donde la hora de apertura sea anterior al cierre.',
          'Enter a valid schedule where the open time is before close time.',
        ),
        true,
      );
      return;
    }
    try {
      await setMarketDefaultSchedule(selectedMarket, openTime, closeTime);
      showNotification(
        tx(
          `Horario oficial de ${selectedMarket} actualizado: Apertura ${openTime} EST · Cierre ${closeTime} EST.`,
          `${selectedMarket} official hours updated: Open ${openTime} EST · Close ${closeTime} EST.`,
        ),
      );
    } catch {
      showNotification(
        tx(
          'Error al configurar horario del mercado.',
          'Failed to configure market hours.',
        ),
        true,
      );
    }
  }

  async function handleCreateOverride(e: FormEvent) {
    e.preventDefault();
    if (!newOverrideDate) {
      showNotification(
        tx(
          'Debes seleccionar una fecha para la excepción.',
          'Select a date for the calendar override.',
        ),
        true,
      );
      return;
    }
    if (
      !newOverrideClosed &&
      (!newOverrideOpenTime ||
        !newOverrideCloseTime ||
        newOverrideOpenTime >= newOverrideCloseTime)
    ) {
      showNotification(
        tx(
          'Ingresa un horario especial válido donde la apertura sea anterior al cierre.',
          'Enter valid special hours where open is before close.',
        ),
        true,
      );
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
      const created = await createMarketOverride(selectedMarket, {
        date: payload.date,
        closed: payload.closed,
        open_time: payload.open_time,
        close_time: payload.close_time,
      });
      setOverrides((prev) => [created, ...prev]);
      setNewOverrideDate('');
      showNotification(
        tx(
          `Excepción registrada para ${selectedMarket} en fecha ${payload.date} (${payload.closed ? 'Mercado Cerrado' : `Horario Especial ${payload.open_time} - ${payload.close_time}`}).`,
          `Override registered for ${selectedMarket} on ${payload.date} (${payload.closed ? 'Market Closed' : `Special Hours ${payload.open_time} - ${payload.close_time}`}).`,
        ),
      );
    } catch {
      showNotification(
        tx(
          'Error al crear excepción de mercado.',
          'Failed to create market override.',
        ),
        true,
      );
    }
  }

  async function handleDeleteOverride(overrideId: string) {
    try {
      await deleteMarketOverride(selectedMarket, overrideId);
      setOverrides((prev) => prev.filter((o) => o.id !== overrideId));
      showNotification(
        tx(
          'Excepción eliminada del calendario bursátil.',
          'Override removed from trading calendar.',
        ),
      );
    } catch {
      showNotification(
        tx('Error al eliminar excepción.', 'Failed to delete override.'),
        true,
      );
    }
  }

  async function handleCreateAdministrator(e: FormEvent) {
    e.preventDefault();
    if (!newAdmin.first_names.trim() || !newAdmin.last_names.trim()) {
      showNotification(
        tx(
          'Ingresa los nombres y apellidos completos del administrador.',
          'Enter the administrator’s full first and last name.',
        ),
        true,
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdmin.email.trim())) {
      showNotification(
        tx(
          'Ingresa un correo electrónico institucional válido.',
          'Enter a valid institutional email address.',
        ),
        true,
      );
      return;
    }
    if (!/^\+[1-9][0-9]{1,14}$/.test(newAdmin.phone.trim())) {
      showNotification(
        tx(
          'El teléfono debe incluir indicativo (+) seguido solo de dígitos (ej. +573001234567).',
          'Phone must include country code (+) followed by digits only (e.g. +573001234567).',
        ),
        true,
      );
      return;
    }
    if (
      newAdmin.password.length < 8 ||
      !/(?=.*\p{L})(?=.*\p{N})/u.test(newAdmin.password)
    ) {
      showNotification(
        tx(
          'La contraseña debe tener mínimo 8 caracteres e incluir al menos una letra y un número.',
          'Password must be at least 8 characters with at least one letter and one digit.',
        ),
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
        tx(
          `La cuenta de ${newAdmin.email} se creó correctamente. Ya tiene acceso como administrador.`,
          `Account ${newAdmin.email} created successfully with administrator access.`,
        ),
      );
    } catch {
      showNotification(
        tx(
          'Error al crear administrador en el servidor.',
          'Failed to create administrator on server.',
        ),
        true,
      );
    }
  }

  async function handleReconcileKyc(user: ManagedUserItem) {
    if (processingId) return;
    setProcessingId(user.userId);
    try {
      const res = await reconcileUserKyc(user.userId);
      showNotification(
        tx(
          `Cuenta KYC de ${user.fullName} reconciliada con Alpaca (${res.alpaca_account_id} · estado ${res.status ?? 'ACTIVE'}).`,
          `KYC account for ${user.fullName} reconciled with Alpaca (${res.alpaca_account_id} · status ${res.status ?? 'ACTIVE'}).`,
        ),
      );
    } catch {
      showNotification(
        tx(
          `No se pudo reconciliar la cuenta de ${user.fullName}.`,
          `Could not reconcile the account for ${user.fullName}.`,
        ),
        true,
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = brokers.filter(
    (b) => b.status === 'pending_broker_activation',
  ).length;
  const auditLoading = auditState.loadedForFilter !== auditFilterAction;

  if (sessionClosed) {
    return <SessionClosedOverlay />;
  }

  return (
    <div className={styles.container}>
      <AdminHeader onToggleTheme={toggleDocumentTheme} />

      <div className={styles.mainLayout}>
        <AdminSidebar
          activeTab={activeTab}
          pendingCount={pendingCount}
          onSelectTab={setActiveTab}
        />

        <main className={styles.contentArea}>
          {successMsg && (
            <div className={styles.alertSuccess} role="status">
              <div className={styles.alertBody}>
                <Icon name="check" size={20} />
                <div>
                  <strong>
                    {tx('Operación completada', 'Operation completed')}
                  </strong>
                  <p>{successMsg}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.alertDismissBtn}
                onClick={clearNotification}
                aria-label={tx('Cerrar mensaje', 'Dismiss message')}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className={styles.alertError} role="alert">
              <div className={styles.alertBody}>
                <Icon name="info" size={18} />
                <p>{errorMsg}</p>
              </div>
              <button
                type="button"
                className={styles.alertDismissBtn}
                onClick={clearNotification}
                aria-label={tx('Cerrar alerta', 'Dismiss alert')}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          )}

          {directoryLoading &&
            ['kpi', 'users', 'brokers'].includes(activeTab) && (
              <LoadingState
                mode="compact"
                label={tx('Consultando cuentas…', 'Loading accounts…')}
              />
            )}
          {directoryError &&
            ['kpi', 'users', 'brokers'].includes(activeTab) && (
              <p className={styles.alertError} role="alert">
                {tx(
                  'No pudimos consultar el directorio. Vuelve a abrir el panel para reintentar.',
                  'Could not load the directory. Reopen the panel to retry.',
                )}
              </p>
            )}
          {activeTab === 'kpi' && (
            <>
              <header className={styles.pageHeader}>
                <h1>
                  {tx('Resumen de administración', 'Administration overview')}
                </h1>
                <p>
                  {tx(
                    'Actividad, cuentas y solicitudes que requieren tu atención.',
                    'Activity, accounts and applications requiring your attention.',
                  )}
                </p>
              </header>
              <RealKpis />
            </>
          )}
          {activeTab === 'commissions' && <CommissionOperations />}
          {activeTab === 'fees' && <FeeOperations />}
          {activeTab === 'halts' && <HaltOperations />}
          {activeTab === 'compliance' && <ComplianceOperations />}
          {activeTab === 'trail' && <AuditOperations />}
          {activeTab === 'markets' && <MarketOperations />}
          {activeTab === 'kpi' && !directoryLoading && !directoryError && (
            <AdminKpiSection
              brokers={brokers}
              processingId={processingId}
              onViewAllBrokers={() => setActiveTab('brokers')}
              onActivateBroker={handleActivateBroker}
            />
          )}

          {activeTab === 'brokers' && !directoryLoading && !directoryError && (
            <AdminBrokersSection
              brokers={brokers}
              processingId={processingId}
              onActivateBroker={handleActivateBroker}
            />
          )}

          {activeTab === 'users' && !directoryLoading && !directoryError && (
            <AdminUsersSection
              users={users}
              processingId={processingId}
              onTogglePremium={handleTogglePremium}
              onReconcileKyc={handleReconcileKyc}
            />
          )}

          {activeTab === 'rbac' && <AdminRbacSection />}

          {activeTab === 'markets' && marketLoadedFor !== selectedMarket && (
            <LoadingState
              mode="compact"
              label={tx(
                'Consultando horario configurado…',
                'Loading configured schedule…',
              )}
            />
          )}
          {activeTab === 'markets' &&
            marketLoadedFor === selectedMarket &&
            marketError && (
              <p className={styles.alertError} role="alert">
                {tx(
                  'No pudimos consultar la configuración de esta bolsa.',
                  'Could not load this exchange configuration.',
                )}
              </p>
            )}
          {activeTab === 'markets' &&
            marketLoadedFor === selectedMarket &&
            !marketError && (
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

          {activeTab === 'audit' && auditError && (
            <p className={styles.alertError} role="alert">
              {tx(
                'No se pudo actualizar la bitácora. Los registros conservados pueden estar desactualizados.',
                'Could not refresh the audit log. Retained records may be outdated.',
              )}
            </p>
          )}
          {activeTab === 'audit' && (
            <AdminAuditSection
              auditLogs={auditState.items}
              users={users}
              auditFilterAction={auditFilterAction}
              loading={auditLoading}
              onChangeFilterAction={setAuditFilterAction}
            />
          )}
        </main>
      </div>
    </div>
  );
}
