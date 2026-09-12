import type { ReactNode } from 'react';
import {
    Activity,
    LayoutDashboard,
    Users,
    Settings,
    Building2,
    GitCompare,
} from 'lucide-react';
import PortalShell from './shared/PortalShell';

const NAV_ITEMS = [
    { key: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: '/admin/creators', icon: Users, label: 'Creators' },
    { key: '/admin/brands', icon: Building2, label: 'Brands' },
    { key: '/admin/compare', icon: GitCompare, label: 'Compare Profiles' },
    { key: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <PortalShell
            headerTitle="Admin Console"
            logoIcon={Activity}
            logoIconClassName="text-brand-blue"
            title="tapnlike"
            navItems={NAV_ITEMS}
        >
            {children}
        </PortalShell>
    );
}
