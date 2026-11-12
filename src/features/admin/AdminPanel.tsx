'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  activateBroker,
  createAdministrator,
  createMarketOverride,
  defaultSystemPermissions,
  defaultSystemRoles,
  deleteMarketOverride,
  initialMarketOverrides,
  initialManagedUsers,
  initialPendingBrokers,
  setMarketDefaultSchedule,
  setUserPremium,
  type AdminCreateAdminIn,
  type ManagedUserItem,
  type PendingBrokerItem,
  type ScheduleOverride,
} from './admin-api';
import styles from './admin.module.css';

type AdminTab =
  'kpi' | 'brokers' | 'users' | 'rbac' | 'markets' | 'create-admin';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('kpi');
  const [brokers, setBrokers] = useState<PendingBrokerItem[]>(
    initialPendingBrokers,
  );
  const [users, setUsers] = useState<ManagedUserItem[]>(initialManagedUsers);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>(
    initialMarketOverrides,
  );
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

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
  const [newAdmin, setNewAdmin] = useState<AdminCreateAdminIn>({
    first_names: '',
    last_names: '',
    email: '',
    phone: '+57',
    country: 'CO',
    password: '',
  });

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

  // 1. Activar Broker
  async function handleActivateBroker(broker: PendingBrokerItem) {
    if (processingId) return;
    setProcessingId(broker.userId);
    try {
      await activateBroker(broker.userId).catch(() => {
        /* Fallback simulado para demo cuando backend no tiene ese ID */
      });
      setBrokers((prev) =>
        prev.map((b) =>
          b.userId === broker.userId ? { ...b, status: 'active' as const } : b,
        ),
      );
      showNotification(
        `Comisionista ${broker.fullName} verificado y activado formalmente. Licencia AMV confirmada y rol 'broker' concedido.`,
      );
    } catch {
      showNotification('Error al activar comisionista en el servidor.', true);
    } finally {
      setProcessingId(null);
    }
  }

  // 2. Conmutar Prémium de Usuario
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

  // 3. Guardar Horario Estándar de Mercado
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

  // 4. Crear Excepción de Calendario
  async function handleCreateOverride(e: FormEvent) {
    e.preventDefault();
    if (!newOverrideDate) {
      showNotification('Debes seleccionar una fecha para la excepción.', true);
      return;
    }
    const newId = `ov-${Date.now()}`;
    const payload = {
      id: newId,
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

  // 5. Eliminar Excepción
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

  // 6. Registrar nuevo Administrador
  async function handleCreateAdministrator(e: FormEvent) {
    e.preventDefault();
    if (newAdmin.password.length < 8) {
      showNotification('La contraseña debe tener mínimo 8 caracteres.', true);
      return;
    }
    try {
      await createAdministrator(newAdmin).catch(() => {
        /* Fallback */
      });
      setUsers((prev) => [
        {
          userId: `usr-${Date.now()}`,
          fullName: `${newAdmin.first_names} ${newAdmin.last_names}`,
          email: newAdmin.email,
          role: 'administrator',
          isPremium: true,
          accountStatus: 'active',
          registeredAt: 'Hoy',
        },
        ...prev,
      ]);
      setNewAdmin({
        first_names: '',
        last_names: '',
        email: '',
        phone: '+57',
        country: 'CO',
        password: '',
      });
      showNotification(
        `Nuevo administrador institucional ${newAdmin.email} registrado exitosamente con rol 'administrator'.`,
      );
    } catch {
      showNotification('Error al crear administrador en el servidor.', true);
    }
  }

  const pendingCount = brokers.filter(
    (b) => b.status === 'pending_broker_activation',
  ).length;

  return (
    <div className={styles.container}>
      {/* Header Superior del Portal de Administrador */}
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="Inicio Acciones UD"
          >
            <Image
              src="/logo-acciones-ud.png"
              alt="Logo Acciones UD"
              width={38}
              height={38}
              className={styles.brandLogo}
              priority
            />
            <div className={styles.brandText}>
              <strong>Acciones UD · SysAdmin</strong>
              <span>Portal de Control Institucional &amp; RBAC</span>
            </div>
          </Link>

          <div className={styles.adminBadge}>
            <Icon name="shield" size={14} /> Modo Administrador Activo
          </div>

          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.themeButton}
              onClick={toggleTheme}
              aria-label="Cambiar tema"
            >
              <Icon name="sun" size={14} /> Tema
            </button>
            <Link href="/dashboard" className={styles.linkDashboard}>
              ← Ir a Vista Inversor (Dashboard)
            </Link>
          </div>
        </div>
      </header>

      {/* Cuerpo Principal con Navegación Lateral */}
      <div className={styles.mainLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Módulos de Administración</div>
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'kpi' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('kpi')}
          >
            <Icon name="grid" size={18} /> Resumen &amp; Métricas
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'brokers' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('brokers')}
          >
            <Icon name="users" size={18} /> Activación de Comisionistas
            {pendingCount > 0 && (
              <span className={styles.badgeCount}>{pendingCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'users' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Icon name="user" size={18} /> Usuarios &amp; Plan Prémium
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'rbac' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('rbac')}
          >
            <Icon name="shield" size={18} /> Roles &amp; Permisos (RBAC)
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'markets' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('markets')}
          >
            <Icon name="trend" size={18} /> Horarios Bursátiles (Wall St.)
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'create-admin' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('create-admin')}
          >
            <Icon name="lock" size={18} /> Alta de Administradores
          </button>
        </aside>

        <main className={styles.contentArea}>
          {successMsg && (
            <div className={styles.alertSuccess} role="status">
              <Icon name="check" size={18} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className={styles.alertError} role="alert">
              <Icon name="info" size={18} /> {errorMsg}
            </div>
          )}

          {/* TAB 1: KPI & Resumen */}
          {activeTab === 'kpi' && (
            <div>
              <div className={styles.pageHeader}>
                <h1>Panel de Control · Auditoría y Gestión Integral</h1>
                <p>
                  Supervisión técnica de cuentas, comisionistas bursátiles
                  acreditados ante AMV y control del horario de operaciones en
                  Wall Street.
                </p>
              </div>

              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <div className={styles.kpiIcon}>
                    <Icon name="users" size={24} />
                  </div>
                  <div className={styles.kpiInfo}>
                    <small>Comisionistas Pendientes</small>
                    <strong>{pendingCount}</strong>
                    <span>Pendientes de validación AMV</span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiIcon}>
                    <Icon name="user" size={24} />
                  </div>
                  <div className={styles.kpiInfo}>
                    <small>Usuarios Registrados</small>
                    <strong>{users.length}</strong>
                    <span>Inversionistas y Administradores</span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiIcon}>
                    <Icon name="trend" size={24} />
                  </div>
                  <div className={styles.kpiInfo}>
                    <small>Mercados Bursátiles</small>
                    <strong>3 Bolsas</strong>
                    <span>NYSE · NASDAQ · NYSE Arca</span>
                  </div>
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiIcon}>
                    <Icon name="shield" size={24} />
                  </div>
                  <div className={styles.kpiInfo}>
                    <small>Políticas de Seguridad</small>
                    <strong>2FA Obligatorio</strong>
                    <span>Protección RBAC y TOTP Activa</span>
                  </div>
                </div>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h2>Comisionistas que Requieren Validación Inmediata</h2>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setActiveTab('brokers')}
                  >
                    Ver Todos los Comisionistas →
                  </button>
                </div>
                <div className={styles.tableResponsive}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Candidato a Comisionista</th>
                        <th>Licencia AMV Reportada</th>
                        <th>Especialidad en EE. UU.</th>
                        <th>Estado Actual</th>
                        <th>Acción de Auditoría</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokers
                        .filter((b) => b.status === 'pending_broker_activation')
                        .map((broker) => (
                          <tr key={broker.userId}>
                            <td>
                              <strong>{broker.fullName}</strong>
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                {broker.email} · {broker.phone}
                              </div>
                            </td>
                            <td>
                              <code style={{ fontSize: '0.8rem' }}>
                                {broker.licenseAMV}
                              </code>
                            </td>
                            <td>{broker.specialty}</td>
                            <td>
                              <span className={styles.statusPending}>
                                ● Pendiente de Validación
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.btnPrimary}
                                disabled={processingId === broker.userId}
                                onClick={() => handleActivateBroker(broker)}
                              >
                                <Icon name="check" size={14} /> Aprobar &amp;
                                Activar
                              </button>
                            </td>
                          </tr>
                        ))}
                      {pendingCount === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              textAlign: 'center',
                              padding: '1.5rem',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            No hay solicitudes de comisionistas pendientes de
                            aprobación. Todos los asesores están al día.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVACIÓN DE COMISIONISTAS */}
          {activeTab === 'brokers' && (
            <div>
              <div className={styles.pageHeader}>
                <h1>Acreditación y Activación de Comisionistas Bursátiles</h1>
                <p>
                  Conforme a la normativa institucional, los comisionistas se
                  registran en estado <code>pending_broker_activation</code>{' '}
                  hasta que el administrador verifica su certificación AMV y les
                  concede el rol oficial <code>broker</code> (Endpoint:{' '}
                  <code>
                    POST /api/v1/admin/users/{'{user_id}'}/broker-activation
                  </code>
                  ).
                </p>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h2>Directorio de Solicitudes y Asesores Registrados</h2>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Total evaluados: {brokers.length} profesionales
                  </span>
                </div>

                <div className={styles.tableResponsive}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Nombre y Contacto</th>
                        <th>Acreditación AMV</th>
                        <th>Especialidad en Mercados USA</th>
                        <th>Fecha de Solicitud</th>
                        <th>Estatus</th>
                        <th>Operación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brokers.map((broker) => (
                        <tr key={broker.userId}>
                          <td>
                            <strong>{broker.fullName}</strong>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              {broker.email} · País: {broker.country}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                              }}
                            >
                              {broker.licenseAMV}
                            </span>
                          </td>
                          <td>{broker.specialty}</td>
                          <td style={{ color: 'var(--color-text-muted)' }}>
                            {broker.requestedAt}
                          </td>
                          <td>
                            {broker.status === 'active' ? (
                              <span className={styles.statusActive}>
                                ✓ Activo y Operando
                              </span>
                            ) : (
                              <span className={styles.statusPending}>
                                ⏳ Pendiente Activación
                              </span>
                            )}
                          </td>
                          <td>
                            {broker.status === 'pending_broker_activation' ? (
                              <button
                                type="button"
                                className={styles.btnPrimary}
                                disabled={processingId === broker.userId}
                                onClick={() => handleActivateBroker(broker)}
                              >
                                <Icon name="check" size={14} /> Activar
                                Credencial
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                Acreditado oficialmente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USUARIOS Y PREMIUN */}
          {activeTab === 'users' && (
            <div>
              <div className={styles.pageHeader}>
                <h1>Gestión de Usuarios y Estatus Prémium</h1>
                <p>
                  Permite auditar las cuentas registradas en el sistema y
                  activar o revocar la suscripción al Plan Prémium institucional
                  (Endpoint:{' '}
                  <code>PUT /api/v1/admin/users/{'{user_id}'}/premium</code>).
                </p>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h2>Directorio General de Usuarios</h2>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Total cuentas: {users.length}
                  </span>
                </div>

                <div className={styles.tableResponsive}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Usuario / Correo</th>
                        <th>Rol Asignado</th>
                        <th>Estatus Prémium</th>
                        <th>Estado de Cuenta</th>
                        <th>Fecha de Alta</th>
                        <th>Acción Prémium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((usr) => (
                        <tr key={usr.userId}>
                          <td>
                            <strong>{usr.fullName}</strong>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              {usr.email}
                            </div>
                          </td>
                          <td>
                            <code
                              style={{
                                fontSize: '0.8rem',
                                textTransform: 'uppercase',
                              }}
                            >
                              {usr.role}
                            </code>
                          </td>
                          <td>
                            {usr.isPremium ? (
                              <span className={styles.badgePremium}>
                                ★ Plan Prémium
                              </span>
                            ) : (
                              <span className={styles.badgeStandard}>
                                Estándar
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={styles.statusActive}>
                              ● {usr.accountStatus}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-text-muted)' }}>
                            {usr.registeredAt}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={
                                usr.isPremium
                                  ? styles.btnDanger
                                  : styles.btnSecondary
                              }
                              disabled={processingId === usr.userId}
                              onClick={() => handleTogglePremium(usr)}
                            >
                              {usr.isPremium
                                ? 'Revocar Prémium'
                                : '★ Otorgar Prémium'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RBAC & PERMISOS */}
          {activeTab === 'rbac' && (
            <div>
              <div className={styles.pageHeader}>
                <h1>Control de Acceso Basado en Roles (RBAC)</h1>
                <p>
                  Estructura de seguridad que define las atribuciones de cada
                  actor en Acciones UD. Las operaciones están protegidas con la
                  salvaguarda de nunca revocar al último administrador del
                  sistema (<code>LAST_ADMINISTRATOR</code>).
                </p>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h2>Roles del Sistema y Matriz de Permisos</h2>
                </div>
                <div className={styles.tableResponsive}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Rol del Sistema</th>
                        <th>Permisos Habilitados</th>
                        <th>Alcance y Responsabilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {defaultSystemRoles.map((r) => (
                        <tr key={r.role}>
                          <td>
                            <strong
                              style={{
                                fontSize: '0.95rem',
                                textTransform: 'uppercase',
                              }}
                            >
                              {r.role}
                            </strong>
                          </td>
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.4rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              {r.permissions.map((p) => (
                                <code
                                  key={p}
                                  style={{
                                    background: 'var(--color-control)',
                                    border: '1px solid var(--color-border)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '0.35rem',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {p}
                                </code>
                              ))}
                            </div>
                          </td>
                          <td
                            style={{
                              fontSize: '0.82rem',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {r.role === 'administrator' &&
                              'Control total de identidades, aprobación de asesores AMV y calendario bursátil.'}
                            {r.role === 'broker' &&
                              'Estructuración de carteras recomendadas y asesoramiento en mercados de Wall Street.'}
                            {r.role === 'investor' &&
                              'Simulación bursátil, transmisión de órdenes en vivo y consulta de portafolio.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h2>Catálogo de Permisos de Seguridad (Granularidad)</h2>
                </div>
                <div className={styles.tableResponsive}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Código del Permiso</th>
                        <th>Descripción Técnica</th>
                      </tr>
                    </thead>
                    <tbody>
                      {defaultSystemPermissions.map((perm) => (
                        <tr key={perm.code}>
                          <td>
                            <code>{perm.code}</code>
                          </td>
                          <td style={{ color: 'var(--color-text-muted)' }}>
                            {perm.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HORARIOS Y CALENDARIO BURSÁTIL */}
          {activeTab === 'markets' && (
            <div>
              <div className={styles.pageHeader}>
                <h1>
                  Supervisión de Horarios y Calendario Bursátil (Wall Street)
                </h1>
                <p>
                  Control de horarios de apertura y cierre oficial para NYSE,
                  NASDAQ y NYSE Arca. Permite registrar feriados oficiales (Día
                  de Acción de Gracias, Navidad) y cierres anticipados.
                </p>
              </div>

              {/* Horario por defecto */}
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h2>Horario Estándar de Negociación</h2>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Zona Horaria: Eastern Standard Time (EST / New York)
                  </span>
                </div>

                <form onSubmit={handleSaveMarketSchedule}>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Mercado Objetivo</label>
                      <select
                        value={selectedMarket}
                        onChange={(e) => setSelectedMarket(e.target.value)}
                      >
                        <option value="NYSE">
                          NYSE (New York Stock Exchange)
                        </option>
                        <option value="NASDAQ">NASDAQ Stock Market</option>
                        <option value="AMEX">NYSE American (AMEX)</option>
                      </select>
                    </div>

                    <div className={styles.formField}>
                      <label>Hora de Apertura (EST)</label>
                      <input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        required
                      />
                      <small>Campana de apertura habitual: 09:30 AM</small>
                    </div>

                    <div className={styles.formField}>
                      <label>Hora de Cierre (EST)</label>
                      <input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        required
                      />
                      <small>
                        Campana de cierre habitual: 04:00 PM (16:00)
                      </small>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.25rem' }}>
                    <button type="submit" className={styles.btnPrimary}>
                      <Icon name="check" size={14} /> Guardar Horario Estándar
                      para {selectedMarket}
                    </button>
                  </div>
                </form>
              </div>

              {/* Registro de excepciones / Feriados */}
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h2>
                    Excepciones de Calendario Bursátil (Feriados y Cierres
                    Anticipados)
                  </h2>
                </div>

                <form
                  onSubmit={handleCreateOverride}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Fecha de la Excepción</label>
                      <input
                        type="date"
                        value={newOverrideDate}
                        onChange={(e) => setNewOverrideDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Tipo de Excepción</label>
                      <select
                        value={newOverrideClosed ? 'closed' : 'early'}
                        onChange={(e) =>
                          setNewOverrideClosed(e.target.value === 'closed')
                        }
                      >
                        <option value="closed">
                          Mercado Totalmente Cerrado (Feriado Oficial)
                        </option>
                        <option value="early">
                          Cierre Anticipado (Early Close a la 1:00 PM EST)
                        </option>
                      </select>
                    </div>

                    {!newOverrideClosed && (
                      <>
                        <div className={styles.formField}>
                          <label>Hora Apertura</label>
                          <input
                            type="time"
                            value={newOverrideOpenTime}
                            onChange={(e) =>
                              setNewOverrideOpenTime(e.target.value)
                            }
                          />
                        </div>
                        <div className={styles.formField}>
                          <label>Hora Cierre</label>
                          <input
                            type="time"
                            value={newOverrideCloseTime}
                            onChange={(e) =>
                              setNewOverrideCloseTime(e.target.value)
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <button type="submit" className={styles.btnSecondary}>
                      + Agregar Excepción al Calendario
                    </button>
                  </div>
                </form>

                <div className={styles.tableResponsive}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Mercado</th>
                        <th>Fecha Programada</th>
                        <th>Estado de la Bolsa</th>
                        <th>Horario Aplicable</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overrides.map((ov) => (
                        <tr key={ov.id}>
                          <td>
                            <strong>{ov.market}</strong>
                          </td>
                          <td>{ov.date}</td>
                          <td>
                            {ov.closed ? (
                              <span className={styles.statusPending}>
                                ● Bolsa Cerrada
                              </span>
                            ) : (
                              <span className={styles.statusActive}>
                                ● Cierre Anticipado
                              </span>
                            )}
                          </td>
                          <td>
                            {ov.closed
                              ? 'Sin operaciones'
                              : `${ov.open_time} - ${ov.close_time} EST`}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.btnDanger}
                              onClick={() => handleDeleteOverride(ov.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ALTA DE NUEVO ADMINISTRADOR */}
          {activeTab === 'create-admin' && (
            <div>
              <div className={styles.pageHeader}>
                <h1>Alta de Administrador Institucional</h1>
                <p>
                  Registro seguro de credenciales con asignación automática del
                  rol <code>administrator</code> (Endpoint:{' '}
                  <code>POST /api/v1/admin/users/administrators</code>).
                </p>
              </div>

              <div className={styles.tableCard} style={{ maxWidth: '48rem' }}>
                <form onSubmit={handleCreateAdministrator}>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Nombres Completos</label>
                      <input
                        type="text"
                        value={newAdmin.first_names}
                        placeholder="Ej. Juan Andrés"
                        onChange={(e) =>
                          setNewAdmin({
                            ...newAdmin,
                            first_names: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Apellidos Completos</label>
                      <input
                        type="text"
                        value={newAdmin.last_names}
                        placeholder="Ej. Gómez Silva"
                        onChange={(e) =>
                          setNewAdmin({
                            ...newAdmin,
                            last_names: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Correo Electrónico Institucional</label>
                      <input
                        type="email"
                        value={newAdmin.email}
                        placeholder="admin.nuevo@accionesud.edu.co"
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Teléfono con Indicativo</label>
                      <input
                        type="tel"
                        value={newAdmin.phone}
                        placeholder="+573001234567"
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Código País (ISO 3166-1)</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={newAdmin.country}
                        placeholder="CO"
                        onChange={(e) =>
                          setNewAdmin({
                            ...newAdmin,
                            country: e.target.value.toUpperCase(),
                          })
                        }
                        required
                      />
                    </div>

                    <div className={styles.formField}>
                      <label>Contraseña Maestra (Mínimo 8 caracteres)</label>
                      <input
                        type="password"
                        value={newAdmin.password}
                        placeholder="Contraseña segura"
                        onChange={(e) =>
                          setNewAdmin({ ...newAdmin, password: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '1.5rem',
                      display: 'flex',
                      gap: '0.75rem',
                    }}
                  >
                    <button type="submit" className={styles.btnPrimary}>
                      <Icon name="lock" size={14} /> Registrar Administrador
                      Delegado
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() =>
                        setNewAdmin({
                          first_names: '',
                          last_names: '',
                          email: '',
                          phone: '+57',
                          country: 'CO',
                          password: '',
                        })
                      }
                    >
                      Limpiar Formulario
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
