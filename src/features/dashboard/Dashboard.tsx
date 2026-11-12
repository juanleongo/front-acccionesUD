'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { DashboardRecoveryCodes } from '@/features/login';
import { Markets } from '@/features/markets';
import { marketInterestsCatalog } from '@/features/registration';
import {
  getCurrentUser,
  logoutCurrentSession,
  updateUserInterests,
  type UserProfile,
} from './user-api';
import { dashboardPreview } from './dashboard-preview';
import styles from './dashboard.module.css';

export type DashboardSection =
  'dashboard' | 'markets' | 'orders' | 'portfolio' | 'funds' | 'advisors';

const navItems: { id: DashboardSection; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'markets', label: 'Mercados en Vivo', icon: 'trend' },
  { id: 'orders', label: 'Terminal de Órdenes', icon: 'devices' },
  { id: 'portfolio', label: 'Portafolio', icon: 'pie' },
  { id: 'funds', label: 'Depósitos & Retiros', icon: 'wallet' },
  { id: 'advisors', label: 'Comisionistas', icon: 'users' },
];

const sectionTitles: Record<DashboardSection, string> = {
  dashboard: 'Panel de Control · Resumen General',
  markets: 'Mercados en Vivo · Cotizaciones de Wall Street',
  orders: 'Terminal de Órdenes · Ejecución en NYSE & NASDAQ',
  portfolio: 'Portafolio de Inversión · Posiciones Activas',
  funds: 'Depósitos & Retiros · Gestión de Fondos Simulados (USD)',
  advisors: 'Comisionistas Bursátiles · Directorio de Asesores',
};

const stockPrices: Record<string, number> = {
  AAPL: 224.23,
  TSLA: 218.4,
  NVDA: 141.5,
  MSFT: 422.1,
  AMZN: 186.3,
  JPM: 215.8,
  SPY: 585.12,
};

const stockExchanges: Record<string, string> = {
  AAPL: 'NASDAQ',
  TSLA: 'NASDAQ',
  NVDA: 'NASDAQ',
  MSFT: 'NASDAQ',
  AMZN: 'NASDAQ',
  JPM: 'NYSE',
  SPY: 'NYSE Arca',
};

function subscribeGuideStore(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('acciones_ud_guide_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('acciones_ud_guide_change', callback);
  };
}

function getGuideSnapshot(): boolean {
  try {
    return localStorage.getItem('acciones_ud_hide_guide') === 'true';
  } catch {
    return false;
  }
}

function getGuideServerSnapshot(): boolean {
  return false;
}

function setGuideDismissedPreference(hide: boolean) {
  try {
    if (hide) {
      localStorage.setItem('acciones_ud_hide_guide', 'true');
    } else {
      localStorage.setItem('acciones_ud_hide_guide', 'false');
    }
    window.dispatchEvent(new Event('acciones_ud_guide_change'));
  } catch {
    /* localStorage opcional */
  }
}

interface AdvisorItem {
  id: string;
  name: string;
  license: string;
  photo: string;
  rating: string;
  success: string;
  proposals: number;
  assigned?: boolean;
  specialty: string;
  bio: string;
  strategy: string;
  recommendedAssets: string[];
}

const advisorsData: AdvisorItem[] = [
  {
    id: 'carlos-rodriguez',
    name: 'Carlos Rodríguez, CFA',
    license: 'Licencia AMV #UD-ADV-042 · Wall Street',
    photo: '/advisors/advisor-1.jpg',
    rating: '4.9 de 5.0',
    success: '94.2%',
    proposals: 184,
    assigned: true,
    specialty: 'NYSE & NASDAQ Tech · S&P 500 Large Cap',
    bio: 'Más de 12 años de trayectoria estructurando portafolios bursátiles en Wall Street. Enfoque disciplinado en compañías de alta capitalización, dividendos crecientes y análisis financiero de valor.',
    strategy:
      'Estrategia de Dividend Growth & Cash Flow con cobertura en opciones y asignación dinámica entre acciones líderes del S&P 500 y activos defensivos en USD.',
    recommendedAssets: ['AAPL', 'MSFT', 'JPM', 'SPY'],
  },
  {
    id: 'ana-morales',
    name: 'Ana María Morales, MSc',
    license: 'Licencia AMV #UD-ADV-019 · NYSE Commodities',
    photo: '/advisors/advisor-2.jpg',
    rating: '4.85 de 5.0',
    success: '91.8%',
    proposals: 142,
    specialty: 'NYSE · Energía, Minería & Materias Primas',
    bio: 'Magíster en Finanzas Cuantitativas con especialidad en el sector energético global y materias primas cotizadas en Wall Street. Experiencia en macroeconomía y ciclos de inflación.',
    strategy:
      'Ciclos de materias primas y valor relativo con coberturas cambiarias y exposición a productores de energía con balance sólido y flujo de caja libre.',
    recommendedAssets: ['CVX', 'XOM', 'FCX', 'GLD'],
  },
  {
    id: 'felipe-tanaka',
    name: 'Felipe Tanaka',
    license: 'Licencia AMV #UD-ADV-088 · NASDAQ Tech',
    photo: '/advisors/advisor-3.jpg',
    rating: '4.95 de 5.0',
    success: '96.5%',
    proposals: 210,
    specialty: 'NASDAQ · Inteligencia Artificial & Semiconductores',
    bio: 'Pionero en análisis técnico algorítmico y momentum en firmas tecnológicas de vanguardia. Rastreo directo de innovación en silicio, centros de datos e infraestructura de IA.',
    strategy:
      'Momentum cuantitativo en semiconductores y líderes de software de IA con stop-loss disciplinado y tomas de ganancias progresivas.',
    recommendedAssets: ['NVDA', 'TSM', 'AMD', 'AVGO'],
  },
  {
    id: 'valentina-gomez',
    name: 'Valentina Gómez Restrepo',
    license: 'Licencia AMV #UD-ADV-053 · S&P 500',
    photo: '/advisors/advisor-4.jpg',
    rating: '4.88 de 5.0',
    success: '93.0%',
    proposals: 165,
    specialty: 'S&P 500 · Dividend Aristocrats & Valor',
    bio: 'Especialista en portafolios defensivos y preservación de patrimonio a largo plazo en dólares. Análisis exhaustivo de empresas con más de 25 años incrementando dividendos.',
    strategy:
      'Indexación ponderada por dividendos y reinversión compuesta, minimizando volatilidad y protegiendo contra caídas abruptas del mercado.',
    recommendedAssets: ['PG', 'KO', 'PEP', 'JNJ'],
  },
  {
    id: 'mateo-benavides',
    name: 'Mateo Benavides, MBA',
    license: 'Licencia AMV #UD-ADV-071 · NYSE Arca',
    photo: '/advisors/advisor-5.jpg',
    rating: '4.82 de 5.0',
    success: '90.4%',
    proposals: 128,
    specialty: 'NYSE Arca · ETFs Sectoriales & Rebalanceo',
    bio: 'MBA con amplia experiencia en fondos cotizados (ETFs), asignación multiactivo y optimización de costes operacionales en plataformas de corretaje de EE. UU.',
    strategy:
      'Asignación táctica de activos mediante ETFs de bajo coste con rebalanceo trimestral automático para capturar rotaciones sectoriales en Nueva York.',
    recommendedAssets: ['QQQ', 'VOO', 'IWM', 'XLK'],
  },
];

