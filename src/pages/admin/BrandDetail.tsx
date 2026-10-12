import { useState } from 'react';
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
    Phone,
    Users,
    Wallet,
} from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import { useAdminBrandDetail, useSetBrandStatus, useUpdateBrand, type AdminBrandCampaign } from '@/hooks/useAdminBrands';
import { useImpersonateUser } from '@/hooks/useAdminCreators';
import { persistSession, stashAdminSession } from '@/utils/auth';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { formatCurrency, getTransactionLabel } from '@/hooks/useWallet';
import { resolveAssetUrl } from '@/utils/image';
import { fieldClass, Modal } from './adminUi';
import AccountSessions from './AccountSessions';

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

function StatusBadge({ status, label }: { status: 'active' | 'inactive' | AdminBrandCampaign['status']; label?: string }) {
    const styles: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        inactive: 'bg-gray-50 text-gray-500 border-gray-100',
        draft: 'bg-gray-50 text-gray-500 border-gray-100',
        completed: 'bg-[#00B4EB]/10 text-[#0094d4] border-[#00B4EB]/20',
        paused: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    return (
        <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${styles[status] || styles.inactive}`}>
            {label || status}
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
    const me = useAdminMe();
    const canEdit = adminCan(me.data, 'BRAND_EDIT');
    const canSuspend = adminCan(me.data, 'BRAND_SUSPEND');
    const canApprove = adminCan(me.data, 'BRAND_APPROVE');
    const canOpenAccount = adminCan(me.data, 'USER_IMPERSONATE');
    const canViewSessions = adminCan(me.data, 'SESSION_VIEW_USERS');
    const canRevokeSessions = adminCan(me.data, 'SESSION_REVOKE_USERS');
    const { data, isLoading, isError } = useAdminBrandDetail(id);
    const setStatus = useSetBrandStatus(id);
    const updateBrand = useUpdateBrand(id);
    const [accountAction, setAccountAction] = useState<'suspend' | 'approve' | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const impersonate = useImpersonateUser();
    const [openError, setOpenError] = useState('');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#00B4EB]" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="w-full py-20 text-center">
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
        <div className="w-full space-y-6">
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
                            <StatusBadge status={user.status} label={user.status === 'inactive' ? 'suspended' : 'active'} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                            <Mail size={14} /> {user.email}
                        </p>
                        {user.phone && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                                <Phone size={14} /> {user.phone}
                            </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            <Calendar size={12} /> Joined {formatDate(user.createdAt)}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {user.status === 'active' && canOpenAccount && (
                                <button
                                    type="button"
                                    className="h-9 rounded-xl bg-brand-orange px-3 text-xs font-bold text-white disabled:opacity-60"
                                    disabled={impersonate.isPending}
                                    onClick={() => {
                                        setOpenError('');
                                        impersonate.mutate(user.id, {
                                            onSuccess: (session) => {
                                                stashAdminSession();
                                                persistSession(session.accessToken, session.refreshToken, session.user, 'user');
                                                window.location.assign('/brand/dashboard');
                                            },
                                            onError: (error) => setOpenError(getApiErrorMessage(error, 'Could not open this account')),
                                        });
                                    }}
                                >
                                    {impersonate.isPending ? 'Opening...' : 'Open account'}
                                </button>
                            )}
                            {canEdit && (
                                <button
                                    type="button"
                                    className="h-9 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700"
                                    onClick={() => {
                                        setForm({ name: user.name, email: user.email, phone: user.phone || '' });
                                        updateBrand.reset();
                                        setEditing(true);
                                    }}
                                >
                                    Edit
                                </button>
                            )}
                            {user.status === 'active' && canSuspend && (
                                <button type="button" className="h-9 rounded-xl bg-brand-orange px-3 text-xs font-bold text-white" onClick={() => { setStatus.reset(); setAccountAction('suspend'); }}>
                                    Suspend
                                </button>
                            )}
                            {user.status === 'inactive' && canApprove && (
                                <button type="button" className="h-9 rounded-xl bg-brand-orange px-3 text-xs font-bold text-white" onClick={() => { setStatus.reset(); setAccountAction('approve'); }}>
                                    Approve
                                </button>
                            )}
                        </div>
                        {openError && <p className="mt-2 text-xs font-semibold text-red-600">{openError}</p>}
                    </div>
                </div>
            </div>

            {canViewSessions && <AccountSessions owner="user" ownerId={user.id} canRevoke={canRevokeSessions} />}

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
            {editing && (
                <Modal title="Edit brand" onClose={() => !updateBrand.isPending && setEditing(false)}>
                    <form
                        className="space-y-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            updateBrand.mutate(form, { onSuccess: () => setEditing(false) });
                        }}
                    >
                        {updateBrand.isError && (
                            <p className="rounded-xl border border-[#f3d0d0] bg-[#fff7f7] px-3 py-2 text-xs text-[#b4232c]">
                                {getApiErrorMessage(updateBrand.error, 'Could not save this brand.')}
                            </p>
                        )}
                        <label className="block text-xs font-semibold text-[#5c6570]">Name
                            <input className={`${fieldClass} mt-1`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Email
                            <input className={`${fieldClass} mt-1`} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Phone
                            <input className={`${fieldClass} mt-1`} inputMode="numeric" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} />
                        </label>
                        <div className="flex gap-2 pt-2">
                            <button type="button" className="h-11 flex-1 rounded-xl border border-[#dce8f0] text-sm font-bold" onClick={() => setEditing(false)} disabled={updateBrand.isPending}>Cancel</button>
                            <button type="submit" className="h-11 flex-1 rounded-xl bg-brand-orange text-sm font-bold text-white disabled:opacity-50" disabled={updateBrand.isPending}>
                                {updateBrand.isPending ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            {accountAction && (
                <Modal title={accountAction === 'suspend' ? 'Suspend brand' : 'Approve brand'} onClose={() => !setStatus.isPending && setAccountAction(null)}>
                    <div className="space-y-4">
                        {setStatus.isError && (
                            <p className="rounded-xl border border-[#f3d0d0] bg-[#fff7f7] px-3 py-2 text-xs text-[#b4232c]">
                                {getApiErrorMessage(setStatus.error, 'Could not update this brand.')}
                            </p>
                        )}
                        <p className="text-sm text-[#5c6570]">
                            {accountAction === 'suspend'
                                ? `${user.name} will be signed out and cannot log in until someone approves them.`
                                : `${user.name} will be able to sign in again.`}
                        </p>
                        <div className="flex gap-2">
                            <button type="button" className="h-11 flex-1 rounded-xl border border-[#dce8f0] text-sm font-bold" onClick={() => setAccountAction(null)} disabled={setStatus.isPending}>Cancel</button>
                            <button
                                type="button"
                                className="h-11 flex-1 rounded-xl bg-brand-orange text-sm font-bold text-white disabled:opacity-50"
                                disabled={setStatus.isPending}
                                onClick={() => setStatus.mutate(accountAction, { onSuccess: () => setAccountAction(null) })}
                            >
                                {setStatus.isPending ? 'Working...' : accountAction === 'suspend' ? 'Suspend' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
