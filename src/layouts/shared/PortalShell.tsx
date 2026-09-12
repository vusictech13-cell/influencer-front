import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { logout } from '@/utils/auth';
import PortalSidebar, { type PortalNavItem } from './PortalSidebar';
import type { LucideIcon } from 'lucide-react';

type PortalShellProps = {
    children: ReactNode;
    headerTitle: string;
    logoIcon: LucideIcon;
    logoIconClassName?: string;
    title: string;
    navItems: PortalNavItem[];
    logoutLabel?: string;
    sidebarFooter?: ReactNode;
    afterNav?: ReactNode;
    headerActions?: ReactNode;
    headerLeft?: ReactNode;
};

export default function PortalShell({
    children,
    headerTitle,
    logoIcon,
    logoIconClassName,
    title,
    navItems,
    logoutLabel,
    sidebarFooter,
    afterNav,
    headerActions,
    headerLeft,
}: PortalShellProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => logout(navigate);
    const handleNavigate = (path: string) => {
        setMobileOpen(false);
        navigate(path);
    };

    return (
        <div className="flex h-screen min-h-0 w-full overflow-hidden bg-brand-lightbg font-jakarta text-brand-ink selection:bg-brand-blue/20">
            <PortalSidebar
                logoIcon={logoIcon}
                logoIconClassName={logoIconClassName}
                title={title}
                navItems={navItems}
                activePath={location.pathname}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                logoutLabel={logoutLabel}
                footer={sidebarFooter}
                afterNav={afterNav}
            />

            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        className="absolute inset-0 bg-brand-navy/30"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="relative h-full min-h-0 w-[238px] overflow-hidden shadow-xl">
                        <PortalSidebar
                            logoIcon={logoIcon}
                            logoIconClassName={logoIconClassName}
                            title={title}
                            navItems={navItems}
                            activePath={location.pathname}
                            onNavigate={handleNavigate}
                            onLogout={handleLogout}
                            logoutLabel={logoutLabel}
                            footer={sidebarFooter}
                            afterNav={afterNav}
                            alwaysShow
                        />
                    </div>
                </div>
            )}

            <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-[72px] flex-shrink-0 items-center justify-between gap-3 border-b border-[#dce8f0] bg-white px-4 md:px-8">
                    <button
                        type="button"
                        className="grid h-[37px] w-[37px] flex-none place-items-center rounded-[10px] border border-[#dce8f0] bg-white text-brand-gray md:hidden"
                        onClick={() => setMobileOpen((open) => !open)}
                        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    >
                        {mobileOpen ? <X size={16} /> : <Menu size={16} />}
                    </button>
                    {headerLeft || (
                        <h1 className="font-outfit text-sm font-semibold tracking-tight text-brand-ink">{headerTitle}</h1>
                    )}
                    {headerActions}
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:px-8 md:py-7">{children}</div>
            </main>
        </div>
    );
}
