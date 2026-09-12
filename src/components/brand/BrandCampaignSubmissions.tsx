import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pagination, Select, DatePicker, message } from 'antd';
import {
    CheckCircle,
    Clock,
    ExternalLink,
    Loader2,
    Users,
    XCircle,
    Filter,
    ArrowUpDown,
} from 'lucide-react';
import { type Dayjs } from 'dayjs';
import api from '@/api/axios';
import {
    useCampaignSubmissions,
    type SubmissionStatusFilter,
    type SubmissionSortField,
    type SubmissionSortOrder,
    type BrandSubmission,
} from '@/hooks/useCampaignSubmissions';

const { RangePicker } = DatePicker;

const STATUS_TABS: { key: SubmissionStatusFilter; label: string; activeClass: string }[] = [
    { key: 'all', label: 'All', activeClass: 'bg-gray-900 text-white border-gray-900' },
    { key: 'pending', label: 'Pending', activeClass: 'bg-amber-500 text-white border-amber-500' },
    { key: 'approved', label: 'Approved', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
    { key: 'rejected', label: 'Rejected', activeClass: 'bg-red-500 text-white border-red-500' },
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

function StatusBadge({ status }: { status: BrandSubmission['status'] }) {
    if (status === 'pending') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                <Clock size={10} /> Pending
            </span>
        );
    }
    if (status === 'approved') {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle size={10} /> Approved
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">
            <XCircle size={10} /> Rejected
        </span>
    );
}

interface BrandCampaignSubmissionsProps {
    campaignId: string;
}

export default function BrandCampaignSubmissions({ campaignId }: BrandCampaignSubmissionsProps) {
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState<SubmissionStatusFilter>('all');
    const [sort, setSort] = useState<SubmissionSortField>('submitted_at');
    const [order, setOrder] = useState<SubmissionSortOrder>('desc');
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    const dateFrom = dateRange?.[0]?.format('YYYY-MM-DD');
    const dateTo = dateRange?.[1]?.format('YYYY-MM-DD');

    const { data, isLoading, isFetching } = useCampaignSubmissions({
        campaignId,
        page,
        limit,
        status,
        sort,
        order,
        dateFrom,
        dateTo,
    });

    const submissions = data?.submissions ?? [];
    const meta = data?.meta;

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['campaign-submissions', campaignId] });
    };

    const approveMutation = useMutation({
        mutationFn: (submissionId: number) => api.patch(`/submissions/${submissionId}/approve`),
        onSuccess: (res) => {
            message.success(res.data.message);
            invalidate();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            message.error(error.response?.data?.message || 'Approval failed');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (submissionId: number) => api.patch(`/submissions/${submissionId}/reject`),
        onSuccess: () => {
            message.success('Submission rejected');
            invalidate();
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            message.error(error.response?.data?.message || 'Rejection failed');
        },
    });

    const handleStatusChange = (next: SubmissionStatusFilter) => {
        setStatus(next);
        setPage(1);
    };

    const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
        setDateRange(dates);
        setPage(1);
    };

    const clearFilters = () => {
        setStatus('all');
        setSort('submitted_at');
        setOrder('desc');
        setDateRange(null);
        setPage(1);
    };

    const hasFilters = status !== 'all' || dateRange || sort !== 'submitted_at' || order !== 'desc';

    return (
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Creator Submissions</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Review and verify reels. Approved payouts release after 48 hours.
                        </p>
                    </div>
                    {meta && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                                {meta.counts.pending} pending
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                                {meta.counts.approved} approved
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 font-semibold border border-gray-100">
                                {meta.counts.all} total
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-5 flex flex-col xl:flex-row xl:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        {STATUS_TABS.map((tab) => {
                            const count = meta?.counts[tab.key] ?? 0;
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
                                placeholder={['From date', 'To date']}
                                className="!rounded-xl !border-gray-200"
                                allowClear
                            />
                        </div>

                        <Select
                            value={`${sort}-${order}`}
                            onChange={(val) => {
                                const [s, o] = val.split('-') as [SubmissionSortField, SubmissionSortOrder];
                                setSort(s);
                                setOrder(o);
                                setPage(1);
                            }}
                            className="min-w-[180px]"
                            options={[
                                { value: 'submitted_at-desc', label: 'Newest submitted' },
                                { value: 'submitted_at-asc', label: 'Oldest submitted' },
                                { value: 'approved_at-desc', label: 'Recently approved' },
                                { value: 'approved_at-asc', label: 'Earliest approved' },
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
            ) : submissions.length === 0 ? (
                <div className="py-16 text-center px-6">
                    <p className="text-sm font-medium text-gray-900">No submissions found</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasFilters ? 'Try adjusting your filters.' : 'Creators haven\'t submitted reels yet.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
                                        Creator
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                        Reel
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                        Submitted
                                    </th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">
                                        Status
                                    </th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{sub.user?.name || 'Creator'}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Users size={11} />
                                                @{sub.social_account?.username} •{' '}
                                                {sub.social_account?.followers_count?.toLocaleString()} followers
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 max-w-[220px]">
                                            <a
                                                href={sub.submission_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#00B4EB] hover:underline flex items-center gap-1 truncate"
                                            >
                                                <ExternalLink size={12} className="flex-shrink-0" />
                                                <span className="truncate">{sub.submission_url}</span>
                                            </a>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs font-medium text-gray-700">{formatDate(sub.submitted_at)}</p>
                                            {sub.approved_at && sub.status === 'approved' && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    Approved {formatDate(sub.approved_at)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={sub.status} />
                                            {sub.status === 'approved' && sub.payout_amount != null && (
                                                <p className="text-[10px] text-emerald-600 font-medium mt-1.5">
                                                    ₹{Number(sub.payout_amount).toLocaleString()}
                                                    {sub.payout_schedule?.release_at && (
                                                        <> · releases {formatDate(sub.payout_schedule.release_at)}</>
                                                    )}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {sub.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => approveMutation.mutate(sub.id)}
                                                        disabled={approveMutation.isPending}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
                                                    >
                                                        <CheckCircle size={12} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => rejectMutation.mutate(sub.id)}
                                                        disabled={rejectMutation.isPending}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                                                    >
                                                        <XCircle size={12} /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 text-right block">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {meta && meta.totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-xs text-gray-500">
                                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)} of {meta.total}{' '}
                                submissions
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
    );
}
