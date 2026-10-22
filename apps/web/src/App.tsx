import { useEffect, useState } from 'react';
import { ConfigProvider, Layout, Menu, Button, Input, Tag, Avatar, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { isRTL } from './lib/i18n';
import { useAuthStore } from './store/auth-store';
import { IS_PLATFORM_OWNER } from './store/platform-owner';
import { apiClient, DEFAULT_TENANT_SLUG } from './lib/api-client';
import { getAppTheme } from './design-system/theme';
import './design-system/styles.css';

import { LoginView } from './features/auth/LoginView';
import { DashboardView } from './features/dashboard/DashboardView';
import { PatientsView } from './features/patients/PatientsView';
import { ServicesView } from './features/services/ServicesView';
import { AppointmentsView } from './features/appointments/AppointmentsView';
import { InvoicesView } from './features/invoices/InvoicesView';
import { PlatformAdminView } from './features/platform-admin/PlatformAdminView';
import { BeforeAfterView } from './features/before-after/BeforeAfterView';
import { AuditLogsView } from './features/audit/AuditLogsView';
import { SettingsView } from './features/settings/SettingsView';
import { DevicesView } from './features/devices/DevicesView';
import { PatientPortal } from './features/portal/PatientPortal';
import { LaserWorkspaceView } from './features/laser/LaserWorkspaceView';
import { InjectablesWorkspaceView } from './features/injectables/InjectablesWorkspaceView';
import { SkinCareSpaCombinedView } from './features/skincare/SkinCareSpaCombinedView';
import { PackagesManagerView } from './features/packages/PackagesManagerView';
import { InventoryManager } from './features/inventory/InventoryManager';
import { DailyReportView } from './features/reports/DailyReportView';

import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Search,
  Languages,
  Cpu,
  LogOut,
  Package,
  Zap,
  Syringe,
  Ticket,
  HeartHandshake,
  BarChart3,
} from 'lucide-react';
import { ClinicType } from '@clinic/shared-types';
import { SPECIALTY_LOCK, getSpecialtyModule } from './specialties';
import arEG from 'antd/locale/ar_EG';
import enUS from 'antd/locale/en_US';

const { Header, Content, Sider } = Layout;

const CLINIC_TYPE_LABELS: Record<string, string> = {
  [ClinicType.GENERAL_MEDICAL]: 'General Medical',
  [ClinicType.DENTAL]: 'Dental Practice',
  [ClinicType.DERMATOLOGY]: 'Dermatology',
  [ClinicType.PHYSIOTHERAPY]: 'Physiotherapy & Rehab',
  [ClinicType.REHABILITATION]: 'Rehabilitation',
  [ClinicType.NUTRITION]: 'Nutrition & Dietetics',
  [ClinicType.PSYCHOLOGY]: 'Psychology & Wellness',
  [ClinicType.ORTHOPEDIC]: 'Orthopedic Center',
  [ClinicType.OPHTHALMOLOGY]: 'Ophthalmology',
  [ClinicType.ENT]: 'ENT Center',
  [ClinicType.PEDIATRICS]: 'Pediatrics',
  [ClinicType.GYNECOLOGY]: 'Gynecology & Women',
  [ClinicType.AESTHETIC]: 'Aesthetic & Cosmetic',
  [ClinicType.OTHER]: 'Specialized Clinic',
  [ClinicType.CUSTOM]: 'Custom Practice',
};

