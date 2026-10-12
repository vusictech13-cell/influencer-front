import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminSession } from '@/utils/auth';
import { adminCan, useAdminMe, type AdminProfile } from '@/hooks/useAdminAccess';
import {
    Activity,
    KeyRound,
    LayoutDashboard,
    ScrollText,
    ShieldCheck,
    Users,
    UserCog,
    Languages,
    Building2,
    Banknote,
    Clapperboard,
    FileBarChart,
    GitCompare,
    LifeBuoy,
    Megaphone,
    Receipt,
    Wallet,
} from 'lucide-react';
import PortalShell from './shared/PortalShell';
import type { PortalNavItem } from './shared/PortalSidebar';

type AdminNavItem = PortalNavItem & {
    allow?: (admin: AdminProfile) => boolean;
};

const NAV_ITEMS: AdminNavItem[] = [
    { key: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'Workspace' },
    { key: '/admin/creators', icon: Users, label: 'Creators', section: 'Workspace', allow: (admin) => adminCan(admin, 'CREATOR_VIEW', 'CREATOR_EDIT', 'CREATOR_APPROVE', 'CREATOR_SUSPEND') },
    { key: '/admin/brands', icon: Building2, label: 'Brands', section: 'Workspace', allow: (admin) => adminCan(admin, 'BRAND_VIEW', 'BRAND_EDIT', 'BRAND_APPROVE', 'BRAND_SUSPEND') },
    { key: '/admin/compare', icon: GitCompare, label: 'Compare Profiles', section: 'Workspace', allow: (admin) => adminCan(admin, 'CREATOR_VIEW') },
    { key: '/admin/campaigns', icon: Megaphone, label: 'Campaigns', section: 'Workspace', allow: (admin) => adminCan(admin, 'CAMPAIGN_VIEW', 'CAMPAIGN_CREATE', 'CAMPAIGN_EDIT', 'CAMPAIGN_APPROVE', 'CAMPAIGN_REJECT', 'CAMPAIGN_DELETE') },
    { key: '/admin/payments', icon: Receipt, label: 'Payments', section: 'Workspace', allow: (admin) => adminCan(admin, 'PAYMENT_VIEW', 'PAYMENT_MANAGE') },
    { key: '/admin/payouts', icon: Banknote, label: 'Payouts', section: 'Workspace', allow: (admin) => adminCan(admin, 'PAYOUT_VIEW', 'PAYOUT_MANAGE') },
    { key: '/admin/wallets', icon: Wallet, label: 'Wallets', section: 'Workspace', allow: (admin) => adminCan(admin, 'WALLET_VIEW', 'WALLET_MANAGE') },
    { key: '/admin/content', icon: Clapperboard, label: 'Content', section: 'Workspace', allow: (admin) => adminCan(admin, 'CONTENT_VIEW', 'CONTENT_MANAGE') },
    { key: '/admin/reports', icon: FileBarChart, label: 'Reports', section: 'Workspace', allow: (admin) => adminCan(admin, 'REPORT_VIEW', 'REPORT_EXPORT') },
    { key: '/admin/support', icon: LifeBuoy, label: 'Support', section: 'Workspace', allow: (admin) => adminCan(admin, 'SUPPORT_VIEW', 'SUPPORT_MANAGE', 'SUPPORT_FAQ_EDIT', 'SUPPORT_FAQ_DELETE', 'SUPPORT_BOT_EDIT', 'SUPPORT_BOT_DELETE') },
    { key: '/admin/team', icon: UserCog, label: 'Team', section: 'Access', allow: (admin) => adminCan(admin, 'STAFF_VIEW', 'ADMIN_VIEW') },
    { key: '/admin/roles', icon: KeyRound, label: 'Roles', section: 'Access', allow: (admin) => adminCan(admin, 'ROLE_VIEW') },
    { key: '/admin/activity', icon: ScrollText, label: 'Activity', section: 'Access', allow: (admin) => adminCan(admin, 'ACTIVITY_VIEW', 'ACTIVITY_VIEW_USERS', 'ACTIVITY_VIEW_ADMINS') },
    { key: '/admin/security', icon: ShieldCheck, label: 'Security', section: 'Access' },
    { key: '/admin/profile-options', icon: Languages, label: 'Profile options', section: 'Catalog', allow: (admin) => adminCan(admin, 'SETTINGS_VIEW', 'SETTINGS_MANAGE') },
];

function consoleTitle(admin?: AdminProfile) {
    const roles = admin?.roles || [];
    if (admin?.is_super_admin || roles.some((role) => role.code === 'SUPER_ADMIN')) {
        return 'Super Admin Console';
    }
    const primary = roles.find((role) => role.code === 'ADMIN') || roles[0];
    return primary?.name ? `${primary.name} Console` : 'Admin Console';
}

function routeAllowed(pathname: string, admin: AdminProfile) {
    const match = NAV_ITEMS
        .filter((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))
        .sort((a, b) => b.key.length - a.key.length)[0];
    if (!match?.allow) return true;
    return match.allow(admin);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const me = useAdminMe();
    const location = useLocation();
    if (!isAdminSession()) {
        return <Navigate to="/admin" replace />;
    }

    const navItems = NAV_ITEMS.filter((item) => !item.allow || (me.data && item.allow(me.data)));
    if (me.data && !routeAllowed(location.pathname, me.data)) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return (
        <PortalShell
            headerTitle={consoleTitle(me.data)}
            logoIcon={Activity}
            logoIconClassName="text-brand-blue"
            title="tapnlike"
            navItems={navItems}
        >
            {children}
        </PortalShell>
    );
}
