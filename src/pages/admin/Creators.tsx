import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Select } from 'antd';
import { ArrowUpDown, ChevronRight, Instagram, Link2, Star, Users } from 'lucide-react';
import {
    useAdminCreators,
    type AdminCreatorConnectedFilter,
    type AdminCreatorSortField,
    type AdminCreatorStatusFilter,
    type AdminSortOrder,
} from '@/hooks/useAdminCreators';
import { formatCount, getVusicRank } from '@/utils/creator';
import { resolveAssetUrl } from '@/utils/image';
import { fieldClass, LoadingRow, PageHeader, Panel, StatusPill, TabButton, TabGroup } from './adminUi';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${accent}`}>{label}</p>
            <p className="text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
        </div>
    );
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function AdminCreators() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [status, setStatus] = useState<AdminCreatorStatusFilter>('all');
    const [connected, setConnected] = useState<AdminCreatorConnectedFilter>('all');
    const [sort, setSort] = useState<AdminCreatorSortField>('createdAt');
    const [order, setOrder] = useState<AdminSortOrder>('desc');

    const { data, isLoading, isFetching } = useAdminCreators({
        page,
        limit,
        search,
        status,
        connected,
        sort,
        order,
    });

    const creators = data?.creators ?? [];
    const meta = data?.meta;
    const summary = meta?.summary;
    const total = meta?.total ?? 0;

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const next = searchInput.trim();
            setSearch((current) => {
                if (current !== next) setPage(1);
                return next;
            });
        }, 300);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const hasFilters = search || status !== 'all' || connected !== 'all' || sort !== 'createdAt' || order !== 'desc';

    return (
        <div className="space-y-5">
            <PageHeader
                title="Creators"
                description="Registered creators, Instagram connections, and campaign activity."
                action={
                    <button
                        type="button"
                        onClick={() => navigate('/admin/compare')}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dce8f0] bg-white px-4 text-sm font-bold text-brand-ink"
                    >
                        Compare profiles
                    </button>
                }
            />

            {summary && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <SummaryCard label="Total creators" value={summary.total} accent="text-gray-500" />
                    <SummaryCard label="Instagram connected" value={summary.connected} accent="text-emerald-500" />
                    <SummaryCard label="Active accounts" value={summary.active} accent="text-[#00B4EB]" />
                    <SummaryCard label="Inactive accounts" value={summary.inactive} accent="text-amber-500" />
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <TabGroup>
                    {(['all', 'active', 'inactive'] as const).map((key) => (
                        <TabButton key={key} active={status === key} onClick={() => { setStatus(key); setPage(1); }}>
                            {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Inactive'}
                        </TabButton>
                    ))}
                </TabGroup>
                <TabGroup>
                    {([
                        ['all', 'Any Instagram'],
                        ['connected', 'Connected'],
                        ['not_connected', 'Not connected'],
                    ] as const).map(([key, label]) => (
                        <TabButton key={key} active={connected === key} onClick={() => { setConnected(key); setPage(1); }}>
                            {label}
                        </TabButton>
                    ))}
                </TabGroup>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search name or email"
                    className={`${fieldClass} lg:max-w-sm`}
                />
                <Select
                    value={`${sort}-${order}`}
                    onChange={(val) => {
                        const [nextSort, nextOrder] = val.split('-') as [AdminCreatorSortField, AdminSortOrder];
                        setSort(nextSort);
                        setOrder(nextOrder);
                        setPage(1);
                    }}
                    className="h-11 min-w-[180px]"
                    options={[
                        { value: 'createdAt-desc', label: 'Newest first' },
                        { value: 'createdAt-asc', label: 'Oldest first' },
                        { value: 'name-asc', label: 'Name A–Z' },
                        { value: 'followers-desc', label: 'Most followers' },
                        { value: 'points-desc', label: 'Most points' },
                    ]}
                    suffixIcon={<ArrowUpDown size={14} className="text-brand-gray" />}
                />
                <Select
                    value={limit}
                    onChange={(val) => {
                        setLimit(val);
                        setPage(1);
                    }}
                    className="h-11 min-w-[110px]"
                    options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
                />
                {hasFilters && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchInput('');
                            setSearch('');
                            setStatus('all');
                            setConnected('all');
                            setSort('createdAt');
                            setOrder('desc');
                            setPage(1);
                        }}
                        className="text-sm font-bold text-brand-gray hover:text-brand-ink"
                    >
                        Clear
                    </button>
                )}
            </div>

            <Panel>
                {isLoading ? <LoadingRow /> : (
                    <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Creator</th>
                                    <th className="px-4 py-3 font-bold">Instagram</th>
                                    <th className="px-4 py-3 font-bold">Followers</th>
                                    <th className="px-4 py-3 font-bold">Rank</th>
                                    <th className="px-4 py-3 font-bold">Submissions</th>
                                    <th className="px-4 py-3 font-bold">Points</th>
                                    <th className="px-4 py-3 font-bold">Status</th>
                                    <th className="px-4 py-3 font-bold">Joined</th>
                                    <th className="px-4 py-3 font-bold">
                                        <span className="sr-only">View details</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {creators.map((creator) => {
                                    const avatarUrl = resolveAssetUrl(creator.instagram?.profile_image || creator.profile_image);
                                    const followers = creator.instagram_followers || creator.instagram?.followers_count || 0;
                                    const rankLabel = creator.rank?.level || getVusicRank(followers).label;
                                    return (
                                        <tr
                                            key={creator.id}
                                            className="cursor-pointer border-b border-gray-50 hover:bg-[#f8fafb]"
                                            onClick={() => navigate(`/admin/creators/${creator.id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt="" className="h-9 w-9 flex-none rounded-full object-cover" />
                                                    ) : (
                                                        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#fff4ec] text-brand-orange">
                                                            <Users size={15} />
                                                        </span>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-brand-ink">{creator.name}</p>
                                                        <p className="truncate text-xs text-brand-gray">{creator.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {creator.instagram ? (
                                                    <span className="inline-flex items-center gap-1.5 text-brand-ink">
                                                        <Instagram size={14} className="text-[#E1306C]" />
                                                        @{creator.instagram.username}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-brand-gray">
                                                        <Link2 size={12} /> Not connected
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-brand-ink">
                                                {followers > 0 ? formatCount(followers) : '—'}
                                                {creator.instagram?.engagement_rate ? (
                                                    <span className="mt-0.5 block text-[11px] font-medium text-brand-gray">
                                                        {creator.instagram.engagement_rate.toFixed(1)}% ER
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink">
                                                    <Star size={12} className="text-amber-400" />
                                                    {rankLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-brand-ink">
                                                {creator.submissions_total > 0
                                                    ? `${creator.submissions_approved} approved / ${creator.submissions_total}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-brand-ink">{creator.total_points.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <StatusPill status={creator.status} label={creator.status === 'active' ? 'Active' : 'Inactive'} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-brand-gray">{formatDate(creator.createdAt)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    aria-label={`View ${creator.name}`}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        navigate(`/admin/creators/${creator.id}`);
                                                    }}
                                                    className="inline-grid h-8 w-8 place-items-center rounded-full text-brand-gray hover:bg-white hover:text-brand-ink"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!creators.length && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-sm text-brand-gray">
                                            {hasFilters ? 'No creators match these filters.' : 'No creators yet.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {total > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-brand-gray">
                        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} creators
                    </p>
                    <Pagination
                        current={page}
                        pageSize={limit}
                        total={total}
                        onChange={(nextPage) => setPage(nextPage)}
                        showSizeChanger={false}
                    />
                </div>
            )}
        </div>
    );
}
