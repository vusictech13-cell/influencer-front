import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
    Bell,
    Building2,
    Clapperboard,
    FileText,
    LayoutGrid,
    List,
    PenLine,
    Search,
    Settings,
    TrendingUp,
    Upload,
    User,
    Wallet,
} from 'lucide-react';
import PortalShell from './shared/PortalShell';
import { OnboardingGate } from '@/components/auth/OnboardingGate';
import { getStoredUser } from '@/utils/auth';
import { useInstagramAccount } from '@/hooks/useSocialAccounts';
import { useCampaigns, useMySubmissions } from '@/hooks/useCampaigns';
import { useNavigate } from 'react-router-dom';
import CreatorInstagramAccounts from '@/components/creator/CreatorInstagramAccounts';

const NAV_ITEMS = [
    { key: '/creator/dashboard', icon: LayoutGrid, label: 'Home', section: 'Creator' },
    { key: '/creator/reel-studio', icon: Clapperboard, label: 'Reel Studio', section: 'Creator' },
    { key: '/creator/bulk-reels', icon: Upload, label: 'Bulk Reel Upload', section: 'Creator' },
    { key: '/creator/analytics', icon: TrendingUp, label: 'Analytics', section: 'Creator', aliases: ['/creator/insights'] },
    { key: '/creator/campaigns', icon: List, label: 'Campaigns', section: 'Creator' },
    { key: '/creator/brands', icon: Building2, label: 'Brands', section: 'Creator' },
    { key: '/creator/profile', icon: User, label: 'Profile', section: 'My profile' },
    { key: '/creator/payments', icon: Wallet, label: 'Earnings', section: 'My profile' },
    { key: '/creator/media-kit', icon: FileText, label: 'Media kit', section: 'My profile' },
    { key: '/creator/settings', icon: Settings, label: 'Settings', section: 'Account' },
];

function SidebarUpgrade() {
    const navigate = useNavigate();
    return (
        <div className="rounded-[15px] border border-[#dce8f0] bg-[#f4fbff] p-3.5">
            <strong className="text-xs">Make your profile stronger</strong>
            <p className="mt-1.5 mb-2.5 text-[10px] leading-relaxed text-[#8a8c94]">
                Add rates and a media kit to unlock higher-value campaign matches.
            </p>
            <button
                type="button"
                onClick={() => navigate('/creator/profile')}
                className="w-full rounded-full bg-brand-orange px-3 py-2 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(255,106,26,0.22)] hover:bg-[#f05a0c]"
            >
                Complete profile →
            </button>
        </div>
    );
}