function subscribeMobile(callback: () => void) {
  const query = window.matchMedia('(max-width: 64rem)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

function isMobile() {
  return window.matchMedia('(max-width: 64rem)').matches;
}

export function Dashboard({
  initialSection = 'dashboard',
}: {
  initialSection?: DashboardSection;
} = {}) {
  const router = useRouter();
  const mobile = useSyncExternalStore(subscribeMobile, isMobile, () => false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<DashboardSection>(initialSection);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileTab, setProfileTab] = useState<'info' | 'edit'>('info');
  const [overrideLevel, setOverrideLevel] = useState<
    'beginner' | 'experienced' | null
  >(null);
  const [overrideInterests, setOverrideInterests] = useState<string[] | null>(
    null,
  );
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [localUser, setLocalUser] = useState<UserProfile | null>(null);

  // Guía didáctica oculta / visible con useSyncExternalStore para evitar hydration mismatch y warnings de lint
  const guideDismissed = useSyncExternalStore(
    subscribeGuideStore,
    getGuideSnapshot,
    getGuideServerSnapshot,
  );

  // Terminal de órdenes estado
  const [orderSymbol, setOrderSymbol] = useState('AAPL');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [orderShares, setOrderShares] = useState(10);
  const [orderLimitPrice, setOrderLimitPrice] = useState('224.23');
  const [orderSubmittedMsg, setOrderSubmittedMsg] = useState('');

  // Historial de órdenes con filtros
  const [orderFilterSymbol, setOrderFilterSymbol] = useState<string>('all');
  const [orderFilterSide, setOrderFilterSide] = useState<
    'all' | 'buy' | 'sell'
  >('all');
  const [orderFilterType, setOrderFilterType] = useState<
    'all' | 'market' | 'limit'
  >('all');
  const [orderFilterSearch, setOrderFilterSearch] = useState('');
  const [ordersList, setOrdersList] = useState<
    Array<{
      id: string;
      symbol: string;
      type: 'Mercado' | 'Límite';
      side: 'Compra' | 'Venta';
      shares: number;
      price: string;
      total: string;
      status: string;
      time: string;
    }>
  >([
    {
      id: 'ord-1',
      symbol: 'AAPL',
      type: 'Mercado',
      side: 'Compra',
      shares: 15,
      price: '$221.50',
      total: '$3,322.50 USD',
      status: 'Ejecutada (NYSE)',
      time: 'Hoy, 10:45 AM',
    },
    {
      id: 'ord-2',
      symbol: 'TSLA',
      type: 'Límite',
      side: 'Compra',
      shares: 8,
      price: '$212.00',
      total: '$1,696.00 USD',
      status: 'Ejecutada (NASDAQ)',
      time: 'Hoy, 09:50 AM',
    },
    {
      id: 'ord-3',
      symbol: 'JPM',
      type: 'Mercado',
      side: 'Compra',
      shares: 12,
      price: '$210.00',
      total: '$2,520.00 USD',
      status: 'Ejecutada (NYSE)',
      time: 'Ayer, 03:30 PM',
    },
    {
      id: 'ord-4',
      symbol: 'MSFT',
      type: 'Límite',
      side: 'Venta',
      shares: 5,
      price: '$428.50',
      total: '$2,142.50 USD',
      status: 'Ejecutada (NASDAQ)',
      time: 'Ayer, 11:15 AM',
    },
    {
      id: 'ord-5',
      symbol: 'NVDA',
      type: 'Mercado',
      side: 'Compra',
      shares: 20,
      price: '$126.80',
      total: '$2,536.00 USD',
      status: 'Ejecutada (NASDAQ)',
      time: '10/Nov, 02:20 PM',
    },
  ]);

  const profileDialog = useRef<HTMLDialogElement>(null);
  const advisorDialog = useRef<HTMLDialogElement>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorItem | null>(
    null,
  );
  const menu = useRef<HTMLButtonElement>(null);

  const userQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
  });
  const user = localUser ?? userQuery.data;

  const editableLevel =
    overrideLevel ??
    (user?.investor_level === 'experienced' ? 'experienced' : 'beginner');
  const editableInterests =
    overrideInterests ??
    (user?.interests?.length
      ? user.interests
      : ['Tecnología & Semiconductores']);

  const currentPrice = stockPrices[orderSymbol] ?? 200;
  const subtotal = currentPrice * orderShares;
  const commPlatform = subtotal * 0.012;
  const commAdvisor = subtotal * 0.008;
  const totalOrderUSD = subtotal + commPlatform + commAdvisor;

  function handleTransmitOrder() {
    const executedPrice =
      orderType === 'market'
        ? currentPrice
        : parseFloat(orderLimitPrice) || currentPrice;
    const newOrd = {
      id: `ord-${Date.now()}`,
      symbol: orderSymbol,
      type: orderType === 'market' ? ('Mercado' as const) : ('Límite' as const),
      side: orderSide === 'buy' ? ('Compra' as const) : ('Venta' as const),
      shares: orderShares,
      price: `$${executedPrice.toFixed(2)}`,
      total: `$${totalOrderUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`,
      status: `Ejecutada (${stockExchanges[orderSymbol] ?? 'NYSE'})`,
      time: 'Recién colocada',
    };
    setOrdersList((prev) => [newOrd, ...prev]);
    setOrderSubmittedMsg(
      `✓ Orden de ${orderSide === 'buy' ? 'Compra' : 'Venta'} de ${orderShares} acciones de ${orderSymbol} colocada exitosamente en simulación bursátil. Total: $${totalOrderUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD.`,
    );
    setTimeout(() => setOrderSubmittedMsg(''), 7000);
  }

  const filteredOrders = ordersList.filter((ord) => {
    if (orderFilterSymbol !== 'all' && ord.symbol !== orderFilterSymbol)
      return false;
    if (
      orderFilterSide !== 'all' &&
      (orderFilterSide === 'buy' ? 'Compra' : 'Venta') !== ord.side
    )
      return false;
    if (
      orderFilterType !== 'all' &&
      (orderFilterType === 'market' ? 'Mercado' : 'Límite') !== ord.type
    )
      return false;
    if (orderFilterSearch.trim()) {
      const q = orderFilterSearch.toLowerCase();
      return (
        ord.symbol.toLowerCase().includes(q) ||
        ord.status.toLowerCase().includes(q) ||
        ord.type.toLowerCase().includes(q) ||
        ord.side.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function toggleInterest(value: string) {
    const current = editableInterests;
    const next = current.includes(value)
      ? current.filter((i) => i !== value)
      : current.length < 20
        ? [...current, value]
        : current;
    setOverrideInterests(next);
  }

  async function handleSavePreferences(e: FormEvent) {
    e.preventDefault();
    if (editableInterests.length === 0) {
      setSaveError('Selecciona al menos un interés bursátil.');
      return;
    }
    setSavingPreferences(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      await updateUserInterests({
        interests: editableInterests,
        level: editableLevel,
      });
      setSaveSuccess(
        '¡Preferencias e intereses actualizados con éxito en tu cuenta de Wall Street!',
      );
      if (user) {
        setLocalUser({
          ...user,
          investor_level: editableLevel,
          interests: editableInterests,
        });
      }
    } catch {
      setSaveError(
        'No se pudieron guardar las preferencias en el servidor. Inténtalo de nuevo.',
      );
    } finally {
      setSavingPreferences(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutCurrentSession();
    } catch {
      /* Redirigir aun si falla la revocación en servidor. */
    }
    router.push('/login');
  }

  function theme() {
    const value =
      document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem('acciones_ud_theme', value);
    } catch {
      /* Preferencia opcional. */
    }
  }

  function closeMenu() {
    setMobileOpen(false);
    menu.current?.focus();
  }

  const userInitials = user
    ? `${user.first_names[0] ?? ''}${user.last_names[0] ?? ''}`.toUpperCase()
    : dashboardPreview.user.initials;

  const displayName = user
    ? `${user.first_names} ${user.last_names}`
    : dashboardPreview.user.name;

  return (
    <div className={`${styles.dashboard} ${collapsed ? styles.collapsed : ''}`}>
      <a className={styles.skip} href="#dashboard-content">
        Saltar al contenido
      </a>
      {mobileOpen && (
        <button
          className={styles.backdrop}
          aria-label="Cerrar navegación"
          onClick={closeMenu}
        />
      )}
      <aside
        id="dashboard-navigation"
        className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') closeMenu();
        }}
      >
        <div className={styles.sidebarHeader}>
          <button
            type="button"
            className={styles.brand}
            onClick={() => setActiveSection('dashboard')}
            aria-label="Acciones UD, inicio"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Image
              src="/logo-acciones-ud.png"
              alt="Logo Acciones UD"
              width={36}
              height={36}
              className={styles.brandLogoImg}
              priority
            />
            <span className={styles.sidebarText}>
              <strong>Acciones UD</strong>
              <span>Simulador Bursátil USA</span>
            </span>
          </button>
          <button
            type="button"
            className={styles.sidebarToggle}
            aria-label={
              collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'
            }
            onClick={() => {
              if (window.matchMedia('(max-width: 64rem)').matches) {
                setMobileOpen(false);
              } else {
                setCollapsed(!collapsed);
              }
            }}
          >
            <Icon name="menu" size={18} />
          </button>
        </div>

        <div className={styles.sideMain}>
          <button
            type="button"
            className={styles.newOrder}
            onClick={() => {
              setActiveSection('orders');
              if (mobile) setMobileOpen(false);
            }}
          >
            <span aria-hidden="true">⊕</span>
            <span className={styles.sidebarText}>Nueva Orden</span>
          </button>

          <nav aria-label="Navegación del dashboard">
            {navItems.map((item) => {
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={isSelected ? styles.selected : styles.navButton}
                  onClick={() => {
                    setActiveSection(item.id);
                    if (mobile) setMobileOpen(false);
                  }}
                  title={item.label}
                >
                  <Icon name={item.icon} size={18} />
                  <span className={styles.sidebarText}>{item.label}</span>
                  <span
                    className={styles.collapsedLabel}
                    aria-hidden={!collapsed || mobile}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className={styles.sideBottom}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => {
              profileDialog.current?.showModal();
            }}
          >
            <Icon name="user" />
            <span className={styles.sidebarText}>Mi Perfil &amp; KYC</span>
            <span
              className={styles.collapsedLabel}
              aria-hidden={!collapsed || mobile}
            >
              Mi Perfil &amp; KYC
            </span>
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <Icon name="arrow" />
            <span className={styles.sidebarText}>
              {loggingOut ? 'Cerrando sesión…' : 'Cerrar Sesión'}
            </span>
            <span
              className={styles.collapsedLabel}
              aria-hidden={!collapsed || mobile}
            >
              Cerrar Sesión
            </span>
          </button>
          <Link href="/" className={styles.homeLink}>
            Volver a la portada
          </Link>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.header}>
          <button
            ref={menu}
            className={styles.menu}
            aria-label="Abrir menú de navegación"
            aria-controls="dashboard-navigation"
            aria-expanded={mobile ? mobileOpen : !collapsed}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Icon name="menu" size={20} />
          </button>
          <h1>{sectionTitles[activeSection]}</h1>
          <div className={styles.headerActions}>
            <div className={styles.account}>
              <span>Valor Cuenta Simulación</span>
              <strong>{dashboardPreview.accountValue} USD</strong>
            </div>

            <button
              type="button"
              className={styles.avatar}
              title={`Ver perfil de ${displayName}`}
              onClick={() => profileDialog.current?.showModal()}
            >
              {userInitials}
            </button>

            <span className={styles.language}>
              <Icon name="globe" size={17} /> ES
            </span>
            <button
              onClick={theme}
              className={styles.theme}
              aria-label="Cambiar tema de color"
            >
              <span className={styles.darkLabel}>
                <Icon name="sun" size={18} /> Claro
              </span>
              <span className={styles.lightLabel}>
                <Icon name="moon" size={18} /> Oscuro
              </span>
            </button>
          </div>
        </header>

        <main id="dashboard-content" className={styles.content}>
          <DashboardRecoveryCodes />

          {activeSection === 'dashboard' && (
            <>
              <div className={styles.welcome}>
                <div>
                  <h2>¡Hola, {user ? user.first_names : 'Inversionista'}!</h2>
                  <p>
                    Cuenta de Inversión y Trading · Supervisión en vivo de tu
                    actividad en mercados de EE. UU.
                  </p>
                </div>
                <div className={styles.marketStatus}>
                  <span>● Wall Street (NYSE / NASDAQ): Abierta ahora</span>
                  <span>● Operación simulada en USD</span>
                  <span>
                    Nivel:{' '}
                    {user?.investor_level === 'experienced'
                      ? 'Con experiencia'
                      : 'Principiante'}
                  </span>
                </div>
              </div>

              {/* Guía didáctica activa para principiantes */}
              {user?.investor_level !== 'experienced' &&
                (guideDismissed ? (
                  <div className={styles.didacticCollapsedBar}>
                    <span>
                      🎓 Modo Principiante activo · Guía didáctica oculta
                    </span>
                    <button
                      type="button"
                      className={styles.didacticToggleBtn}
                      onClick={() => setGuideDismissedPreference(false)}
                    >
                      Mostrar Guía
                    </button>
                  </div>
                ) : (
                  <section
                    className={styles.didacticGuide}
                    aria-label="Guía pedagógica para principiantes"
                  >
                    <div className={styles.didacticHeader}>
                      <div className={styles.didacticBadge}>
                        🎓 Guía Didáctica Activa · Modo Principiante
                      </div>
                      <span className={styles.didacticNote}>
                        Protección activa: Activos de alta volatilidad y
                        derivados complejos están filtrados para proteger tu
                        curva de aprendizaje.
                      </span>
                      <button
                        type="button"
                        className={styles.didacticDismissBtn}
                        onClick={() => setGuideDismissedPreference(true)}
                        title="Ocultar guía didáctica"
                        aria-label="Ocultar guía didáctica"
                      >
                        ✕ Ocultar
                      </button>
                    </div>
                    <div className={styles.didacticGrid}>
                      <div className={styles.didacticCard}>
                        <strong>1. Órdenes de Mercado (Market)</strong>
                        <p>
                          Se ejecutan al instante al mejor precio de oferta en
                          Wall Street (NYSE/NASDAQ). Ideales para tomar
                          posiciones de forma inmediata en USD.
                        </p>
                      </div>
                      <div className={styles.didacticCard}>
                        <strong>2. Órdenes Límite (Limit)</strong>
                        <p>
                          Tú estableces el precio máximo a pagar o el mínimo a
                          recibir. La orden solo se ejecuta si el mercado toca
                          tu cotización objetivo.
                        </p>
                      </div>
                      <div className={styles.didacticCard}>
                        <strong>3. Comisión del 2% y Acompañamiento</strong>
                        <p>
                          Desglose transparente: 60% para la plataforma de
                          simulación Acciones UD y 40% para tu asesor
                          comisionista asignado.
                        </p>
                      </div>
                    </div>
                  </section>
                ))}

              <section
                className={styles.metrics}
                aria-label="Resumen financiero"
              >
                {dashboardPreview.metrics.map((metric) => (
                  <article
                    key={metric.title}
                    className={`${styles.metric} ${styles[metric.tone] ?? ''}`}
                  >
                    <div className={styles.metricHeading}>
                      <div>
                        <h3>{metric.title}</h3>
                        <p>{metric.description}</p>
                      </div>
                      <div className={styles.metricIcon}>
                        <Icon name={metric.icon} size={18} />
                      </div>
                    </div>
                    <div className={styles.amount}>
                      {metric.value} <small>USD</small>
                    </div>
                    <div className={styles.metricNote}>{metric.note}</div>
                  </article>
                ))}
              </section>

              <div className={styles.columns}>
                <div className={styles.leftColumn}>
                  <section className={styles.panel}>
                    <div className={styles.panelHeading}>
                      <h2>
                        <Icon name="trend" size={18} /> Tus Inversiones Activas
                        · Principales Acciones de Wall Street
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveSection('markets')}
                        className={styles.liveMarketsLink}
                      >
                        Ver cotizaciones en vivo →
                      </button>
                    </div>
                    <div className={styles.tableScroll}>
                      <table>
                        <thead>
                          <tr>
                            <th>Activo</th>
                            <th>Bolsa</th>
                            <th>Precio (USD)</th>
                            <th>Variación 24h</th>
                            <th>Operación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardPreview.stocks.map((stock) => (
                            <tr key={stock.symbol}>
                              <td>
                                <div className={styles.company}>
                                  <span className={styles.symbol}>
                                    {stock.symbol}
                                  </span>
                                  <div>
                                    <strong>{stock.name}</strong>
                                    <small>{stock.sector}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={styles.exchange}>
                                  {stock.exchange}
                                </span>
                              </td>
                              <td className={styles.price}>{stock.price}</td>
                              <td
                                className={
                                  stock.negative
                                    ? styles.negative
                                    : styles.positive
                                }
                              >
                                {stock.change}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrderSymbol(stock.symbol);
                                    setActiveSection('orders');
                                  }}
                                  className={styles.invest}
                                >
                                  Operar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className={styles.portfolio}>
                    <div>
                      <h2>
                        ¿Quieres ver el detalle completo de tus inversiones?
                      </h2>
                      <p>
                        Consulta tus gráficos de rendimiento, el reparto de tus
                        activos y tus órdenes ejecutadas en Wall Street.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('markets')}
                      className={styles.primary}
                    >
                      Explorar Mercados en Vivo <Icon name="arrow" size={18} />
                    </button>
                  </section>
                </div>

                <div className={styles.rightColumn}>
                  <section className={styles.panel}>
                    <h2>
                      <span className={styles.percent}>%</span> Comisión de
                      Operación (2% Total)
                    </h2>
                    <p className={styles.commissionDescription}>
                      Cada vez que compras o vendes acciones en NYSE o NASDAQ,
                      se aplica una comisión fija del <strong>2.0%</strong>{' '}
                      distribuida de forma transparente:
                    </p>
                    <div className={styles.split}>
                      <span>Para la Plataforma Acciones UD:</span>
                      <strong>60% (1.2% total)</strong>
                    </div>
                    <div className={styles.split}>
                      <span>Para tu Asesor de Inversión:</span>
                      <strong>40% (0.8% total)</strong>
                    </div>
                    <p className={styles.finePrint}>
                      Sin cargos sorpresa ni cobros ocultos por apertura o
                      mantenimiento.
                    </p>
                  </section>

                  <section className={styles.panel}>
                    <div className={styles.panelHeading}>
                      <h2>Tu Asesor Bursátil</h2>
                      <span className={styles.assigned}>Asignado</span>
                    </div>
                    <div className={styles.advisor}>
                      <span>CR</span>
                      <div>
                        <strong>Carlos Rodríguez, CFA</strong>
                        <small>Registro Oficial #UD-ADV-042</small>
                        <b>★ 4.9 de 5.0 (184 propuestas exitosas)</b>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('advisors')}
                      className={styles.advisorButton}
                    >
                      Consultar Asesores &amp; Estrategias
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}

          {activeSection === 'markets' && (
            <div style={{ marginTop: '0.5rem' }}>
              <Markets />
            </div>
          )}

          {activeSection === 'orders' && (
            <div>
              <div className={styles.terminalCard}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>
                  Terminal de Órdenes · Simulación Bursátil USA
                </h2>
                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    marginBottom: '1.25rem',
                    fontSize: '0.9rem',
                  }}
                >
                  Ingresa y ejecuta órdenes de compra o venta en tiempo real en
                  NYSE y NASDAQ en dólares estadounidenses (USD).
                </p>

                {orderSubmittedMsg && (
                  <p className={styles.profileSuccessMessage} role="status">
                    {orderSubmittedMsg}
                  </p>
                )}

                <div className={styles.terminalFormGrid}>
                  <div className={styles.terminalInputGroup}>
                    <label>Símbolo del Activo</label>
                    <select
                      value={orderSymbol}
                      onChange={(e) => setOrderSymbol(e.target.value)}
                    >
                      <option value="AAPL">
                        AAPL · Apple Inc. ($224.23 USD)
                      </option>
                      <option value="TSLA">
                        TSLA · Tesla Inc. ($218.40 USD)
                      </option>
                      <option value="NVDA">
                        NVDA · NVIDIA Corp. ($141.50 USD)
                      </option>
                      <option value="MSFT">
                        MSFT · Microsoft Corp. ($422.10 USD)
                      </option>
                      <option value="AMZN">
                        AMZN · Amazon.com Inc. ($186.30 USD)
                      </option>
                      <option value="JPM">
                        JPM · JPMorgan Chase &amp; Co. ($215.80 USD)
                      </option>
                      <option value="SPY">
                        SPY · SPDR S&amp;P 500 ETF ($585.12 USD)
                      </option>
                    </select>
                  </div>

                  <div className={styles.terminalInputGroup}>
                    <label>Sentido de la Operación</label>
                    <select
                      value={orderSide}
                      onChange={(e) =>
                        setOrderSide(e.target.value as 'buy' | 'sell')
                      }
                    >
                      <option value="buy">Comprar (Buy)</option>
                      <option value="sell">Vender (Sell)</option>
                    </select>
                  </div>

                  <div className={styles.terminalInputGroup}>
                    <label>Tipo de Orden</label>
                    <select
                      value={orderType}
                      onChange={(e) =>
                        setOrderType(e.target.value as 'market' | 'limit')
                      }
                    >
                      <option value="market">A Mercado (Market)</option>
                      <option value="limit">Límite (Limit)</option>
                    </select>
                  </div>

                  <div className={styles.terminalInputGroup}>
                    <label>Cantidad de Acciones</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={orderShares}
                      onChange={(e) =>
                        setOrderShares(
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                    />
                  </div>

                  {orderType === 'limit' && (
                    <div className={styles.terminalInputGroup}>
                      <label>Precio Límite (USD)</label>
                      <input
                        type="text"
                        value={orderLimitPrice}
                        onChange={(e) => setOrderLimitPrice(e.target.value)}
                        placeholder="Ej. 224.23"
                      />
                    </div>
                  )}
                </div>

                <div className={styles.terminalSummary}>
                  <div className={styles.terminalSummaryRow}>
                    <span>Cotización de referencia ({orderSymbol}):</span>
                    <strong>${currentPrice.toFixed(2)} USD</strong>
                  </div>
                  <div className={styles.terminalSummaryRow}>
                    <span>Subtotal de la orden ({orderShares} acciones):</span>
                    <strong>
                      $
                      {subtotal.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      USD
                    </strong>
                  </div>
                  <div className={styles.terminalSummaryRow}>
                    <span>Comisión Plataforma Acciones UD (1.2%):</span>
                    <strong>${commPlatform.toFixed(2)} USD</strong>
                  </div>
                  <div className={styles.terminalSummaryRow}>
                    <span>Comisión Asesor Carlos Rodríguez (0.8%):</span>
                    <strong>${commAdvisor.toFixed(2)} USD</strong>
                  </div>
                  <div
                    className={styles.terminalSummaryRow}
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '0.6rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: 'var(--color-text)' }}>
                      Total estimado de simulación:
                    </span>
                    <strong
                      style={{
                        color: 'var(--color-primary)',
                        fontSize: '1.2rem',
                      }}
                    >
                      $
                      {totalOrderUSD.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      USD
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.terminalTransmitBtn}
                  onClick={handleTransmitOrder}
                >
                  <Icon name="bolt" size={18} /> Colocar Orden de{' '}
                  {orderSide === 'buy' ? 'Compra' : 'Venta'} (Simulación USD)
                </button>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelHeading}>
                  <div>
                    <h2>Historial de Órdenes Bursátiles</h2>
                    <p
                      style={{
                        margin: '0.2rem 0 0',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Registro en tiempo real de operaciones simuladas en NYSE y
                      NASDAQ
                    </p>
                  </div>
                  <span className={styles.assigned}>
                    {filteredOrders.length}{' '}
                    {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
                  </span>
                </div>

                {/* Barra interactiva de filtros de órdenes */}
                <div className={styles.orderFiltersBar}>
                  <div className={styles.orderFilterSearch}>
                    <Icon name="search" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por símbolo, estado o mercado…"
                      value={orderFilterSearch}
                      onChange={(e) => setOrderFilterSearch(e.target.value)}
                    />
                  </div>

                  <div className={styles.orderFilterPills}>
                    <button
                      type="button"
                      className={
                        orderFilterSide === 'all'
                          ? styles.orderFilterPillActive
                          : styles.orderFilterPill
                      }
                      onClick={() => setOrderFilterSide('all')}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      className={
                        orderFilterSide === 'buy'
                          ? styles.orderFilterPillActive
                          : styles.orderFilterPill
                      }
                      onClick={() => setOrderFilterSide('buy')}
                    >
                      Compras
                    </button>
                    <button
                      type="button"
                      className={
                        orderFilterSide === 'sell'
                          ? styles.orderFilterPillActive
                          : styles.orderFilterPill
                      }
                      onClick={() => setOrderFilterSide('sell')}
                    >
                      Ventas
                    </button>
                  </div>

                  <select
                    className={styles.orderFilterSelect}
                    value={orderFilterType}
                    onChange={(e) =>
                      setOrderFilterType(
                        e.target.value as 'all' | 'market' | 'limit',
                      )
                    }
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="market">A Mercado</option>
                    <option value="limit">Límite</option>
                  </select>

                  <select
                    className={styles.orderFilterSelect}
                    value={orderFilterSymbol}
                    onChange={(e) => setOrderFilterSymbol(e.target.value)}
                  >
                    <option value="all">Todos los símbolos</option>
                    {Object.keys(stockPrices).map((sym) => (
                      <option key={sym} value={sym}>
                        {sym}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.tableScroll}>
                  <table>
                    <thead>
                      <tr>
                        <th>Símbolo</th>
                        <th>Tipo</th>
                        <th>Sentido</th>
                        <th>Cantidad</th>
                        <th>Precio Ejecución</th>
                        <th>Total (USD)</th>
                        <th>Estado</th>
                        <th>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              textAlign: 'center',
                              padding: '2.5rem 1rem',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            No se encontraron órdenes con los filtros
                            seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id}>
                            <td>
                              <strong>{ord.symbol}</strong>
                            </td>
                            <td>{ord.type}</td>
                            <td>
                              <span
                                style={{
                                  color:
                                    ord.side === 'Compra'
                                      ? '#10b981'
                                      : '#ef4444',
                                  fontWeight: 700,
                                }}
                              >
                                {ord.side}
                              </span>
                            </td>
                            <td>{ord.shares}</td>
                            <td>{ord.price}</td>
                            <td>{ord.total}</td>
                            <td>
                              <span className={styles.badgeOpen}>
                                {ord.status}
                              </span>
                            </td>
                            <td
                              style={{
                                fontSize: '0.78rem',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              {ord.time}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'portfolio' && (
            <div>
              <div className={styles.panel} style={{ marginBottom: '1.5rem' }}>
                <div className={styles.panelHeading}>
                  <h2>Posiciones Activas en Mercados de EE. UU. (USD)</h2>
                  <button
                    type="button"
                    onClick={() => setActiveSection('orders')}
                    className={styles.primary}
                    style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                  >
                    + Nueva Orden
                  </button>
                </div>
                <div className={styles.tableScroll}>
                  <table>
                    <thead>
                      <tr>
                        <th>Activo / Empresa</th>
                        <th>Bolsa</th>
                        <th>Títulos</th>
                        <th>Precio Compra</th>
                        <th>Precio Actual</th>
                        <th>Valor Total</th>
                        <th>Ganancia / Pérdida</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardPreview.stocks.map((stock) => (
                        <tr key={stock.symbol}>
                          <td>
                            <strong>{stock.symbol}</strong> · {stock.name}
                          </td>
                          <td>
                            <span className={styles.exchange}>
                              {stock.exchange}
                            </span>
                          </td>
                          <td>
                            {stock.symbol === 'AAPL'
                              ? 40
                              : stock.symbol === 'TSLA'
                                ? 35
                                : 55}
                          </td>
                          <td>{stock.price}</td>
                          <td className={styles.price}>{stock.price}</td>
                          <td>
                            <strong>
                              $
                              {stock.symbol === 'AAPL'
                                ? '8,969.20'
                                : stock.symbol === 'TSLA'
                                  ? '7,644.00'
                                  : '11,869.00'}{' '}
                              USD
                            </strong>
                          </td>
                          <td
                            className={
                              stock.negative ? styles.negative : styles.positive
                            }
                          >
                            {stock.change}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                setOrderSymbol(stock.symbol);
                                setActiveSection('orders');
                              }}
                              className={styles.invest}
                            >
                              Operar
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

          {activeSection === 'funds' && (
            <div className={styles.fundsGrid}>
              <div className={styles.fundsCard}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  Gestión de Fondos Simulados (USD)
                </h2>
                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    marginBottom: '1.25rem',
                    fontSize: '0.88rem',
                  }}
                >
                  Tu cuenta opera con fondos de simulación pedagógica para
                  prácticas de inversión en Wall Street.
                </p>
                <div
                  className={styles.terminalSummary}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <div className={styles.terminalSummaryRow}>
                    <span>Efectivo libre disponible:</span>
                    <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>
                      $64,450.00 USD
                    </strong>
                  </div>
                  <div className={styles.terminalSummaryRow}>
                    <span>Capital invertido en acciones:</span>
                    <strong>$35,550.00 USD</strong>
                  </div>
                  <div
                    className={styles.terminalSummaryRow}
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '0.5rem',
                    }}
                  >
                    <span>Patrimonio total de la cuenta:</span>
                    <strong>$100,000.00 USD</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() =>
                      alert(
                        '¡Fondos académicos de simulación acreditados exitosamente (+10,000 USD)!',
                      )
                    }
                  >
                    Acreditar Fondos de Práctica (+10,000 USD)
                  </button>
                  <button
                    type="button"
                    className={styles.navButton}
                    style={{ border: '1px solid var(--color-border)' }}
                    onClick={() => setActiveSection('orders')}
                  >
                    Ir a Invertir
                  </button>
                </div>
              </div>

              <div className={styles.fundsCard}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  Historial de Movimientos de Cuenta
                </h2>
                <div
                  className={styles.tableScroll}
                  style={{ marginTop: '1rem' }}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Concepto</th>
                        <th>Monto (USD)</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>11/11/2026</td>
                        <td>Apertura de Cuenta Simulación</td>
                        <td style={{ color: '#10b981', fontWeight: 700 }}>
                          +$100,000.00
                        </td>
                        <td>
                          <span className={styles.badgeOpen}>Completado</span>
                        </td>
                      </tr>
                      <tr>
                        <td>11/11/2026</td>
                        <td>Compra Acciones AAPL (Wall Street)</td>
                        <td style={{ color: '#ef4444', fontWeight: 700 }}>
                          -$3,322.50
                        </td>
                        <td>
                          <span className={styles.badgeOpen}>Liquidado</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'advisors' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>
                  Directorio Oficial de Comisionistas y Asesores
                </h2>
                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  Profesionales acreditados para estructurar y supervisar tu
                  portafolio en mercados de Estados Unidos (NYSE / NASDAQ).
                </p>
              </div>

              <div className={styles.advisorsGrid}>
                {advisorsData.map((adv) => (
                  <div key={adv.id} className={styles.advisorCardDetailed}>
                    <div className={styles.advisorCardHeader}>
                      <button
                        type="button"
                        className={styles.advisorPhotoBtn}
                        onClick={() => {
                          setSelectedAdvisor(adv);
                          advisorDialog.current?.showModal();
                        }}
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
                        <span className={styles.advisorPhotoZoomIcon}>
                          <Icon name="search" size={11} />
                        </span>
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                            {adv.name}
                          </h3>
                          {adv.assigned && (
                            <span className={styles.assigned}>Asignado</span>
                          )}
                        </div>
                        <small style={{ color: 'var(--color-text-muted)' }}>
                          {adv.license}
                        </small>
                        <div
                          style={{
                            color: '#f59e0b',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            marginTop: '0.2rem',
                          }}
                        >
                          ★ {adv.rating} · {adv.success} Acierto (
                          {adv.proposals} propuestas)
                        </div>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-text-muted)',
                        margin: '0.5rem 0',
                        lineHeight: 1.45,
                      }}
                    >
                      {adv.bio}
                    </p>

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
                            className={styles.navButton}
                            style={{ border: '1px solid var(--color-border)' }}
                            onClick={() => setActiveSection('orders')}
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
                        className={styles.navButton}
                        style={{
                          border: '1px solid var(--color-border)',
                          fontSize: '0.8rem',
                          padding: '0.45rem 0.8rem',
                        }}
                        onClick={() => {
                          setSelectedAdvisor(adv);
                          advisorDialog.current?.showModal();
                        }}
                      >
                        🔍 Ver Ficha Técnica y Foto Ampliada
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Rico de Perfil y KYC con Gestión Interactiva */}
      <dialog ref={profileDialog} className={styles.profileDialog}>
        <form method="dialog">
          <button className={styles.modalCloseBtn} aria-label="Cerrar ventana">
            <Icon name="close" size={16} />
          </button>
        </form>

        <div className={styles.profileHeader}>
          <div className={styles.profileAvatarLarge}>{userInitials}</div>
          <div className={styles.profileNameArea}>
            <h2>{displayName}</h2>
            <div className={styles.profileBadges}>
              <span className={styles.profileBadgeActive}>
                ● Cuenta{' '}
                {user?.account_status === 'active'
                  ? 'Activa'
                  : (user?.account_status ?? 'Activa')}
              </span>
              <span className={styles.profileBadgeRole}>
                {user?.roles?.join(', ') || 'Inversionista Bursátil'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.profileTabs}>
          <button
            type="button"
            className={`${styles.profileTab} ${profileTab === 'info' ? styles.profileTabActive : ''}`}
            onClick={() => setProfileTab('info')}
          >
            Datos &amp; Seguridad
          </button>
          <button
            type="button"
            className={`${styles.profileTab} ${profileTab === 'edit' ? styles.profileTabActive : ''}`}
            onClick={() => setProfileTab('edit')}
          >
            Editar Intereses &amp; Nivel
          </button>
        </div>

        {profileTab === 'info' ? (
          <>
            <div className={styles.profileCardsGrid}>
              <div className={styles.profileCard}>
                <span className={styles.profileCardTitle}>
                  Correo Electrónico
                </span>
                <span className={styles.profileCardValue}>
                  {user?.email ?? 'correo@ejemplo.com'}
                </span>
              </div>

              <div className={styles.profileCard}>
                <span className={styles.profileCardTitle}>
                  Teléfono de Contacto
                </span>
                <span className={styles.profileCardValue}>
                  {user?.phone ?? '+57 300 000 0000'}
                </span>
              </div>

              <div className={styles.profileCard}>
                <span className={styles.profileCardTitle}>
                  País de Residencia
                </span>
                <span className={styles.profileCardValue}>
                  {user?.country ? `${user.country} · Colombia` : 'Colombia'}
                </span>
              </div>

              <div className={styles.profileCard}>
                <span className={styles.profileCardTitle}>
                  Nivel de Inversor
                </span>
                <span className={styles.profileCardValue}>
                  {user?.investor_level === 'experienced'
                    ? 'Con experiencia (Wall Street)'
                    : 'Principiante (Formación)'}
                </span>
              </div>

              <div className={styles.profileCard}>
                <span className={styles.profileCardTitle}>
                  Estado KYC / Identidad
                </span>
                <span className={styles.profileCardValue}>
                  {user?.kyc_status ??
                    (user?.kyc_status_unavailable
                      ? 'No disponible'
                      : 'Verificación Básica')}
                </span>
              </div>

              <div className={styles.profileCard}>
                <span className={styles.profileCardTitle}>
                  Seguridad 2FA / MFA
                </span>
                <span className={styles.profileCardValue}>
                  <span
                    className={
                      user?.mfa_enrolled
                        ? styles.badgeActiveSimple
                        : styles.badgeInactiveSimple
                    }
                  >
                    {user?.mfa_enrolled ? '● Activa' : '○ Inactiva'}
                  </span>
                </span>
              </div>
            </div>

            <div className={styles.profileInterestsSection}>
              <span className={styles.profileCardTitle}>
                Sectores de Interés Bursátil Registrados
              </span>
              <div className={styles.interestsChips}>
                {user?.interests && user.interests.length > 0 ? (
                  user.interests.map((interest) => (
                    <span key={interest} className={styles.interestTag}>
                      {interest}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    No has seleccionado sectores de interés aún.
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.editorSection}>
            {saveSuccess && (
              <p className={styles.profileSuccessMessage} role="status">
                {saveSuccess}
              </p>
            )}
            {saveError && (
              <p className={styles.profileErrorMessage} role="alert">
                {saveError}
              </p>
            )}

            <div className={styles.editorField}>
              <label className={styles.editorLabel}>Nivel de Inversor</label>
              <span className={styles.editorHelp}>
                El nivel principiante activa las guías didácticas y filtra
                instrumentos de alto riesgo en Wall Street.
              </span>
              <select
                className={styles.editorSelect}
                value={editableLevel}
                onChange={(e) =>
                  setOverrideLevel(e.target.value as 'beginner' | 'experienced')
                }
              >
                <option value="beginner">
                  Principiante (Con guías didácticas de apoyo)
                </option>
                <option value="experienced">
                  Con experiencia (Operación activa sin restricciones)
                </option>
              </select>
            </div>

            <div className={styles.editorField}>
              <label className={styles.editorLabel}>
                Sectores bursátiles de interés (Haz clic para seleccionar o
                deseleccionar)
              </label>
              <span className={styles.editorHelp}>
                Seleccionados: {editableInterests.length} de 20 permitidos
              </span>
              <div className={styles.chipsGrid}>
                {marketInterestsCatalog.map((cat) => {
                  const isSelected = editableInterests.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      className={`${styles.chipBtn} ${isSelected ? styles.chipBtnSelected : ''}`}
                      onClick={() => toggleInterest(cat.value)}
                    >
                      <span>{isSelected ? '✓' : '+'}</span> {cat.value}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                className={styles.primary}
                disabled={savingPreferences}
                onClick={handleSavePreferences}
              >
                {savingPreferences
                  ? 'Guardando…'
                  : 'Guardar Preferencias en Cuenta'}
              </button>
              <button
                type="button"
                className={styles.chipBtn}
                onClick={() => setProfileTab('info')}
              >
                Ver datos
              </button>
            </div>
          </div>
        )}

        <div className={styles.profileDialogActions}>
          <button
            type="button"
            className={styles.navButton}
            style={{
              width: 'auto',
              padding: '0.6rem 1.25rem',
              color: '#ef4444',
            }}
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </dialog>

      {/* Modal de Detalle Técnico y Foto Ampliada del Comisionista */}
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
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                    {selectedAdvisor.name}
                  </h3>
                  {selectedAdvisor.assigned && (
                    <span className={styles.assigned}>Asesor Asignado</span>
                  )}
                </div>
                <small style={{ color: 'var(--color-text-muted)' }}>
                  {selectedAdvisor.license}
                </small>
                <div
                  style={{
                    color: '#f59e0b',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    marginTop: '0.25rem',
                  }}
                >
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
                <strong style={{ fontSize: '0.9rem' }}>NYSE / NASDAQ</strong>
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
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Activos recomendados:
                </span>
                {selectedAdvisor.recommendedAssets.map((sym) => (
                  <span key={sym} className={styles.advisorAssetPill}>
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.6rem',
                justifyContent: 'flex-end',
                marginTop: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className={styles.navButton}
                style={{ border: '1px solid var(--color-border)' }}
                onClick={() => advisorDialog.current?.close()}
              >
                Cerrar
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={() => {
                  advisorDialog.current?.close();
                  setActiveSection('orders');
                }}
              >
                Operar con su estrategia en Wall Street
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
