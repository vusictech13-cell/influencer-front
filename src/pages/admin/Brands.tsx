import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Pagination, Select } from 'antd';
import {
    ArrowUpDown,
    Building2,
    ChevronRight,
    Loader2,
    Megaphone,
    Search,
    Wallet,
} from 'lucide-react';
import {
    useAdminBrands,
    type AdminBrandSortField,
    type AdminBrandStatusFilter,
} from '@/hooks/useAdminBrands';
import type { AdminSortOrder } from '@/hooks/useAdminCreators';
import { formatCurrency } from '@/hooks/useWallet';
import { resolveAssetUrl } from '@/utils/image';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const STATUS_TABS: { key: AdminBrandStatusFilter; label: string; activeClass: string }[] = [
    { key: 'all', label: 'All', activeClass: 'bg-gray-900 text-white border-gray-900' },
    { key: 'active', label: 'Active', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
    { key: 'inactive', label: 'Inactive', activeClass: 'bg-gray-500 text-white border-gray-500' },
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

function SummaryCard({
    label,
    value,
    icon: Icon,
    accent,
}: {
    label: string;
    value: string | number;
    icon: typeof Wallet;
    accent: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${accent}`}>
                <Icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 tracking-tight">{value}</p>
        </div>
    );
}

export default function AdminBrands() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [status, setStatus] = useState<AdminBrandStatusFilter>('all');
    const [sort, setSort] = useState<AdminBrandSortField>('createdAt');
    const [order, setOrder] = useState<AdminSortOrder>('desc');

    const { data, isLoading, isFetching } = useAdminBrands({
        page,
        limit,
        search,
        status,
        sort,
        order,
    });

    const brands = data?.brands ?? [];
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
        setSort('createdAt');
        setOrder('desc');
        setPage(1);
    };

    const hasFilters = search || status !== 'all' || sort !== 'createdAt' || order !== 'desc';

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                    <Building2 size={24} className="text-[#00B4EB]" />
                    Brands
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Platform-wide view of brand accounts, wallet balances, and campaign spend.
                </p>
            </div>

            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                        label="Total brands"
                        value={summary.total}
                        icon={Building2}
                        accent="text-gray-500"
                    />
                    <SummaryCard
                        label="Active campaigns"
                        value={summary.active_campaigns}
                        icon={Megaphone}
                        accent="text-emerald-500"
                    />
                    <SummaryCard
                        label="Platform spend"
                        value={formatCurrency(summary.total_spent)}
                        icon={Wallet}
                        accent="text-[#00B4EB]"
                    />
                    <SummaryCard
                        label="Active accounts"
                        value={summary.active}
                        icon={Building2}
                        accent="text-amber-500"
                    />
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

                        <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
                            <Select
                                value={`${sort}-${order}`}
                                onChange={(val) => {
                                    const [s, o] = val.split('-') as [AdminBrandSortField, AdminSortOrder];
                                    setSort(s);
                                    setOrder(o);
                                    setPage(1);
                                }}
                                className="min-w-[180px]"
                                options={[
                                    { value: 'createdAt-desc', label: 'Newest first' },
                                    { value: 'createdAt-asc', label: 'Oldest first' },
                                    { value: 'name-asc', label: 'Name A–Z' },
                                    { value: 'balance-desc', label: 'Highest balance' },
                                    { value: 'spent-desc', label: 'Highest spend' },
                                    { value: 'campaigns-desc', label: 'Most campaigns' },
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
                ) : brands.length === 0 ? (
                    <div className="py-16 text-center px-6">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Building2 size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No brands found</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {hasFilters ? 'Try adjusting your filters.' : 'Brands will appear here once they register.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
                                            Brand
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Wallet
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Locked
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Campaigns
                                        </th>
                                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                            Total spent
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
                                    {brands.map((brand) => {
                                        const avatarUrl = resolveAssetUrl(brand.profile_image);

                                        return (
                                            <tr
                                                key={brand.id}
                                                onClick={() => navigate(`/admin/brands/${brand.id}`)}
                                                className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {avatarUrl ? (
                                                            <img
                                                                src={avatarUrl}
                                                                alt={brand.name}
                                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-[#00B4EB]/20 flex items-center justify-center flex-shrink-0">
                                                                <Building2 size={16} className="text-[#00B4EB]" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#00B4EB] transition-colors">
                                                                {brand.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">{brand.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatCurrency(brand.wallet_balance)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-medium text-amber-600">
                                                        {formatCurrency(brand.wallet_locked)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                                            {brand.campaigns_total} total
                                                        </span>
                                                        {brand.campaigns_active > 0 && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
                                                                {brand.campaigns_active} active
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatCurrency(brand.total_spent)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={brand.status} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-xs font-medium text-gray-600">
                                                        {formatDate(brand.createdAt)}
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
                                    brands
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
