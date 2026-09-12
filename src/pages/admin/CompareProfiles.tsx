import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Check,
    GitCompare,
    Instagram,
    Loader2,
    Plus,
    Search,
    Star,
    Users,
    X,
} from 'lucide-react';
import {
    useAdminCreatorCompare,
    useAdminCreators,
    type AdminCompareProfile,
} from '@/hooks/useAdminCreators';
import { formatCount, getVusicRank } from '@/utils/creator';
import { resolveAssetUrl } from '@/utils/image';

const MAX_PROFILES = 4;

function parseIds(raw: string | null): number[] {
    if (!raw) return [];
    const ids: number[] = [];
    const seen = new Set<number>();
    for (const part of raw.split(',')) {
        const id = parseInt(part, 10);
        if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
        if (ids.length >= MAX_PROFILES) break;
    }
    return ids;
}

function useDebouncedValue<T>(value: T, delay: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

function formatStat(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    const n = Number(value);
    if (n >= 1_000_000) {
        const v = n / 1_000_000;
        return `${v.toFixed(v >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')}M`;
    }
    if (n >= 1_000) {
        const v = n / 1_000;
        if (v >= 100) return `${Math.round(v)}K`;
        return `${v.toFixed(v >= 10 ? 0 : 1).replace(/\.0$/, '')}K`;
    }
    return n.toLocaleString();
}

function formatPct(value?: number | null, digits = 1) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Number(value).toFixed(digits)}%`;
}

function formatAccountType(type?: string | null) {
    if (!type) return '—';
    const normalized = type.toLowerCase();
    if (normalized.includes('business')) return 'Business';
    if (normalized.includes('creator') || normalized.includes('media')) return 'Creator';
    if (normalized.includes('personal')) return 'Personal';
    return type;
}

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function scoreValue(profile: AdminCompareProfile, key: string): number | null {
    const match = profile.creator_score?.breakdown?.find((row) => row.key === key);
    return match?.score ?? null;
}

type CompareKind = 'number' | 'percent' | 'text';

type CompareRow = {
    key: string;
    label: string;
    kind: CompareKind;
    digits?: number;
    higherIsBetter?: boolean;
    get: (profile: AdminCompareProfile) => number | string | null;
};

type CompareSection = {
    title: string;
    rows: CompareRow[];
};

const COMPARE_SECTIONS: CompareSection[] = [
    {
        title: 'Profile',
        rows: [
            {
                key: 'followers',
                label: 'Followers',
                kind: 'number',
                get: (p) => p.instagram?.followers_count ?? null,
            },
            {
                key: 'following',
                label: 'Following',
                kind: 'number',
                higherIsBetter: false,
                get: (p) => p.instagram?.following_count ?? null,
            },
            {
                key: 'posts',
                label: 'Posts',
                kind: 'number',
                get: (p) => p.instagram?.total_posts ?? null,
            },
            {
                key: 'account_type',
                label: 'Account type',
                kind: 'text',
                get: (p) => formatAccountType(p.instagram?.account_type),
            },
            {
                key: 'rank',
                label: 'Audience rank',
                kind: 'text',
                get: (p) => p.rank?.level || getVusicRank(p.instagram?.followers_count || 0).label,
            },
        ],
    },
    {
        title: 'Creator Score',
        rows: [
            {
                key: 'overall',
                label: 'Overall score',
                kind: 'number',
                get: (p) => p.creator_score?.overall ?? null,
            },
            {
                key: 'rising',
                label: 'Rising score',
                kind: 'number',
                get: (p) => p.creator_score?.rising_score ?? null,
            },
            {
                key: 'percentile',
                label: 'Percentile',
                kind: 'text',
                get: (p) => p.creator_score?.percentile_label || null,
            },
            {
                key: 'reach_power',
                label: 'Reach Power',
                kind: 'number',
                get: (p) => scoreValue(p, 'reach'),
            },
            {
                key: 'engagement_quality',
                label: 'Engagement Quality',
                kind: 'number',
                get: (p) => scoreValue(p, 'engagement'),
            },
            {
                key: 'content',
                label: 'Content Performance',
                kind: 'number',
                get: (p) => scoreValue(p, 'content'),
            },
            {
                key: 'audience_scale',
                label: 'Audience Scale',
                kind: 'number',
                get: (p) => scoreValue(p, 'audience'),
            },
            {
                key: 'consistency_score',
                label: 'Consistency',
                kind: 'number',
                get: (p) => scoreValue(p, 'consistency'),
            },
        ],
    },
    {
        title: 'Audience performance',
        rows: [
            {
                key: 'avg_reach',
                label: 'Average reach',
                kind: 'number',
                get: (p) => p.creator_score?.audience?.avg_reach ?? null,
            },
            {
                key: 'er',
                label: 'Engagement rate',
                kind: 'percent',
                get: (p) => p.creator_score?.audience?.engagement_rate ?? p.instagram?.engagement_rate ?? null,
            },
            {
                key: 'avg_views',
                label: 'Avg reel views',
                kind: 'number',
                get: (p) => p.creator_score?.audience?.avg_reel_views ?? null,
            },
            {
                key: 'non_follower',
                label: 'Non-follower reach',
                kind: 'percent',
                digits: 0,
                get: (p) => p.creator_score?.audience?.non_follower_reach_pct ?? null,
            },
        ],
    },
    {
        title: 'Engagement quality',
        rows: [
            {
                key: 'like_rate',
                label: 'Like rate',
                kind: 'percent',
                get: (p) => p.creator_score?.engagement?.like_rate ?? null,
            },
            {
                key: 'comment_rate',
                label: 'Comment rate',
                kind: 'percent',
                digits: 2,
                get: (p) => p.creator_score?.engagement?.comment_rate ?? null,
            },
            {
                key: 'save_rate',
                label: 'Save rate',
                kind: 'percent',
                get: (p) => p.creator_score?.engagement?.save_rate ?? null,
            },
            {
                key: 'share_rate',
                label: 'Share rate',
                kind: 'percent',
                digits: 2,
                get: (p) => p.creator_score?.engagement?.share_rate ?? null,
            },
        ],
    },
    {
        title: 'Consistency',
        rows: [
            {
                key: 'median_views',
                label: 'Median reel views',
                kind: 'number',
                get: (p) => p.creator_score?.consistency?.median_reel_views ?? null,
            },
            {
                key: 'above_baseline',
                label: 'Content above baseline',
                kind: 'percent',
                digits: 0,
                get: (p) => p.creator_score?.consistency?.above_baseline_pct ?? null,
            },
            {
                key: 'growth',
                label: '30 day growth',
                kind: 'percent',
                digits: 0,
                get: (p) => p.creator_score?.consistency?.growth_30d_pct ?? null,
            },
            {
                key: 'posts_week',
                label: 'Posts per week',
                kind: 'number',
                get: (p) => p.creator_score?.consistency?.posts_per_week ?? null,
            },
        ],
    },
    {
        title: 'Platform',
        rows: [
            {
                key: 'points',
                label: 'Total points',
                kind: 'number',
                get: (p) => p.total_points,
            },
            {
                key: 'submissions',
                label: 'Submissions',
                kind: 'number',
                get: (p) => p.submissions_total,
            },
            {
                key: 'approved',
                label: 'Approved',
                kind: 'number',
                get: (p) => p.submissions_approved,
            },
        ],
    },
];

function formatCell(row: CompareRow, value: number | string | null) {
    if (value == null || value === '') return '—';
    if (row.kind === 'text') return String(value);
    const n = Number(value);
    if (Number.isNaN(n)) return '—';
    if (row.kind === 'percent') return formatPct(n, row.digits ?? 1);
    if (n >= 1000) return formatStat(n);
    if (Number.isInteger(n)) return n.toLocaleString();
    return n.toFixed(row.digits ?? 1);
}

function bestIndexes(row: CompareRow, profiles: AdminCompareProfile[]) {
    if (row.kind === 'text' || row.higherIsBetter === false) return new Set<number>();
    const numeric = profiles.map((profile, index) => {
        const raw = row.get(profile);
        const n = typeof raw === 'number' ? raw : Number(raw);
        return { index, n: Number.isFinite(n) ? n : null };
    });
    const values = numeric.map((item) => item.n).filter((n): n is number => n != null);
    if (values.length < 2) return new Set<number>();
    const best = Math.max(...values);
    if (values.every((n) => n === best)) return new Set<number>();
    return new Set(numeric.filter((item) => item.n === best).map((item) => item.index));
}

function CreatorSearchPanel({
    excludeIds,
    onSelect,
    alignEnd,
}: {
    excludeIds: number[];
    onSelect: (id: number) => void;
    alignEnd?: boolean;
}) {
    const [query, setQuery] = useState('');
    const debounced = useDebouncedValue(query, 250);
    const inputRef = useRef<HTMLInputElement>(null);
    const { data, isLoading } = useAdminCreators({
        page: 1,
        limit: 8,
        search: debounced,
        connected: 'connected',
        sort: 'followers',
        order: 'desc',
    });

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const creators = (data?.creators ?? []).filter((creator) => !excludeIds.includes(creator.id));

    return (
        <div
            className={`absolute top-[calc(100%+8px)] z-40 w-full min-w-[260px] bg-white border border-gray-200 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden ${
                alignEnd ? 'right-0' : 'left-0'
            }`}
        >
            <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <Search size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search name, email, or @username"
                        className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-[#00B4EB]" />
                    </div>
                ) : creators.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-500">
                        No Instagram-connected creators found.
                    </p>
                ) : (
                    creators.map((creator) => {
                        const avatarUrl = resolveAssetUrl(
                            creator.instagram?.profile_image || creator.profile_image,
                        );
                        const followers = creator.instagram_followers || creator.instagram?.followers_count || 0;
                        return (
                            <button
                                key={creator.id}
                                type="button"
                                onClick={() => onSelect(creator.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt=""
                                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-[#00B4EB]/20 flex items-center justify-center flex-shrink-0">
                                        <Users size={14} className="text-[#00B4EB]" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{creator.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {creator.instagram ? `@${creator.instagram.username}` : creator.email}
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-gray-500">
                                    {followers > 0 ? formatCount(followers) : '—'}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function ProfileSlot({
    profile,
    loading,
    open,
    excludeIds,
    alignEnd,
    onOpen,
    onClose,
    onSelect,
    onClear,
}: {
    profile?: AdminCompareProfile;
    loading?: boolean;
    open: boolean;
    excludeIds: number[];
    alignEnd?: boolean;
    onOpen: () => void;
    onClose: () => void;
    onSelect: (id: number) => void;
    onClear: () => void;
}) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointer = (event: MouseEvent) => {
            if (!panelRef.current?.contains(event.target as Node)) onClose();
        };
        document.addEventListener('mousedown', onPointer);
        return () => document.removeEventListener('mousedown', onPointer);
    }, [open, onClose]);

    if (loading && !profile) {
        return (
            <div className="min-h-[196px] rounded-2xl border border-gray-100 bg-white p-5 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div ref={panelRef} className="relative">
                <button
                    type="button"
                    onClick={open ? onClose : onOpen}
                    className="w-full min-h-[196px] rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-[#00B4EB] hover:bg-[#00B4EB]/5 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500"
                >
                    <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        <Plus size={18} />
                    </span>
                    <span className="text-sm font-semibold">Select creator</span>
                    <span className="text-xs text-gray-400">Instagram connected</span>
                </button>
                {open ? (
                    <CreatorSearchPanel excludeIds={excludeIds} onSelect={onSelect} alignEnd={alignEnd} />
                ) : null}
            </div>
        );
    }

    const displayName = profile.instagram?.display_name || profile.name;
    const username = profile.instagram?.username;
    const avatarUrl = resolveAssetUrl(
        profile.instagram?.profile_image || profile.profile_image,
    );
    const score = profile.creator_score?.overall;

    return (
        <div ref={panelRef} className="relative">
            <div className="min-h-[196px] rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
                <button
                    type="button"
                    onClick={onClear}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center"
                    aria-label={`Remove ${displayName}`}
                >
                    <X size={14} />
                </button>
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-[#00B4EB]/20 flex items-center justify-center mx-auto mb-3 text-sm font-bold text-[#00B4EB]">
                        {initials(displayName) || 'C'}
                    </div>
                )}
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                    {username ? `@${username}` : profile.email}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                        <Users size={12} />
                        {formatStat(profile.instagram?.followers_count)}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                        <Star size={12} className="text-amber-400" />
                        {score ?? '—'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={open ? onClose : onOpen}
                    className="mt-3 text-xs font-semibold text-[#00B4EB] hover:underline"
                >
                    Change
                </button>
            </div>
            {open ? <CreatorSearchPanel excludeIds={excludeIds} onSelect={onSelect} alignEnd={alignEnd} /> : null}
        </div>
    );
}

export default function AdminCompareProfiles() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const ids = useMemo(() => parseIds(searchParams.get('ids')), [searchParams]);
    const slotCount = Math.min(MAX_PROFILES, Math.max(2, ids.length + (ids.length < MAX_PROFILES ? 1 : 0)));
    const [openSlot, setOpenSlot] = useState<number | null>(null);
    const { data: profiles, isLoading, isFetching } = useAdminCreatorCompare(ids);

    const profileById = useMemo(() => {
        const map = new Map<number, AdminCompareProfile>();
        (profiles ?? []).forEach((profile) => map.set(profile.id, profile));
        return map;
    }, [profiles]);

    const selected = ids.map((id) => profileById.get(id)).filter(Boolean) as AdminCompareProfile[];

    const writeIds = (next: number[]) => {
        const unique = parseIds(next.join(','));
        if (unique.length) setSearchParams({ ids: unique.join(',') });
        else setSearchParams({});
        setOpenSlot(null);
    };

    const setSlot = (index: number, id: number) => {
        const next = [...ids];
        if (index < next.length) next[index] = id;
        else next.push(id);
        writeIds(next);
    };

    const clearSlot = (index: number) => {
        writeIds(ids.filter((_, i) => i !== index));
    };

    const winners = useMemo(() => {
        const counts = selected.map(() => 0);
        COMPARE_SECTIONS.forEach((section) => {
            section.rows.forEach((row) => {
                bestIndexes(row, selected).forEach((index) => {
                    counts[index] += 1;
                });
            });
        });
        const max = Math.max(0, ...counts);
        if (max === 0 || counts.filter((n) => n === max).length === counts.length) return new Set<number>();
        return new Set(counts.map((n, i) => (n === max ? i : -1)).filter((i) => i >= 0));
    }, [selected]);

    return (
        <div className="max-w-[1400px] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                    <GitCompare size={24} className="text-[#00B4EB]" />
                    Compare Profiles
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Select 2–4 Instagram-connected creators and compare scores, reach, and engagement side by side.
                </p>
            </div>

            <div
                className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${
                    slotCount >= 4 ? 'xl:grid-cols-4' : slotCount === 3 ? 'xl:grid-cols-3' : ''
                }`}
            >
                {Array.from({ length: slotCount }, (_, index) => {
                    const id = ids[index];
                    const profile = id ? profileById.get(id) : undefined;
                    return (
                        <ProfileSlot
                            key={id ? `filled-${id}` : `empty-${index}`}
                            profile={profile}
                            loading={Boolean(id) && isLoading}
                            open={openSlot === index}
                            excludeIds={ids}
                            alignEnd={index === slotCount - 1 && slotCount > 2}
                            onOpen={() => setOpenSlot(index)}
                            onClose={() => setOpenSlot(null)}
                            onSelect={(nextId) => setSlot(index, nextId)}
                            onClear={() => clearSlot(index)}
                        />
                    );
                })}
            </div>

            {ids.length < 2 ? (
                <div className="bg-white rounded-[1.5rem] border border-gray-100 py-16 text-center">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <GitCompare size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Pick at least two creators</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Search connected Instagram accounts above to start a comparison.
                    </p>
                </div>
            ) : (
                <div className={`bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden ${isFetching ? 'opacity-80' : ''}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="sticky left-0 z-20 bg-white w-[180px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        Specs
                                    </th>
                                    {selected.map((profile, index) => {
                                        const displayName = profile.instagram?.display_name || profile.name;
                                        const username = profile.instagram?.username;
                                        const avatarUrl = resolveAssetUrl(
                                            profile.instagram?.profile_image || profile.profile_image,
                                        );
                                        return (
                                            <th key={profile.id} className="px-4 py-4 min-w-[180px] bg-white">
                                                <div className="flex items-center gap-3">
                                                    {avatarUrl ? (
                                                        <img
                                                            src={avatarUrl}
                                                            alt=""
                                                            className="w-9 h-9 rounded-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-[#00B4EB]/20 flex items-center justify-center text-[10px] font-bold text-[#00B4EB]">
                                                            {initials(displayName)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 text-left">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                {displayName}
                                                            </p>
                                                            {winners.has(index) ? (
                                                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                                    Lead
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 truncate">
                                                            {username ? `@${username}` : profile.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARE_SECTIONS.map((section) => (
                                    <CompareSectionRows
                                        key={section.title}
                                        section={section}
                                        profiles={selected}
                                        onOpenProfile={(id) => navigate(`/admin/creators/${id}`)}
                                    />
                                ))}
                                <tr className="border-t border-gray-100">
                                    <td className="sticky left-0 bg-white px-5 py-4 text-xs font-semibold text-gray-400">
                                        Profile
                                    </td>
                                    {selected.map((profile) => (
                                        <td key={profile.id} className="px-4 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/admin/creators/${profile.id}`)}
                                                    className="text-xs font-semibold text-[#00B4EB] hover:underline"
                                                >
                                                    View profile
                                                </button>
                                                {profile.instagram?.username ? (
                                                    <a
                                                        href={`https://instagram.com/${profile.instagram.username}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#E1306C]"
                                                    >
                                                        <Instagram size={12} />
                                                        Instagram
                                                    </a>
                                                ) : null}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="px-5 py-3 text-[11px] text-gray-400 border-t border-gray-100">
                        Best values are highlighted in green. Scores use the latest stored Creator Score, not a live Instagram sync.
                    </p>
                </div>
            )}
        </div>
    );
}

function CompareSectionRows({
    section,
    profiles,
    onOpenProfile,
}: {
    section: CompareSection;
    profiles: AdminCompareProfile[];
    onOpenProfile: (id: number) => void;
}) {
    return (
        <>
            <tr className="bg-gray-50/90">
                <td
                    className="sticky left-0 z-10 bg-gray-50/90 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                    colSpan={profiles.length + 1}
                >
                    {section.title}
                </td>
            </tr>
            {section.rows.map((row, rowIndex) => {
                const winners = bestIndexes(row, profiles);
                return (
                    <tr key={row.key} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                        <td className="sticky left-0 z-10 bg-inherit px-5 py-3 text-sm text-gray-600 border-r border-gray-50">
                            {row.label}
                        </td>
                        {profiles.map((profile, index) => {
                            const value = row.get(profile);
                            const isBest = winners.has(index);
                            const clickable = row.key === 'overall';
                            const content = (
                                <span className="inline-flex items-center gap-1">
                                    {formatCell(row, value)}
                                    {isBest ? <Check size={12} className="text-emerald-500" /> : null}
                                </span>
                            );
                            return (
                                <td
                                    key={`${profile.id}-${row.key}`}
                                    className={`px-4 py-3 text-sm ${
                                        isBest
                                            ? 'text-emerald-700 font-semibold bg-emerald-50/70'
                                            : 'text-gray-900 font-medium'
                                    }`}
                                >
                                    {clickable ? (
                                        <button
                                            type="button"
                                            onClick={() => onOpenProfile(profile.id)}
                                            className="hover:underline"
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        content
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                );
            })}
        </>
    );
}
