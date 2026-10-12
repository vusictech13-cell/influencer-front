import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Select } from 'antd';
import { ArrowUpDown, Building2, ChevronRight, Megaphone, Wallet } from 'lucide-react';
import {
    useAdminBrands,
    type AdminBrandSortField,
    type AdminBrandStatusFilter,
} from '@/hooks/useAdminBrands';
import type { AdminSortOrder } from '@/hooks/useAdminCreators';
import { formatCurrency } from '@/hooks/useWallet';
import { resolveAssetUrl } from '@/utils/image';
import { fieldClass, LoadingRow, PageHeader, Panel, StatusPill, TabButton, TabGroup } from './adminUi';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

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
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={`mb-2 flex items-center gap-2 ${accent}`}>
                <Icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
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

    const hasFilters = search || status !== 'all' || sort !== 'createdAt' || order !== 'desc';

    return (
        <div className="space-y-5">
            <PageHeader
                title="Brands"
                description="Brand accounts, wallet balances, and campaign spend."
            />

            {summary && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <SummaryCard label="Total brands" value={summary.total} icon={Building2} accent="text-gray-500" />
                    <SummaryCard label="Active campaigns" value={summary.active_campaigns} icon={Megaphone} accent="text-emerald-500" />
                    <SummaryCard label="Platform spend" value={formatCurrency(summary.total_spent)} icon={Wallet} accent="text-[#00B4EB]" />
                    <SummaryCard label="Active accounts" value={summary.active} icon={Building2} accent="text-amber-500" />
                </div>
            )}

            <TabGroup>
                {(['all', 'active', 'inactive'] as const).map((key) => (
                    <TabButton key={key} active={status === key} onClick={() => { setStatus(key); setPage(1); }}>
                        {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Inactive'}
                    </TabButton>
                ))}
            </TabGroup>

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
                        const [nextSort, nextOrder] = val.split('-') as [AdminBrandSortField, AdminSortOrder];
                        setSort(nextSort);
                        setOrder(nextOrder);
                        setPage(1);
                    }}
                    className="h-11 min-w-[180px]"
                    options={[
                        { value: 'createdAt-desc', label: 'Newest first' },
                        { value: 'createdAt-asc', label: 'Oldest first' },
                        { value: 'name-asc', label: 'Name A–Z' },
                        { value: 'balance-desc', label: 'Highest balance' },
                        { value: 'spent-desc', label: 'Highest spend' },
                        { value: 'campaigns-desc', label: 'Most campaigns' },
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
                                    <th className="px-4 py-3 font-bold">Brand</th>
                                    <th className="px-4 py-3 font-bold">Wallet</th>
                                    <th className="px-4 py-3 font-bold">Locked</th>
                                    <th className="px-4 py-3 font-bold">Campaigns</th>
                                    <th className="px-4 py-3 font-bold">Spent</th>
                                    <th className="px-4 py-3 font-bold">Status</th>
                                    <th className="px-4 py-3 font-bold">Joined</th>
                                    <th className="px-4 py-3 font-bold">
                                        <span className="sr-only">View details</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {brands.map((brand) => {
                                    const avatarUrl = resolveAssetUrl(brand.profile_image);
                                    return (
                                        <tr
                                            key={brand.id}
                                            className="cursor-pointer border-b border-gray-50 hover:bg-[#f8fafb]"
                                            onClick={() => navigate(`/admin/brands/${brand.id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt="" className="h-9 w-9 flex-none rounded-full object-cover" />
                                                    ) : (
                                                        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#fff4ec] text-brand-orange">
                                                            <Building2 size={15} />
                                                        </span>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-brand-ink">{brand.name}</p>
                                                        <p className="truncate text-xs text-brand-gray">{brand.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-brand-ink">{formatCurrency(brand.wallet_balance)}</td>
                                            <td className="px-4 py-3 text-brand-gray">{formatCurrency(brand.wallet_locked)}</td>
                                            <td className="px-4 py-3 text-brand-ink">
                                                {brand.campaigns_active} active / {brand.campaigns_total}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-brand-ink">{formatCurrency(brand.total_spent)}</td>
                                            <td className="px-4 py-3">
                                                <StatusPill status={brand.status} label={brand.status === 'active' ? 'Active' : 'Inactive'} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-brand-gray">{formatDate(brand.createdAt)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    aria-label={`View ${brand.name}`}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        navigate(`/admin/brands/${brand.id}`);
                                                    }}
                                                    className="inline-grid h-8 w-8 place-items-center rounded-full text-brand-gray hover:bg-white hover:text-brand-ink"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!brands.length && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-sm text-brand-gray">
                                            {hasFilters ? 'No brands match these filters.' : 'No brands yet.'}
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
                        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} brands
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
