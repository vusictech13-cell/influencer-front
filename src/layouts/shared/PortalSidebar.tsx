import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import Logo from '@/components/marketing/Logo';

export type PortalNavItem = {
    key: string;
    icon: LucideIcon;
    label: string;
    section?: string;
    aliases?: string[];
};

type PortalSidebarProps = {
    logoIcon: LucideIcon;
    logoIconClassName?: string;
    title: string;
    navItems: PortalNavItem[];
    activePath: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
    logoutLabel?: string;
    footer?: ReactNode;
    afterNav?: ReactNode;
    alwaysShow?: boolean;
};

function NavItem({
    icon: Icon,
    label,
    active,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-[11px] text-[13px] font-medium transition-all duration-200 ${
                active
                    ? 'bg-[#e8f8fe] font-bold text-brand-blue'
                    : 'text-brand-gray hover:bg-[#f4fbff] hover:text-brand-ink'
            }`}
        >
            <span className={active ? 'text-brand-blue' : 'text-brand-gray/70'}>
                <Icon size={18} />
            </span>
            {label}
        </button>
    );
}

function isNavActive(item: PortalNavItem, activePath: string) {
    if (activePath === item.key) return true;
    if (item.key !== '/' && activePath.startsWith(`${item.key}/`)) return true;
    return Boolean(item.aliases?.some((alias) => activePath === alias || activePath.startsWith(`${alias}/`)));
}

function groupNavItems(navItems: PortalNavItem[]) {
    if (!navItems.some((item) => item.section)) {
        return [{ title: null as string | null, items: navItems }];
    }

    return navItems.reduce<{ title: string | null; items: PortalNavItem[] }[]>((groups, item) => {
        const title = item.section ?? null;
        const last = groups[groups.length - 1];
        if (last && last.title === title) {
            last.items.push(item);
            return groups;
        }
        groups.push({ title, items: [item] });
        return groups;
    }, []);
}

export default function PortalSidebar({
    navItems,
    activePath,
    onNavigate,
    onLogout,
    logoutLabel = 'Log out',
    footer,
    afterNav,
    alwaysShow = false,
}: PortalSidebarProps) {
    const groups = groupNavItems(navItems);

    return (
        <nav
            className={`h-full max-h-full min-h-0 w-[238px] flex-shrink-0 flex-col overflow-hidden border-r border-[#dce8f0] bg-white ${
                alwaysShow ? 'flex' : 'hidden md:flex'
            }`}
        >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="px-4 pb-7 pt-6">
                    <Logo className="px-1 text-[1.2rem] text-brand-ink" />
                </div>
                <div className="px-3 pb-4">
                    {groups.map((group, index) => (
                        <div key={group.title || `nav-${index}`} className={index === 0 ? '' : 'mt-3'}>
                            {group.title && (
                                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[1.2px] text-brand-gray/70">
                                    {group.title}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <NavItem
                                        key={item.key}
                                        icon={item.icon}
                                        label={item.label}
                                        active={isNavActive(item, activePath)}
                                        onClick={() => onNavigate(item.key)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {afterNav}
            </div>
            <div className="flex-shrink-0 p-4">
                {footer}
                <button
                    type="button"
                    onClick={onLogout}
                    className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-brand-gray transition-colors hover:bg-[#fff1ea] hover:text-brand-orange"
                >
                    <LogOut size={14} /> {logoutLabel}
                </button>
            </div>
        </nav>
    );
}
