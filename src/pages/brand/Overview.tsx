import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    ChevronRight,
    Clock,
    ExternalLink,
    LayoutDashboard,
    Loader2,
    Lock,
    Megaphone,
    Music,
    Plus,
    Users,
    Wallet,
    XCircle,
} from 'lucide-react';
import api from '@/api/axios';
import { useBrandOverview } from '@/hooks/useBrandOverview';
import {
    useWalletTransactions,
    formatCurrency,
    getTransactionLabel,
} from '@/hooks/useWallet';
import { resolveAssetUrl } from '@/utils/image';

function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function StatCard({
    label,
    value,
    icon: Icon,
    accent,
    loading,
    onClick,
}: {
    label: string;
    value: string | number;
    icon: typeof Wallet;
    accent: string;
    loading?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-left w-full transition-all ${
                onClick ? 'hover:border-[#00B4EB]/40 hover:shadow-md cursor-pointer' : 'cursor-default'
            }`}
        >
            <div className={`flex items-center gap-2 mb-2 ${accent}`}>
                <Icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            {loading ? (
                <Loader2 className="animate-spin text-[#00B4EB]" size={24} />
            ) : (
                <p className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">{value}</p>
            )}
        </button>
    );
}

export default function BrandOverview() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: overview, isLoading } = useBrandOverview();
    const { data: transactions, isLoading: txLoading } = useWalletTransactions();

    const approveMutation = useMutation({
        mutationFn: (submissionId: number) => api.patch(`/submissions/${submissionId}/approve`),
        onSuccess: (res) => {
            message.success(res.data.message);
            queryClient.invalidateQueries({ queryKey: ['brand-overview'] });
            queryClient.invalidateQueries({ queryKey: ['brand-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['campaign-submissions'] });
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            message.error(error.response?.data?.message || 'Approval failed');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (submissionId: number) => api.patch(`/submissions/${submissionId}/reject`),
        onSuccess: () => {
            message.success('Submission rejected');
            queryClient.invalidateQueries({ queryKey: ['brand-overview'] });
            queryClient.invalidateQueries({ queryKey: ['brand-campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['campaign-submissions'] });
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            message.error(error.response?.data?.message || 'Rejection failed');
        },
    });

    const recentTx = transactions?.slice(0, 5) ?? [];
    const pendingCount = overview?.pendingSubmissionsCount ?? 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#00B4EB]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                        <LayoutDashboard size={24} className="text-[#00B4EB]" />
                        Overview
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Your campaign snapshot and items that need attention.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => navigate('/brand/wallet')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Wallet size={16} /> Add Funds
                    </button>
                    <button
                        onClick={() => navigate('/brand/campaigns/create')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00B4EB] hover:bg-[#009fd4] text-gray-900 text-sm font-semibold rounded-xl shadow-sm transition-all hover:scale-[1.02]"
                    >
                        Create Campaign <Plus size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Available Balance"
                    value={formatCurrency(overview?.wallet.balance ?? 0)}
                    icon={Wallet}
                    accent="text-emerald-500"
                    onClick={() => navigate('/brand/wallet')}
                />
                <StatCard
                    label="Locked in Campaigns"
                    value={formatCurrency(overview?.wallet.locked_balance ?? 0)}
                    icon={Lock}
                    accent="text-amber-500"
                    onClick={() => navigate('/brand/wallet')}
                />
                <StatCard
                    label="Active Campaigns"
                    value={overview?.campaignCounts.active ?? 0}
                    icon={Megaphone}
                    accent="text-[#00B4EB]"
                    onClick={() => navigate('/brand/campaigns')}
                />
                <StatCard
                    label="Pending Reviews"
                    value={pendingCount}
                    icon={AlertCircle}
                    accent={pendingCount > 0 ? 'text-[#FF5A5F]' : 'text-gray-400'}
                    onClick={() => navigate('/brand/campaigns')}
                />
            </div>

            {pendingCount > 0 && (
                <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Clock size={18} className="text-amber-500" />
                                Pending Submissions
                                <span className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
                                    {pendingCount}
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">Review creator reels awaiting your approval.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">Creator</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Campaign</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Submitted</th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {overview?.recentPending.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{sub.user?.name || 'Creator'}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Users size={11} />
                                                @{sub.social_account?.username} •{' '}
                                                {sub.social_account?.followers_count?.toLocaleString()} followers
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => navigate(`/brand/campaigns/${sub.campaign_id}`)}
                                                className="text-sm font-medium text-gray-900 hover:text-[#00B4EB] transition-colors text-left"
                                            >
                                                {sub.campaign?.title ?? 'Campaign'}
                                            </button>
                                            <a
                                                href={sub.submission_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#00B4EB] hover:underline flex items-center gap-1 mt-1"
                                            >
                                                <ExternalLink size={11} /> View reel
                                            </a>
                                        </td>
                                        <td className="px-4 py-4 text-xs font-medium text-gray-600">
                                            {formatDate(sub.submitted_at)}
                                        </td>
                                        <td className="px-6 py-4">
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pendingCount > (overview?.recentPending.length ?? 0) && (
                        <div className="px-6 py-4 border-t border-gray-100 text-center">
                            <button
                                onClick={() => navigate('/brand/campaigns')}
                                className="text-sm font-semibold text-[#00B4EB] hover:underline inline-flex items-center gap-1"
                            >
                                View all {pendingCount} pending submissions <ArrowRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Active Campaigns</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Ending soon — click to manage submissions.</p>
                        </div>
                        <button
                            onClick={() => navigate('/brand/campaigns')}
                            className="text-xs font-semibold text-[#00B4EB] hover:underline flex items-center gap-1"
                        >
                            View all <ChevronRight size={14} />
                        </button>
                    </div>

                    {!overview?.activeCampaigns.length ? (
                        <div className="py-12 px-6 text-center">
                            <p className="text-sm text-gray-500 mb-4">No active campaigns right now.</p>
                            <button
                                onClick={() => navigate('/brand/campaigns/create')}
                                className="text-sm font-semibold text-[#00B4EB] hover:underline"
                            >
                                Create your first campaign
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {overview.activeCampaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    onClick={() => navigate(`/brand/campaigns/${campaign.id}`)}
                                    className="p-4 flex items-center gap-4 hover:bg-gray-50/50 cursor-pointer transition-colors group"
                                >
                                    {campaign.track_artwork_url ? (
                                        <img
                                            src={resolveAssetUrl(campaign.track_artwork_url)}
                                            alt={campaign.title}
                                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-[#00B4EB]/20 flex items-center justify-center flex-shrink-0">
                                            <Music size={18} className="text-[#00B4EB]" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#00B4EB] transition-colors">
                                            {campaign.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Ends {formatDate(campaign.end_date)} • ₹
                                            {Number(campaign.total_budget).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {campaign.submission_stats && campaign.submission_stats.pending > 0 ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100">
                                                {campaign.submission_stats.pending} pending
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                {campaign.submission_stats?.total ?? 0} submissions
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Recent Wallet Activity</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Total spent on payouts: {formatCurrency(overview?.totalSpent ?? 0)}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/brand/wallet')}
                            className="text-xs font-semibold text-[#00B4EB] hover:underline flex items-center gap-1"
                        >
                            View wallet <ChevronRight size={14} />
                        </button>
                    </div>

                    {txLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-[#00B4EB]" />
                        </div>
                    ) : !recentTx.length ? (
                        <div className="py-12 px-6 text-center text-sm text-gray-500">
                            No transactions yet. Add funds to launch campaigns.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recentTx.map((tx) => (
                                <div key={tx.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {getTransactionLabel(tx.type)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                                    </div>
                                    <p
                                        className={`text-sm font-semibold flex-shrink-0 ${
                                            tx.type === 'topup' || tx.type === 'campaign_refund'
                                                ? 'text-emerald-600'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {tx.type === 'topup' || tx.type === 'campaign_refund' ? '+' : '−'}
                                        {formatCurrency(tx.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(
                    [
                        { key: 'active', label: 'Active', count: overview?.campaignCounts.active, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                        { key: 'paused', label: 'Paused', count: overview?.campaignCounts.paused, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { key: 'completed', label: 'Completed', count: overview?.campaignCounts.completed, color: 'text-[#0094d4] bg-[#00B4EB]/10 border-[#00B4EB]/20' },
                        { key: 'draft', label: 'Draft', count: overview?.campaignCounts.draft, color: 'text-gray-600 bg-gray-50 border-gray-100' },
                    ] as const
                ).map((item) => (
                    <button
                        key={item.key}
                        onClick={() => navigate(`/brand/campaigns`)}
                        className={`rounded-xl border p-4 text-left hover:scale-[1.01] transition-all ${item.color}`}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{item.label}</p>
                        <p className="text-2xl font-semibold mt-1">{item.count ?? 0}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
