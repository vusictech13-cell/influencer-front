import type { ReactNode } from 'react';
import {
    Building2,
    LayoutDashboard,
    Megaphone,
    Users,
    LineChart,
    ScrollText,
    Wallet,
} from 'lucide-react';
import PortalShell from './shared/PortalShell';
import ImpersonationBanner from '@/components/auth/ImpersonationBanner';

const NAV_ITEMS = [
    { key: '/brand/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { key: '/brand/campaigns', icon: Megaphone, label: 'Campaigns' },
    { key: '/brand/wallet', icon: Wallet, label: 'Wallet' },
    { key: '/brand/creators', icon: Users, label: 'Creators' },
    { key: '/brand/analytics', icon: LineChart, label: 'Analytics' },
    { key: '/brand/activity', icon: ScrollText, label: 'Activity' },
];

export default function BrandLayout({ children }: { children: ReactNode }) {
    return (
        <PortalShell
            headerTitle="Campaign Manager"
            logoIcon={Building2}
            logoIconClassName="text-brand-orange"
            title="tapnlike"
            navItems={NAV_ITEMS}
            logoutLabel="Exit Portal"
            banner={<ImpersonationBanner />}
        >
            {children}
        </PortalShell>
    );
}