export function App() {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.language || 'ar').startsWith('en') ? 'en' : 'ar';
  const rtl = isRTL(currentLanguage);

  const { user, clinic, setClinic, isAuthenticated, logout } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<string>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const getTenantSlug = () => {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }
    // Single-origin deploys (e.g. entrustic-beauty.vercel.app) have a bare
    // two-label host, so there is no subdomain to read. Fall back to the
    // configured slug rather than a hardcoded "demo", which no longer exists
    // in the database and would make the public config 404.
    return localStorage.getItem('dev_tenant_slug') || DEFAULT_TENANT_SLUG;
  };

  // Single-specialty program build (SPECIALTY_LOCK) → drives branding fallbacks.
  const lockedConfig = SPECIALTY_LOCK ? getSpecialtyModule(SPECIALTY_LOCK)?.config : undefined;
  const lockedName = lockedConfig ? 'Entrustic Beauty' : undefined;
  const lockedType = SPECIALTY_LOCK ?? ClinicType.GENERAL_MEDICAL;

  useEffect(() => {
    const slug = getTenantSlug();
    apiClient
      .get(`/clinics/public-config/${slug}`)
      .then((res: any) => {
        if (res.data) {
          setClinic(res.data);
        }
      })
      .catch(() => {
        // Generic fallback practice profile (no dental hardcoding)
        setClinic({
          id: 'demo-tenant-id',
          name: lockedName || 'Entrustic Beauty',
          slug: DEFAULT_TENANT_SLUG,
          clinicType: lockedType,
          specialties: [lockedType],
          status: 'active' as any,
          defaultLanguage: 'ar',
          currency: 'EGP',
          timezone: 'Africa/Cairo',
          phone: '+20 2 2795 0000',
          email: 'contact@beauty-clinic.com',
          address: '14 El-Tahrir St, Downtown, Cairo, Egypt',
          branding: {
            primaryColor: lockedConfig?.themeColor || '#ec4899',
            welcomeMessage:
              lockedConfig?.taglineAr || 'مرحباً بكم في مركز الجلدية والطب التجميلي والليزر',
          },
          enabledModules: [
            'dashboard',
            'patients',
            'appointments',
            'records',
            'services',
            'invoices',
            'before_after',
            'audit_logs',
          ],
        });
      });
  }, [setClinic]);

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    try {
      localStorage.setItem('i18nextLng', newLang);
    } catch {}
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const primaryColor = clinic?.branding?.primaryColor || lockedConfig?.themeColor || '#2563EB';

  const menuItems = [
    {
      key: 'dashboard',
      icon: <LayoutDashboard size={18} />,
      label: currentLanguage === 'ar' ? 'لوحة التحكم' : 'Dashboard',
    },
    {
      key: 'patients',
      icon: <Users size={18} />,
      label: currentLanguage === 'ar' ? 'سجل الحالات والعملاء' : 'Clients & Cases',
    },
    {
      key: 'laser',
      icon: <Zap size={18} />,
      label: currentLanguage === 'ar' ? 'جلسات الليزر وإزالة الشعر' : 'Laser Hair Removal',
    },
    {
      key: 'injectables',
      icon: <Syringe size={18} />,
      label: currentLanguage === 'ar' ? 'البوتوكس وحقن الفيلر' : 'Botox & Injectables',
    },
    {
      key: 'skincare',
      icon: <Sparkles size={18} />,
      label: currentLanguage === 'ar' ? 'العناية ببشرة الوجه والماسكات' : 'Facial Care & Face Masks',
    },
    {
      key: 'bodycare',
      icon: <HeartHandshake size={18} />,
      label: currentLanguage === 'ar' ? 'العناية بالجسم والسبا والمساج' : 'Body Care, Spa & Massage',
    },
    {
      key: 'packages',
      icon: <Ticket size={18} />,
      label: currentLanguage === 'ar' ? 'باقات وعروض الجلسات' : 'Packages & Credits',
    },
    {
      key: 'appointments',
      icon: <Calendar size={18} />,
      label: currentLanguage === 'ar' ? 'المواعيد والحجوزات' : 'Appointments & Calendar',
    },
    {
      key: 'invoices',
      icon: <CreditCard size={18} />,
      label: currentLanguage === 'ar' ? 'الفواتير والمالية والخزينة' : 'Billing & Cashier',
    },
    {
      key: 'inventory',
      icon: <Package size={18} />,
      label: currentLanguage === 'ar' ? 'المخزون والمستلزمات' : 'Inventory & Expiry',
    },
    {
      key: 'reports',
      icon: <BarChart3 size={18} />,
      label: currentLanguage === 'ar' ? 'التقارير اليومية' : 'Daily Reports',
    },
    {
      key: 'devices',
      icon: <Cpu size={18} />,
      label: currentLanguage === 'ar' ? 'أجهزة العيادة والمعايرة' : 'Devices & Equipment',
    },
    ...(clinic?.enabledModules?.includes('before_after')
      ? [
          {
            key: 'before-after',
            icon: <Sparkles size={18} />,
            label: currentLanguage === 'ar' ? 'معرض قبل وبعد' : 'Before & After Gallery',
          },
        ]
      : []),
    {
      key: 'audit',
      icon: <ShieldCheck size={18} />,
      label: currentLanguage === 'ar' ? 'سجل الرقابة والأمان' : 'Regulatory Audit Trail',
    },
    ...(IS_PLATFORM_OWNER
      ? [
          {
            key: 'platform-admin',
            icon: <ShieldAlert size={18} />,
            label: currentLanguage === 'ar' ? 'إدارة المنصة' : 'Platform Admin',
          },
        ]
      : []),
    {
      key: 'settings',
      icon: <Settings size={18} />,
      label: currentLanguage === 'ar' ? 'إعدادات العيادة' : 'Clinic Settings',
    },
  ];

  const renderContent = () => {
    switch (selectedTab) {
      case 'patients':
        return <PatientsView />;
      case 'laser':
        return <LaserWorkspaceView />;
      case 'injectables':
        return <InjectablesWorkspaceView />;
      case 'skincare':
      case 'spa':
        return <SkinCareSpaCombinedView initialTab={selectedTab === 'spa' ? 'spa' : 'skincare'} />;
      case 'bodycare':
        return <SkinCareSpaCombinedView initialTab="bodycare" />;
      case 'packages':
        return <PackagesManagerView />;
      case 'services':
        return <ServicesView currency={clinic?.currency || 'EGP'} />;
      case 'devices':
        return <DevicesView />;
      case 'inventory':
        return <InventoryManager />;
      case 'reports':
        return <DailyReportView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'invoices':
        return <InvoicesView currency={clinic?.currency || 'EGP'} />;
      case 'before-after':
        return <BeforeAfterView />;
      case 'audit':
        return <AuditLogsView />;
      case 'platform-admin':
        return IS_PLATFORM_OWNER ? <PlatformAdminView /> : <DashboardView onNavigate={(tab) => setSelectedTab(tab)} />;
      case 'settings':
        return <SettingsView />;
      case 'dashboard':
      default:
        return <DashboardView onNavigate={(tab) => setSelectedTab(tab)} />;
    }
  };

  // Patient portal — a standalone surface at /portal (no staff login session).
  if (window.location.pathname.startsWith('/portal')) {
    return (
      <ConfigProvider
        direction={rtl ? 'rtl' : 'ltr'}
        locale={rtl ? arEG : enUS}
        theme={getAppTheme(primaryColor, rtl)}
      >
        <PatientPortal />
      </ConfigProvider>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ConfigProvider
        direction={rtl ? 'rtl' : 'ltr'}
        locale={rtl ? arEG : enUS}
        theme={getAppTheme(primaryColor, rtl)}
      >
        <LoginView
          clinicName={clinic?.name || lockedName || 'Entrustic Beauty'}
          clinicColor={primaryColor}
          clinicInitial={clinic?.name?.charAt(0) || 'C'}
          onLoggedIn={() => setSelectedTab('dashboard')}
        />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      direction={rtl ? 'rtl' : 'ltr'}
      locale={rtl ? arEG : enUS}
      theme={getAppTheme(primaryColor, rtl)}
    >
      <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        {/* Modern SaaS Header */}
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            width: '100%',
            height: 64,
            lineHeight: 'normal',
            padding: '0 24px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          {/* Left: Clinic Brand & Specialty Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 46 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 6px ${primaryColor}26`,
                overflow: 'hidden',
              }}
            >
              <img
                src="/brand/entrustic-logo.png"
                alt={clinic?.name || lockedName || 'Entrustic Beauty'}
                style={{ width: 34, height: 34, objectFit: 'contain', display: 'block' }}
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = 'none';
                  const parent = el.parentElement;
                  if (parent && !parent.dataset.fallback) {
                    parent.dataset.fallback = '1';
                    parent.style.background = primaryColor;
                    parent.style.color = '#FFFFFF';
                    parent.style.fontWeight = '700';
                    parent.style.fontSize = '18px';
                    parent.textContent = clinic?.name?.charAt(0) || 'E';
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div
                style={{
                  fontWeight: 700,
                  color: '#0F172A',
                  fontSize: 16,
                  lineHeight: '22px',
                  letterSpacing: '-0.01em',
                }}
              >
                {clinic?.name || lockedName || 'Entrustic Beauty'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, lineHeight: '18px' }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                  {CLINIC_TYPE_LABELS[clinic?.clinicType || SPECIALTY_LOCK || ClinicType.GENERAL_MEDICAL]}
                </span>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <Tag color="cyan" style={{ fontSize: 11, padding: '0 7px', margin: 0, lineHeight: '18px', borderRadius: 4, fontWeight: 600 }}>
                  {clinic?.currency || 'EGP'}
                </Tag>
              </div>
            </div>
          </div>

          {/* Center: Global Omni-Search Mock */}
          <div style={{ maxWidth: 360, width: '100%', display: 'none', minWidth: 220 }} className="desktop-search">
            <Input
              prefix={<Search size={15} color="#94A3B8" />}
              placeholder="Search patients, bookings, invoices... (Ctrl + K)"
              style={{ borderRadius: 8, height: 36, backgroundColor: '#F8FAFC' }}
            />
          </div>

          {/* Right: Language Toggle & User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Button
              type="text"
              icon={<Languages size={16} />}
              onClick={toggleLanguage}
              style={{ fontWeight: 500, color: '#475569', height: 36, paddingInline: 12 }}
            >
              {currentLanguage === 'en' ? 'العربية' : 'English'}
            </Button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '4px 10px 4px 6px',
                borderRadius: 24,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
              }}
            >
              <Avatar
                size={28}
                style={{ backgroundColor: primaryColor, color: '#FFF', fontWeight: 600, fontSize: 12 }}
              >
                {user?.firstName?.charAt(0) || 'D'}
              </Avatar>
              <div style={{ lineHeight: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                  {user ? `${user.firstName} ${user.lastName}` : (currentLanguage === 'ar' ? 'د. سارة الشريف' : 'Dr. Sara El-Sherif')}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {user?.roles?.[0] || (currentLanguage === 'ar' ? 'مدير المركز' : 'Clinic Admin')}
                </div>
              </div>
            </div>

            <Button
              type="text"
              danger
              icon={<LogOut size={16} />}
              onClick={() => {
                logout();
                message.info(currentLanguage === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
              }}
              style={{ fontWeight: 500, height: 36, display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
              title={currentLanguage === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
            >
              {currentLanguage === 'ar' ? 'خروج' : 'Logout'}
            </Button>
          </div>
        </Header>

        <Layout>
          {/* Clean Light Sidebar */}
          <Sider
            width={240}
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            style={{
              background: '#FFFFFF',
              borderInlineEnd: '1px solid #E2E8F0',
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedTab]}
              onClick={({ key }) => setSelectedTab(key)}
              items={menuItems}
              style={{
                borderInlineEnd: 'none',
                paddingTop: 16,
              }}
            />
          </Sider>

          {/* Main Content View Container */}
          <Layout style={{ background: '#F8FAFC', padding: '24px 32px' }}>
            <Content>{renderContent()}</Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
