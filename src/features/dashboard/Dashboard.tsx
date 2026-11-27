'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/LoadingState';
import { SessionClosedOverlay } from '@/components/ui/SessionClosedOverlay';
import { DashboardRecoveryCodes } from '@/features/login/client';
import {
  formatKycSubmissionError,
  readKyc,
  validateBirthDateAge,
} from '@/features/registration';
import { fetchWalletBalance } from '@/features/wallet';
import {
  ApiError,
  QUERY_STALE_TIMES,
  queryKeys,
  subscribeSessionExpired,
} from '@/lib/api';
import { formatPersonName } from '@/lib/format-person-name';
import { formatUsd } from '@/lib/formatters';
import { useLocale } from '@/lib/i18n';
import { toggleDocumentTheme } from '@/lib/theme';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardOverviewSection } from './components/DashboardOverviewSection';
import { DashboardSidebar } from './components/DashboardSidebar';
import { ProfileKycDialog } from './components/ProfileKycDialog';
import {
  getGuideServerSnapshot,
  getGuideSnapshot,
  subscribeGuideStore,
  type DashboardSection,
} from './dashboard-constants';
import { dashboardPreview } from './dashboard-preview';
import {
  fetchKycStatus,
  getCurrentUser,
  logoutCurrentSession,
  submitKycApplication,
  updateUserInterests,
  type UserProfile,
} from './user-api';
import styles from './dashboard.module.css';

export type { DashboardSection } from './dashboard-constants';

function DashboardTabLoading() {
  const { tx } = useLocale();
  return (
    <LoadingState
      label={tx('Cargando módulo…', 'Loading workspace module…')}
      detail={tx(
        'Preparando vista y datos en tiempo real.',
        'Preparing view and real-time data.',
      )}
    />
  );
}

const DynamicMarkets = dynamic(
  () => import('@/features/markets').then((mod) => mod.Markets),
  { loading: () => <DashboardTabLoading /> },
);

const DynamicTradingTerminal = dynamic(
  () => import('@/features/trading').then((mod) => mod.TradingTerminal),
  { loading: () => <DashboardTabLoading /> },
);

const DynamicPortfolioDashboard = dynamic(
  () => import('@/features/portfolio').then((mod) => mod.PortfolioDashboard),
  { loading: () => <DashboardTabLoading /> },
);

const DynamicWalletDashboard = dynamic(
  () => import('@/features/wallet').then((mod) => mod.WalletDashboard),
  { loading: () => <DashboardTabLoading /> },
);

