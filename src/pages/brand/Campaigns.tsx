import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Select, DatePicker } from 'antd';
import {
    ArrowUpDown,
    Award,
    Calendar,
    ChevronRight,
    Filter,
    Loader2,
    Megaphone,
    Music,
    Plus,
    Users,
} from 'lucide-react';
import { type Dayjs } from 'dayjs';
import {
    useBrandCampaigns,
    getCreatorSlots,
    type CampaignStatusFilter,
    type CampaignSortField,
    type CampaignSortOrder,
    type BrandCampaign,
} from '@/hooks/useBrandCampaigns';
import { resolveAssetUrl } from '@/utils/image';

const { RangePicker } = DatePicker;

const STATUS_TABS: { key: CampaignStatusFilter; label: string; activeClass: string }[] = [
    { key: 'all', label: 'All', activeClass: 'bg-gray-900 text-white border-gray-900' },
    { key: 'active', label: 'Active', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
    { key: 'paused', label: 'Paused', activeClass: 'bg-amber-500 text-white border-amber-500' },
    { key: 'completed', label: 'Completed', activeClass: 'bg-[#00B4EB] text-white border-[#00B4EB]' },
    { key: 'draft', label: 'Draft', activeClass: 'bg-gray-500 text-white border-gray-500' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function StatusBadge({ status }: { status: BrandCampaign['status'] }) {
    const styles: Record<BrandCampaign['status'], string> = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        paused: 'bg-amber-50 text-amber-600 border-amber-100',
        completed: 'bg-[#00B4EB]/10 text-[#0094d4] border-[#00B4EB]/20',
        draft: 'bg-gray-50 text-gray-500 border-gray-100',
    };

    return (
        <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${styles[status]}`}>
            {status}
        </span>
    );
}

export default function BrandCampaigns() {
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState<CampaignStatusFilter>('all');
    const [sort, setSort] = useState<CampaignSortField>('createdAt');
    const [order, setOrder] = useState<CampaignSortOrder>('desc');
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    const dateFrom = dateRange?.[0]?.format('YYYY-MM-DD');
    const dateTo = dateRange?.[1]?.format('YYYY-MM-DD');

    const { data, isLoading, isFetching } = useBrandCampaigns({
        page,
        limit,
        status,
        sort,
        order,
        dateFrom,
        dateTo,
    });

    const campaigns = data?.campaigns ?? [];
    const meta = data?.meta;

    const handleStatusChange = (next: CampaignStatusFilter) => {
        setStatus(next);
        setPage(1);
    };

    const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        setDateRange(dates);
        setPage(1);
    };

    const clearFilters = () => {
        setStatus('all');
        setSort('createdAt');
        setOrder('desc');
        setDateRange(null);
        setPage(1);
    };

    const hasFilters = status !== 'all' || dateRange || sort !== 'createdAt' || order !== 'desc';

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                        <Megaphone size={24} className="text-[#00B4EB]" />
                        Campaigns
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your campaigns and review creator submissions.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/brand/campaigns/create')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#00B4EB] hover:bg-[#009fd4] text-gray-900 text-sm font-semibold rounded-xl shadow-sm transition-all hover:scale-[1.02]"
                >
                    Create Campaign <Plus size={16} />
                </button>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    {meta?.counts && (
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-100">
                                {meta.counts.active} active
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm border border-amber-100">
                                {meta.counts.paused} paused
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 font-semibold text-sm border border-gray-100">
                                {meta.counts.all} total
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                        <div className="flex flex-wrap gap-2">
                            {STATUS_TABS.map((tab) => {
                                const count = meta?.counts?.[tab.key] ?? 0;
                                const isActive = status === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleStatusChange(tab.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                            isActive
                                                ? tab.activeClass
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                        <span className={`ml-1.5 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                                            ({count})
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
                            <div className="flex items-center gap-2">
                                <Filter size={14} className="text-gray-400" />
                                <RangePicker
                                    value={dateRange}
                                    onChange={handleDateChange}
                                    format="DD MMM YYYY"
                                    placeholder={['End from', 'End to']}
                                    className="!rounded-xl !border-gray-200"
                                    allowClear
                                />
                            </div>

                            <Select
                                value={`${sort}-${order}`}
                                onChange={(val) => {
                                    const [s, o] = val.split('-') as [CampaignSortField, CampaignSortOrder];
                                    setSort(s);
                                    setOrder(o);
                                    setPage(1);
                                }}
                                className="min-w-[180px]"
                                options={[
                                    { value: 'createdAt-desc', label: 'Newest first' },
                                    { value: 'createdAt-asc', label: 'Oldest first' },
                                    { value: 'end_date-asc', label: 'Ending soon' },
                                    { value: 'end_date-desc', label: 'Ending later' },
                                    { value: 'total_budget-desc', label: 'Highest budget' },
                                    { value: 'total_budget-asc', label: 'Lowest budget' },
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
                ) : campaigns.length === 0 ? (
                    <div className="py-16 text-center px-6">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Megaphone size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No campaigns found</p>
                        <p className="text-sm text-gray-500 mt-1 mb-6">
                            {hasFilters ? 'Try adjusting your filters.' : 'Create your first campaign to get started.'}
                        </p>
                        {!hasFilters && (
                            <button
                                onClick={() => navigate('/brand/campaigns/create')}
                                className="text-sm font-semibold text-[#00B4EB] hover:underline"
                            >
                                Create Campaign
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
                                            Campaign
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Budget
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Creators
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Submissions
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Dates
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Status
                                        </th>
                                        <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {campaigns.map((campaign) => {
                                        const slots = getCreatorSlots(campaign);
                                        const stats = campaign.submission_stats;
                                        return (
                                            <tr
                                                key={campaign.id}
                                                onClick={() => navigate(`/brand/campaigns/${campaign.id}`)}
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {campaign.track_artwork_url ? (
                                                            <img
                                                                src={resolveAssetUrl(campaign.track_artwork_url)}
                                                                alt={campaign.title}
                                                                className="w-11 h-11 rounded-xl object-cover shadow-inner flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-xl bg-[#00B4EB]/20 flex items-center justify-center flex-shrink-0">
                                                                <Music size={18} className="text-[#00B4EB]" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#00B4EB] transition-colors">
                                                                {campaign.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 capitalize truncate">
                                                                {campaign.campaign_type} • {campaign.brand_name || 'Brand'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                                                        <Award size={13} className="text-gray-400" />
                                                        ₹{Number(campaign.total_budget).toLocaleString()}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                                        <Users size={12} className="text-gray-400" />
                                                        {slots} slots
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {stats && stats.total > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                                                {stats.total} total
                                                            </span>
                                                            {stats.pending > 0 && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">
                                                                    {stats.pending} pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No submissions</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                                        <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                                                        {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={campaign.status} />
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
                                    campaigns
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
