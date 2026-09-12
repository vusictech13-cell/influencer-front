import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Pagination, Select } from 'antd';
import {
    ArrowUpDown,
    ChevronRight,
    Instagram,
    Link2,
    Loader2,
    Search,
    Star,
    Users,
} from 'lucide-react';
import {
    useAdminCreators,
    type AdminCreatorConnectedFilter,
    type AdminCreatorSortField,
    type AdminCreatorStatusFilter,
    type AdminSortOrder,
} from '@/hooks/useAdminCreators';
import { formatCount, getVusicRank } from '@/utils/creator';
import { resolveAssetUrl } from '@/utils/image';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const STATUS_TABS: { key: AdminCreatorStatusFilter; label: string; activeClass: string }[] = [
    { key: 'all', label: 'All', activeClass: 'bg-gray-900 text-white border-gray-900' },
    { key: 'active', label: 'Active', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
    { key: 'inactive', label: 'Inactive', activeClass: 'bg-gray-500 text-white border-gray-500' },
];

const CONNECTED_TABS: { key: AdminCreatorConnectedFilter; label: string; activeClass: string }[] = [
    { key: 'all', label: 'All', activeClass: 'bg-[#00B4EB] text-white border-[#00B4EB]' },
    { key: 'connected', label: 'Connected', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
    { key: 'not_connected', label: 'Not connected', activeClass: 'bg-amber-500 text-white border-amber-500' },
];

function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
    const isActive = status === 'active';
    return (
        <span
            className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                isActive
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-gray-50 text-gray-500 border-gray-100'
            }`}
        >
            {status}
        </span>
    );
}

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${accent}`}>{label}</p>
            <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
        </div>
    );
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

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const clearFilters = () => {
        setSearchInput('');
        setSearch('');
        setStatus('all');
        setConnected('all');
        setSort('createdAt');
        setOrder('desc');
        setPage(1);
    };

    const hasFilters =
        search || status !== 'all' || connected !== 'all' || sort !== 'createdAt' || order !== 'desc';

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                    <Users size={24} className="text-[#00B4EB]" />
                    Creators
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Platform-wide view of registered creators, Instagram connections, and campaign activity.
                </p>
            </div>
            <button
                type="button"
                onClick={() => navigate('/admin/compare')}
                className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold rounded-xl hover:border-[#00B4EB] hover:text-[#00B4EB] transition-colors"
            >
                Compare profiles
            </button>
            </div>

            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard label="Total creators" value={summary.total} accent="text-gray-500" />
                    <SummaryCard label="Instagram connected" value={summary.connected} accent="text-emerald-500" />
                    <SummaryCard label="Active accounts" value={summary.active} accent="text-[#00B4EB]" />
                    <SummaryCard label="Inactive accounts" value={summary.inactive} accent="text-amber-500" />
                </div>
            )}

            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 border-b border-gray-100 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <Input
                            prefix={<Search size={14} className="text-gray-400" />}
                            placeholder="Search by name or email"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onPressEnter={handleSearch}
                            className="!rounded-xl !border-gray-200 max-w-md"
                            allowClear
                            onClear={() => {
                                setSearchInput('');
                                setSearch('');
                                setPage(1);
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Search
                        </button>
                    </div>

                    <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                        <div className="flex flex-wrap gap-2">
                            {STATUS_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                        setStatus(tab.key);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                        status === tab.key
                                            ? tab.activeClass
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {CONNECTED_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                        setConnected(tab.key);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                        connected === tab.key
                                            ? tab.activeClass
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
                            <Select
                                value={`${sort}-${order}`}
                                onChange={(val) => {
                                    const [s, o] = val.split('-') as [AdminCreatorSortField, AdminSortOrder];
                                    setSort(s);
                                    setOrder(o);
                                    setPage(1);
                                }}
                                className="min-w-[180px]"
                                options={[
                                    { value: 'createdAt-desc', label: 'Newest first' },
                                    { value: 'createdAt-asc', label: 'Oldest first' },
                                    { value: 'name-asc', label: 'Name A–Z' },
                                    { value: 'followers-desc', label: 'Most followers' },
                                    { value: 'points-desc', label: 'Most points' },
                                ]}
                                suffixIcon={<ArrowUpDown size={14} className="text-gray-400" />}
                            />

                            <Select
                                value={limit}
                                onChange={(val) => {
                                    setLimit(val);
                                    setPage(1);
                                }}
                                className="min-w-[110px]"
                                options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
                            />

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="text-xs font-semibold text-[#00B4EB] hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-[#00B4EB]" />
                    </div>
                ) : creators.length === 0 ? (
                    <div className="py-16 text-center px-6">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No creators found</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {hasFilters ? 'Try adjusting your filters.' : 'Creators will appear here once they register.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
                            <table className="w-full min-w-[960px]">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
                                            Creator
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Instagram
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Followers
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Rank
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Submissions
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Points
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Status
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Joined
                                        </th>
                                        <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {creators.map((creator) => {
                                        const avatarUrl = resolveAssetUrl(
                                            creator.instagram?.profile_image || creator.profile_image,
                                        );
                                        const followers = creator.instagram_followers || creator.instagram?.followers_count || 0;
                                        const vusicRank = getVusicRank(followers);
                                        const rankLabel = creator.rank?.level || vusicRank.label;

                                        return (
                                            <tr
                                                key={creator.id}
                                                onClick={() => navigate(`/admin/creators/${creator.id}`)}
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {avatarUrl ? (
                                                            <img
                                                                src={avatarUrl}
                                                                alt={creator.name}
                                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-[#00B4EB]/20 flex items-center justify-center flex-shrink-0">
                                                                <Users size={16} className="text-[#00B4EB]" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#00B4EB] transition-colors">
                                                                {creator.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">{creator.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {creator.instagram ? (
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                            <Instagram size={14} className="text-[#E1306C] flex-shrink-0" />
                                                            <span className="truncate">@{creator.instagram.username}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Link2 size={12} /> Not connected
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {followers > 0 ? formatCount(followers) : '—'}
                                                    </p>
                                                    {creator.instagram?.engagement_rate ? (
                                                        <p className="text-[10px] text-gray-400">
                                                            {creator.instagram.engagement_rate.toFixed(1)}% ER
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700">
                                                        <Star size={12} className="text-amber-400" />
                                                        {rankLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {creator.submissions_total > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                                                {creator.submissions_total} total
                                                            </span>
                                                            {creator.submissions_approved > 0 && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
                                                                    {creator.submissions_approved} approved
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No submissions</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {creator.total_points.toLocaleString()}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={creator.status} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-xs font-medium text-gray-600">
                                                        {formatDate(creator.createdAt)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <ChevronRight
                                                        size={18}
                                                        className="text-gray-300 group-hover:text-[#00B4EB] transition-colors inline-block"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {meta && meta.totalPages > 0 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <p className="text-xs text-gray-500">
                                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)} of {meta.total}{' '}
                                    creators
                                </p>
                                <Pagination
                                    current={page}
                                    pageSize={limit}
                                    total={meta.total}
                                    onChange={(p, pageSize) => {
                                        setPage(p);
                                        if (pageSize !== limit) setLimit(pageSize);
                                    }}
                                    showSizeChanger={false}
                                    showQuickJumper={meta.totalPages > 5}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