const DynamicBrokersHub = dynamic(
  () => import('@/features/brokers').then((mod) => mod.BrokersHub),
  { loading: () => <DashboardTabLoading /> },
);

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
  const { tx } = useLocale();
  const mobile = useSyncExternalStore(subscribeMobile, isMobile, () => false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<DashboardSection>(initialSection);
  const [brokerEntry, setBrokerEntry] = useState<'current' | 'directory'>(
    'current',
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileTab, setProfileTab] = useState<'info' | 'edit' | 'kyc'>('info');
  const [kycModalStep, setKycModalStep] = useState(2);
  const [kycBusy, setKycBusy] = useState(false);
  const [kycMsg, setKycMsg] = useState('');
  const [kycErr, setKycErr] = useState('');
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
  const [orderSymbol, setOrderSymbol] = useState('AAPL');
  const [sessionClosed, setSessionClosed] = useState(false);

  const profileDialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const manualLogoutRef = useRef(false);
  const hadActiveSessionRef = useRef(false);
  const activeSectionRef = useRef(activeSection);

  const guideDismissed = useSyncExternalStore(
    subscribeGuideStore,
    getGuideSnapshot,
    getGuideServerSnapshot,
  );

  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: ({ signal }) => getCurrentUser(signal),
    staleTime: QUERY_STALE_TIMES.session,
    retry: false,
  });
  const user = localUser ?? userQuery.data;

  const kycQuery = useQuery({
    queryKey: queryKeys.kyc.status(),
    queryFn: ({ signal }) => fetchKycStatus(signal),
    staleTime: QUERY_STALE_TIMES.session,
    retry: false,
  });

  const walletQuery = useQuery({
    queryKey: queryKeys.wallet.summary(),
    queryFn: ({ signal }) => fetchWalletBalance(signal),
    staleTime: QUERY_STALE_TIMES.realtime,
    retry: false,
  });

  const isLoadingAccount =
    userQuery.isPending || kycQuery.isPending || walletQuery.isPending;
  const realWallet = walletQuery.data;
  const hasRealAccount = Boolean(kycQuery.data?.has_account || kycMsg);
  const sessionExpired =
    sessionClosed ||
    (!loggingOut &&
      activeSection !== 'markets' &&
      userQuery.error instanceof ApiError &&
      userQuery.error.metadata.status === 401);

  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    if (userQuery.data || kycQuery.data || walletQuery.data) {
      hadActiveSessionRef.current = true;
    }
  }, [userQuery.data, kycQuery.data, walletQuery.data]);

  useEffect(() => {
    return subscribeSessionExpired((path) => {
      if (manualLogoutRef.current) return;
      const isPublicMarketsPath =
        path.startsWith('/api/v1/markets') ||
        path.startsWith('/api/v1/instruments') ||
        path.startsWith('/api/v1/users/me') ||
        path.startsWith('/api/v1/kyc') ||
        path.startsWith('/api/v1/wallet');
      if (
        activeSectionRef.current === 'markets' &&
        !hadActiveSessionRef.current &&
        isPublicMarketsPath
      ) {
        return;
      }
      if (
        profileDialog.current?.open &&
        typeof profileDialog.current.close === 'function'
      ) {
        profileDialog.current.close();
      }
      queryClient.clear();
      setSessionClosed(true);
    });
  }, [queryClient]);
  const headerAccountTotal = realWallet
    ? formatUsd(
        realWallet.available_balance_usd +
          realWallet.reserved_balance_usd +
          realWallet.invested_equity_usd,
      )
    : hasRealAccount || user
      ? '$0.00'
      : dashboardPreview.accountValue;

  const editableLevel =
    overrideLevel ??
    (user?.investor_level === 'experienced' ? 'experienced' : 'beginner');
  const editableInterests =
    overrideInterests ??
    (user?.interests?.length
      ? user.interests
      : ['Tecnología & Semiconductores']);

  function navigateToSection(section: DashboardSection) {
    setBrokerEntry('current');
    setActiveSection(section);
    if (mobile) setMobileOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function startOrderForSymbol(symbol: string) {
    setOrderSymbol(symbol);
    navigateToSection('orders');
  }

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
      setSaveError(
        tx(
          'Selecciona al menos un interés bursátil.',
          'Select at least one market interest.',
        ),
      );
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
        tx(
          '¡Preferencias e intereses actualizados con éxito en tu cuenta!',
          'Your preferences and interests have been updated!',
        ),
      );
      if (user) {
        setLocalUser({
          ...user,
          investor_level: editableLevel,
          interests: editableInterests,
        });
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.metadata.status === 422) {
        setSaveError(
          tx(
            'Algunas preferencias seleccionadas aún no están habilitadas en el catálogo activo. Selecciona bolsas principales (NYSE, NASDAQ, AMEX) para guardar.',
            'Some selected preferences are not enabled in the active catalog yet. Choose primary exchanges (NYSE, NASDAQ, AMEX) to save.',
          ),
        );
      } else {
        setSaveError(
          tx(
            'No se pudieron guardar las preferencias en este momento. Inténtalo de nuevo.',
            'Could not save preferences right now. Please try again.',
          ),
        );
      }
    } finally {
      setSavingPreferences(false);
    }
  }

  async function handleDashboardKycSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (kycBusy || !user) return;
    setKycErr('');
    setKycMsg('');
    const form = e.currentTarget;
    for (const control of form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input,select,textarea')) {
      if (!control.closest('[hidden]') && !control.checkValidity()) {
        setKycErr(
          tx(
            'Completa todos los campos obligatorios de este paso antes de continuar.',
            'Please fill in all required fields for this step before continuing.',
          ),
        );
        return;
      }
    }
    const data = new FormData(form);
    if (kycModalStep === 2) {
      const dobError = validateBirthDateAge(
        String(data.get('date_of_birth') ?? ''),
      );
      if (dobError) {
        setKycErr(dobError);
        return;
      }
      if (!data.get('state') || !data.get('city')) {
        setKycErr(
          tx(
            'Selecciona tu departamento/estado y ciudad.',
            'Select your state/region and city.',
          ),
        );
        return;
      }
      setKycModalStep(3);
      return;
    }

    const baseInfo = {
      first_names: formatPersonName(user.first_names),
      last_names: formatPersonName(user.last_names),
      email: user.email,
      phone: user.phone,
      country: user.country,
      password: '',
      terms_accepted: true,
      monthly_report: false,
      interests: user.interests,
      investor_level: user.investor_level,
      broker_requested: Boolean(user.broker_requested),
      premium_requested: user.is_premium,
    };

    if (kycModalStep === 3) {
      try {
        readKyc(data, baseInfo);
      } catch (cause) {
        setKycErr(
          cause instanceof Error
            ? cause.message
            : tx(
                'Revisa tu perfil financiero.',
                'Review your financial profile.',
              ),
        );
        return;
      }
      setKycModalStep(4);
      return;
    }

    let payload: Record<string, unknown>;
    try {
      payload = readKyc(data, baseInfo);
    } catch (cause) {
      setKycErr(
        cause instanceof Error
          ? cause.message
          : tx('Revisa los datos del trámite KYC.', 'Review your KYC details.'),
      );
      return;
    }

    setKycBusy(true);
    try {
      const res = await submitKycApplication(payload);
      setKycMsg(
        tx(
          '¡Trámite KYC radicado exitosamente! Tu solicitud quedó registrada y en proceso de validación.',
          'KYC application submitted! Your verification is now registered and pending review.',
        ),
      );
      setLocalUser((prev) =>
        prev ? { ...prev, kyc_status: res.status } : null,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.kyc.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all }),
      ]);
      await Promise.all([
        kycQuery.refetch(),
        userQuery.refetch(),
        walletQuery.refetch(),
      ]);
    } catch (cause) {
      setKycErr(
        cause instanceof ApiError
          ? formatKycSubmissionError(
              cause.message,
              cause.metadata.invalidFields,
              payload,
            )
          : tx(
              'No se pudo enviar la solicitud KYC al servidor.',
              'Could not submit the KYC application to the server.',
            ),
      );
    } finally {
      setKycBusy(false);
    }
  }

  async function handleLogout() {
    manualLogoutRef.current = true;
    setLoggingOut(true);
    try {
      await logoutCurrentSession();
    } catch {
      /* Redirigir aun si falla la revocación en servidor. */
    }
    queryClient.clear();
    router.push('/login');
  }

  function toggleTheme() {
    toggleDocumentTheme();
  }

  function closeMenu() {
    setMobileOpen(false);
    menu.current?.focus();
  }

  const normalizedFirstNames = user ? formatPersonName(user.first_names) : '';
  const normalizedLastNames = user ? formatPersonName(user.last_names) : '';

  const userInitials = user
    ? `${normalizedFirstNames[0] ?? ''}${normalizedLastNames[0] ?? ''}`.toUpperCase()
    : dashboardPreview.user.initials;

  const displayName = user
    ? `${normalizedFirstNames} ${normalizedLastNames}`.trim()
    : formatPersonName(dashboardPreview.user.name);

  if (sessionExpired) {
    return (
      <SessionClosedOverlay
        onBeforeNavigate={() => {
          queryClient.clear();
        }}
      />
    );
  }

  return (
    <div className={`${styles.dashboard} ${collapsed ? styles.collapsed : ''}`}>
      <a className={styles.skip} href="#dashboard-content">
        {tx('Saltar al contenido', 'Skip to content')}
      </a>
      {mobileOpen && (
        <button
          className={styles.backdrop}
          aria-label={tx('Cerrar navegación', 'Close navigation')}
          onClick={closeMenu}
        />
      )}

      <DashboardSidebar
        activeSection={activeSection}
        collapsed={collapsed}
        mobile={mobile}
        mobileOpen={mobileOpen}
        isAdmin={Boolean(user?.roles?.includes('administrator'))}
        loggingOut={loggingOut}
        onNavigate={navigateToSection}
        onToggleCollapse={() => {
          if (window.matchMedia('(max-width: 64rem)').matches) {
            setMobileOpen(false);
          } else {
            setCollapsed(!collapsed);
          }
        }}
        onCloseMobile={closeMenu}
        onOpenProfile={() => profileDialog.current?.showModal()}
        onLogout={handleLogout}
      />

      <div className={styles.workspace}>
        <DashboardHeader
          menuRef={menu}
          activeSection={activeSection}
          mobile={mobile}
          mobileOpen={mobileOpen}
          collapsed={collapsed}
          isLoadingAccount={isLoadingAccount}
          hasRealWallet={Boolean(realWallet)}
          headerAccountTotal={headerAccountTotal}
          displayName={displayName}
          userInitials={userInitials}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          onOpenProfile={() => profileDialog.current?.showModal()}
          onToggleTheme={toggleTheme}
        />

        <main id="dashboard-content" className={styles.content}>
          <DashboardRecoveryCodes />

          {activeSection === 'dashboard' && (
            <DashboardOverviewSection
              user={user}
              realWallet={realWallet}
              hasRealAccount={hasRealAccount}
              isLoadingData={isLoadingAccount}
              guideDismissed={guideDismissed}
              onNavigate={navigateToSection}
              onExploreAdvisors={() => {
                navigateToSection('advisors');
                setBrokerEntry('directory');
              }}
              onStartOrderForSymbol={startOrderForSymbol}
              onOpenKycModal={() => {
                setProfileTab('kyc');
                setKycModalStep(2);
                profileDialog.current?.showModal();
              }}
            />
          )}

          {activeSection === 'markets' && <DynamicMarkets />}

          {activeSection === 'orders' && (
            <DynamicTradingTerminal initialSymbol={orderSymbol} />
          )}

          {activeSection === 'portfolio' && (
            <DynamicPortfolioDashboard
              onNavigateToOrder={startOrderForSymbol}
            />
          )}

          {activeSection === 'funds' && <DynamicWalletDashboard />}

          {activeSection === 'advisors' && (
            <div>
              <div className={styles.sectionSpacing}>
                <DynamicBrokersHub
                  initialTab={brokerEntry}
                  {...(user?.user_id ? { userId: user.user_id } : {})}
                  {...(user?.roles ? { userRoles: user.roles } : {})}
                  onNavigateToOrder={startOrderForSymbol}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <ProfileKycDialog
        dialogRef={profileDialog}
        user={user}
        kycData={kycQuery.data}
        hasRealAccount={hasRealAccount}
        userInitials={userInitials}
        displayName={displayName}
        profileTab={profileTab}
        editableLevel={editableLevel}
        editableInterests={editableInterests}
        savingPreferences={savingPreferences}
        saveSuccess={saveSuccess}
        saveError={saveError}
        kycModalStep={kycModalStep}
        kycBusy={kycBusy}
        kycMsg={kycMsg}
        kycErr={kycErr}
        onChangeProfileTab={setProfileTab}
        onChangeEditableLevel={setOverrideLevel}
        onToggleInterest={toggleInterest}
        onSavePreferences={handleSavePreferences}
        onChangeKycStep={setKycModalStep}
        onClearKycError={() => setKycErr('')}
        onSubmitKyc={handleDashboardKycSubmit}
        onPersonalProfileSaved={(profile) => {
          if (user) {
            const updated = { ...user, ...profile };
            setLocalUser(updated);
            queryClient.setQueryData(queryKeys.users.me(), updated);
          }
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
