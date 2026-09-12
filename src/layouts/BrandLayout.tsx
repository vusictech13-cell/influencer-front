import type { ReactNode } from 'react';
import {
    Building2,
    LayoutDashboard,
    Megaphone,
    Users,
    LineChart,
    Wallet,
} from 'lucide-react';
import PortalShell from './shared/PortalShell';

const NAV_ITEMS = [
    { key: '/brand/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { key: '/brand/campaigns', icon: Megaphone, label: 'Campaigns' },
    { key: '/brand/wallet', icon: Wallet, label: 'Wallet' },
    { key: '/brand/creators', icon: Users, label: 'Creators' },
    { key: '/brand/analytics', icon: LineChart, label: 'Analytics' },
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
        >
            {children}
        </PortalShell>
    );
}
