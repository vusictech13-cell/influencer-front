import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Calendar,
    Clock,
    ExternalLink,
    Loader2,
    Lock,
    Mail,
    Megaphone,
    Music,
    Users,
    Wallet,
} from 'lucide-react';
import { useAdminBrandDetail, type AdminBrandCampaign } from '@/hooks/useAdminBrands';
import { formatCurrency, getTransactionLabel } from '@/hooks/useWallet';
import { resolveAssetUrl } from '@/utils/image';

function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateTime(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function StatusBadge({ status }: { status: 'active' | 'inactive' | AdminBrandCampaign['status'] }) {
    const styles: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        inactive: 'bg-gray-50 text-gray-500 border-gray-100',
        draft: 'bg-gray-50 text-gray-500 border-gray-100',
        completed: 'bg-[#00B4EB]/10 text-[#0094d4] border-[#00B4EB]/20',
        paused: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return (
        <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${styles[status] || styles.inactive}`}>
            {status}
        </span>
    );
}

function StatCard({
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

export default function AdminBrandDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useAdminBrandDetail(id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#00B4EB]" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="max-w-6xl mx-auto text-center py-20">
                <p className="text-sm font-medium text-gray-900">Brand not found</p>
                <button
                    type="button"
                    onClick={() => navigate('/admin/brands')}
                    className="mt-4 text-sm font-semibold text-[#00B4EB] hover:underline"
                >
                    Back to brands
                </button>
            </div>
        );
    }

    const {
        user,
        wallet,
        campaignCounts,
        total_spent,
        pending_submissions_count,
        recent_campaigns,
        recent_transactions,
        recent_pending,
    } = data;
    const avatarUrl = resolveAssetUrl(user.profile_image);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <button
                type="button"
                onClick={() => navigate('/admin/brands')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={16} /> Back to brands
            </button>

            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={user.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[#00B4EB]/20 flex items-center justify-center flex-shrink-0">
                            <Building2 size={32} className="text-[#00B4EB]" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{user.name}</h1>
                            <StatusBadge status={user.status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                            <Mail size={14} /> {user.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            <Calendar size={12} /> Joined {formatDate(user.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Wallet balance"
                    value={formatCurrency(wallet.balance)}
                    icon={Wallet}
                    accent="text-emerald-500"
                />
                <StatCard
                    label="Locked in campaigns"
                    value={formatCurrency(wallet.locked_balance)}
                    icon={Lock}
                    accent="text-amber-500"
                />
                <StatCard
                    label="Total spent"
                    value={formatCurrency(total_spent)}
                    icon={Megaphone}
                    accent="text-[#00B4EB]"
                />
                <StatCard
                    label="Pending reviews"
                    value={pending_submissions_count}
                    icon={Clock}
                    accent={pending_submissions_count > 0 ? 'text-[#FF5A5F]' : 'text-gray-400'}
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Campaign breakdown</p>
                <div className="flex flex-wrap gap-3">
                    {(['active', 'draft', 'paused', 'completed'] as const).map((key) => (
                        <div key={key} className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-lg font-semibold text-gray-900">{campaignCounts[key]}</span>
                            <span className="ml-2 text-xs font-bold uppercase tracking-widest text-gray-400 capitalize">{key}</span>
                        </div>
                    ))}
                    <div className="px-4 py-2 rounded-xl bg-gray-900 text-white">
                        <span className="text-lg font-semibold">{campaignCounts.all}</span>
                        <span className="ml-2 text-xs font-bold uppercase tracking-widest opacity-70">total</span>
                    </div>
                </div>
            </div>

            {pending_submissions_count > 0 && (
                <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock size={18} className="text-amber-500" />
                            Pending submissions
                            <span className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
                                {pending_submissions_count}
                            </span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">Creator</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Campaign</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Submitted</th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">Reel</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recent_pending.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{sub.user?.name || 'Creator'}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Users size={11} />
                                                @{sub.social_account?.username} •{' '}
                                                {sub.social_account?.followers_count?.toLocaleString() ?? 0} followers
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm font-medium text-gray-900">{sub.campaign?.title ?? 'Campaign'}</p>
                                        </td>
                                        <td className="px-4 py-4 text-xs font-medium text-gray-600">
                                            {formatDate(sub.submitted_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {sub.submission_url ? (
                                                <a
                                                    href={sub.submission_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#00B4EB] hover:underline"
                                                >
                                                    View <ExternalLink size={11} />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Megaphone size={18} className="text-[#00B4EB]" />
                        Recent campaigns
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {campaignCounts.all}
                        </span>
                    </h2>
                </div>
                {recent_campaigns.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-12">No campaigns created yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">Campaign</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Budget</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Spent</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Submissions</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Dates</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recent_campaigns.map((campaign) => {
                                    const stats = campaign.submission_stats;
                                    return (
                                        <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {campaign.track_artwork_url ? (
                                                        <img
                                                            src={resolveAssetUrl(campaign.track_artwork_url)}
                                                            alt={campaign.title}
                                                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-[#00B4EB]/20 flex items-center justify-center flex-shrink-0">
                                                            <Music size={14} className="text-[#00B4EB]" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{campaign.title}</p>
                                                        <p className="text-xs text-gray-500 capitalize truncate">
                                                            {campaign.campaign_type} • {campaign.brand_name || 'Brand'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                                {formatCurrency(campaign.total_budget)}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-700">
                                                {formatCurrency(campaign.spent_budget)}
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
                                                    <span className="text-xs text-gray-400">None</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600">
                                                {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge status={campaign.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-2">
                <h2 className="text-sm font-semibold text-gray-900 px-4 pt-4 pb-2 flex items-center gap-2">
                    <Wallet size={16} className="text-emerald-500" />
                    Wallet transactions
                </h2>
                {recent_transactions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No transactions yet.</p>
                ) : (
                    recent_transactions.map((tx) => {
                        const isCredit = tx.type === 'topup' || tx.type === 'campaign_refund';
                        return (
                            <div key={tx.id} className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{getTransactionLabel(tx.type)}</p>
                                    <p className="text-[10px] text-gray-400">{tx.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                                        {isCredit ? '+' : '−'}{formatCurrency(tx.amount)}
                                    </p>
                                    <p className="text-[10px] text-gray-400">{formatDateTime(tx.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