function CreatorHeader() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const { instagram } = useInstagramAccount();
    const { data: campaigns } = useCampaigns();
    const { data: submissions } = useMySubmissions();
    const [query, setQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const notesRef = useRef<HTMLDivElement>(null);

    const avatar =
        instagram?.profile_image ||
        user?.profile_image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Creator')}&background=121318&color=fff`;

    const results = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return [];
        return (campaigns ?? [])
            .filter((campaign) =>
                [campaign.title, campaign.brand_name, campaign.genre, campaign.campaign_type]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(term)),
            )
            .slice(0, 6);
    }, [campaigns, query]);

    const appliedIds = useMemo(
        () => new Set(submissions?.map((item) => item.campaign_id) ?? []),
        [submissions],
    );
    const freshCount = (campaigns ?? []).filter((campaign) => !appliedIds.has(campaign.id)).length;
    const inProgress = submissions?.filter((item) => item.status === 'applied' || item.status === 'pending').length ?? 0;
    const noteCount = (freshCount > 0 ? 1 : 0) + (inProgress > 0 ? 1 : 0);

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!searchRef.current?.contains(target)) setSearchOpen(false);
            if (!notesRef.current?.contains(target)) setNotesOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    return (
        <div className="flex w-full items-center justify-between gap-4">
            <div ref={searchRef} className="relative hidden min-w-0 flex-1 sm:block">
                <div className="flex max-w-sm items-center gap-2 text-xs text-[#9a9ca4]">
                    <Search size={17} />
                    <input
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setSearchOpen(true);
                        }}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="Search brands or campaigns"
                        className="w-full bg-transparent text-[12px] text-brand-ink outline-none placeholder:text-[#9a9ca4]"
                    />
                </div>
                {searchOpen && query.trim() && (
                    <div className="absolute left-0 top-[calc(100%+10px)] z-30 w-[min(420px,70vw)] overflow-hidden rounded-2xl border border-[#dce8f0] bg-white shadow-[0_16px_40px_rgba(20,20,40,0.12)]">
                        {results.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-[#8a8c94]">No matching brands or campaigns.</p>
                        ) : (
                            results.map((campaign) => (
                                <button
                                    key={campaign.id}
                                    type="button"
                                    onClick={() => {
                                        setQuery('');
                                        setSearchOpen(false);
                                        navigate(`/creator/campaigns/${campaign.id}`);
                                    }}
                                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-[#f4fbff]"
                                >
                                    <span>
                                        <strong className="block text-xs text-brand-ink">{campaign.title}</strong>
                                        <span className="text-[10px] uppercase tracking-[0.8px] text-[#a0a2aa]">
                                            {campaign.brand_name || 'Brand'}
                                        </span>
                                    </span>
                                    <span className="text-[10px] font-bold text-brand-orange">View →</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
            <div className="ml-auto flex items-center gap-2.5">
                <div ref={notesRef} className="relative">
                    <button
                        type="button"
                        className="relative grid h-[37px] w-[37px] place-items-center rounded-[10px] border border-[#dce8f0] bg-white text-[#6f727b]"
                        onClick={() => setNotesOpen((open) => !open)}
                        aria-label="Notifications"
                    >
                        <Bell size={16} />
                        {noteCount > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-orange" />
                        )}
                    </button>
                    {notesOpen && (
                        <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-[280px] overflow-hidden rounded-2xl border border-[#dce8f0] bg-white shadow-[0_16px_40px_rgba(20,20,40,0.12)]">
                            {noteCount === 0 ? (
                                <p className="px-4 py-4 text-xs text-[#8a8c94]">You are all caught up.</p>
                            ) : (
                                <>
                                    {freshCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNotesOpen(false);
                                                navigate('/creator/dashboard');
                                            }}
                                            className="block w-full px-4 py-3 text-left hover:bg-[#f4fbff]"
                                        >
                                            <strong className="block text-xs">Fresh opportunities</strong>
                                            <span className="text-[10px] text-[#8a8c94]">
                                                {freshCount} campaign{freshCount === 1 ? '' : 's'} waiting for you today.
                                            </span>
                                        </button>
                                    )}
                                    {inProgress > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNotesOpen(false);
                                                navigate('/creator/campaigns');
                                            }}
                                            className="block w-full px-4 py-3 text-left hover:bg-[#f4fbff]"
                                        >
                                            <strong className="block text-xs">Campaign updates</strong>
                                            <span className="text-[10px] text-[#8a8c94]">
                                                {inProgress} collaboration{inProgress === 1 ? '' : 's'} still in progress.
                                            </span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="grid h-[37px] w-[37px] place-items-center rounded-[10px] border border-[#dce8f0] bg-white text-[#6f727b]"
                    onClick={() => navigate('/creator/profile')}
                    aria-label="Edit profile"
                >
                    <PenLine size={16} />
                </button>
                <button type="button" onClick={() => navigate('/creator/profile')} aria-label="Open profile">
                    <img
                        src={avatar}
                        alt=""
                        className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-[0_0_0_1px_#e9e9ef]"
                    />
                </button>
            </div>
        </div>
    );
}

export default function CreatorLayout({ children }: { children: ReactNode }) {
    return (
        <OnboardingGate>
            <PortalShell
                headerTitle="Home"
                headerLeft={<CreatorHeader />}
                logoIcon={LayoutGrid}
                title="tapnlike"
                navItems={NAV_ITEMS}
                afterNav={<CreatorInstagramAccounts />}
                sidebarFooter={<SidebarUpgrade />}
            >
                {children}
            </PortalShell>
        </OnboardingGate>
    );
}
