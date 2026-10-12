import { useState } from 'react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { searchCampaignBrands, useAdminCampaigns, useAdminOpsMutations, type AdminCampaign } from '@/hooks/useAdminOps';
import { fieldClass, LoadingRow, Modal, Notice, PageHeader, Panel, primaryButtonClass, StatusPill } from './adminUi';

const TYPES = ['reel', 'post', 'story', 'youtube_video', 'shorts', 'tiktok_video'];

function dateInput(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

export default function AdminCampaigns() {
    const me = useAdminMe();
    const canCreate = adminCan(me.data, 'CAMPAIGN_CREATE');
    const canEdit = adminCan(me.data, 'CAMPAIGN_EDIT');
    const canApprove = adminCan(me.data, 'CAMPAIGN_APPROVE');
    const canReject = adminCan(me.data, 'CAMPAIGN_REJECT');
    const canDelete = adminCan(me.data, 'CAMPAIGN_DELETE');
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const campaigns = useAdminCampaigns(page, status);
    const mutations = useAdminOpsMutations();
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<AdminCampaign | null>(null);
    const [brandQuery, setBrandQuery] = useState('');
    const [brands, setBrands] = useState<{ id: number; name: string; email: string }[]>([]);
    const [form, setForm] = useState({ title: '', campaign_type: 'reel', brand_user_id: 0, start_date: '', end_date: '', description: '', brand_name: '' });
    const [error, setError] = useState('');

    const items = campaigns.data?.items || [];
    const pages = Math.max(1, Math.ceil((campaigns.data?.total || 0) / 20));
    const busy = mutations.createCampaign.isPending || mutations.updateCampaign.isPending || mutations.setCampaignStatus.isPending || mutations.deleteCampaign.isPending;

    const openCreate = () => {
        setError('');
        setForm({ title: '', campaign_type: 'reel', brand_user_id: 0, start_date: '', end_date: '', description: '', brand_name: '' });
        setBrandQuery('');
        setBrands([]);
        setCreating(true);
    };

    const lookupBrands = async (value: string) => {
        setBrandQuery(value);
        if (value.trim().length < 2) {
            setBrands([]);
            return;
        }
        setBrands(await searchCampaignBrands(value.trim()));
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Campaigns"
                description="Drafts stay hidden from creators until someone approves them."
                action={canCreate ? <button type="button" className={primaryButtonClass} onClick={openCreate}>New campaign</button> : undefined}
            />
            <div className="flex flex-wrap gap-2">
                {['', 'draft', 'active', 'paused', 'completed'].map((key) => (
                    <button key={key || 'all'} type="button" onClick={() => { setStatus(key); setPage(1); }} className={`rounded-full border px-3 py-1 text-xs font-bold ${status === key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
                        {key || 'All'}
                    </button>
                ))}
            </div>
            <Panel>
                {campaigns.isLoading ? <LoadingRow /> : campaigns.isError ? (
                    <div className="p-4"><Notice>{getApiErrorMessage(campaigns.error, 'Could not load campaigns.')}</Notice></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Campaign</th>
                                    <th className="px-4 py-3 font-bold">Brand</th>
                                    <th className="px-4 py-3 font-bold">Status</th>
                                    <th className="px-4 py-3 font-bold">Budget</th>
                                    <th className="px-4 py-3 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((campaign) => (
                                    <tr key={campaign.id} className="border-b border-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-brand-ink">{campaign.title}</p>
                                            <p className="text-xs text-brand-gray">{campaign.campaign_type.replaceAll('_', ' ')}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-brand-ink">{campaign.owner?.name || campaign.brand_name || '—'}</td>
                                        <td className="px-4 py-3"><StatusPill status={campaign.status} /></td>
                                        <td className="px-4 py-3 text-xs text-brand-gray">₹{campaign.spent_budget.toLocaleString('en-IN')} / ₹{campaign.total_budget.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {canEdit && (
                                                    <button type="button" className="rounded-full border border-[#dce8f0] px-2.5 py-1 text-[11px] font-bold" onClick={() => { setError(''); setEditing(campaign); }}>Edit</button>
                                                )}
                                                {canApprove && ['draft', 'paused'].includes(campaign.status) && (
                                                    <button type="button" className="rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-40" disabled={busy} onClick={() => mutations.setCampaignStatus.mutate({ id: campaign.id, action: 'approve' })}>Approve</button>
                                                )}
                                                {canReject && ['draft', 'active'].includes(campaign.status) && (
                                                    <button type="button" className="rounded-full border border-[#ffd7c2] px-2.5 py-1 text-[11px] font-bold text-brand-orange disabled:opacity-40" disabled={busy} onClick={() => mutations.setCampaignStatus.mutate({ id: campaign.id, action: 'reject' })}>Reject</button>
                                                )}
                                                {canDelete && campaign.spent_budget <= 0 && (
                                                    <button type="button" className="rounded-full border border-red-100 px-2.5 py-1 text-[11px] font-bold text-red-500 disabled:opacity-40" disabled={busy} onClick={() => mutations.deleteCampaign.mutate(campaign.id)}>Delete</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!items.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-brand-gray">No campaigns found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
            {pages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <button type="button" className="rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Newer</button>
                    <span className="text-xs text-brand-gray">{page} of {pages}</span>
                    <button type="button" className="rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Older</button>
                </div>
            )}
            {(mutations.setCampaignStatus.isError || mutations.deleteCampaign.isError) && (
                <Notice>{getApiErrorMessage(mutations.setCampaignStatus.error || mutations.deleteCampaign.error, 'Could not update that campaign.')}</Notice>
            )}
            {creating && (
                <Modal title="New campaign" onClose={() => !busy && setCreating(false)}>
                    <form className="space-y-3" onSubmit={(event) => {
                        event.preventDefault();
                        setError('');
                        mutations.createCampaign.mutate(form, {
                            onSuccess: () => setCreating(false),
                            onError: (err) => setError(getApiErrorMessage(err, 'Could not create the campaign.')),
                        });
                    }}>
                        {error && <Notice>{error}</Notice>}
                        <label className="block text-xs font-semibold text-[#5c6570]">Title
                            <input className={`${fieldClass} mt-1`} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Type
                            <select className={`${fieldClass} mt-1`} value={form.campaign_type} onChange={(event) => setForm({ ...form, campaign_type: event.target.value })}>
                                {TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
                            </select>
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Brand
                            <input className={`${fieldClass} mt-1`} value={brandQuery} placeholder="Search name or email" onChange={(event) => lookupBrands(event.target.value)} />
                        </label>
                        {brands.length > 0 && (
                            <div className="rounded-xl border border-[#dce8f0]">
                                {brands.map((brand) => (
                                    <button key={brand.id} type="button" className={`block w-full px-3 py-2 text-left text-sm ${form.brand_user_id === brand.id ? 'bg-[#fff1e8]' : ''}`} onClick={() => { setForm({ ...form, brand_user_id: brand.id, brand_name: brand.name }); setBrandQuery(brand.email); setBrands([]); }}>
                                        {brand.name} · {brand.email}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block text-xs font-semibold text-[#5c6570]">Start
                                <input type="date" className={`${fieldClass} mt-1`} value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} />
                            </label>
                            <label className="block text-xs font-semibold text-[#5c6570]">End
                                <input type="date" className={`${fieldClass} mt-1`} value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} />
                            </label>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" className="h-11 flex-1 rounded-xl border text-sm font-bold" onClick={() => setCreating(false)} disabled={busy}>Cancel</button>
                            <button type="submit" className={`${primaryButtonClass} flex-1`} disabled={busy || !form.brand_user_id}>{busy ? 'Saving...' : 'Create draft'}</button>
                        </div>
                    </form>
                </Modal>
            )}
            {editing && (
                <Modal title="Edit campaign" onClose={() => !busy && setEditing(null)}>
                    <form className="space-y-3" onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        mutations.updateCampaign.mutate({
                            id: editing.id,
                            title: String(data.get('title') || ''),
                            description: String(data.get('description') || ''),
                            brand_name: String(data.get('brand_name') || ''),
                            end_date: String(data.get('end_date') || ''),
                        }, {
                            onSuccess: () => setEditing(null),
                            onError: (err) => setError(getApiErrorMessage(err, 'Could not save the campaign.')),
                        });
                    }}>
                        {error && <Notice>{error}</Notice>}
                        <label className="block text-xs font-semibold text-[#5c6570]">Title
                            <input name="title" className={`${fieldClass} mt-1`} defaultValue={editing.title} />
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Brand name
                            <input name="brand_name" className={`${fieldClass} mt-1`} defaultValue={editing.brand_name || ''} />
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Description
                            <textarea name="description" className="mt-1 min-h-24 w-full rounded-xl border border-[#dce8f0] px-3 py-2 text-sm outline-none focus:border-[#ff6a1a]" defaultValue={editing.description || ''} />
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">End date
                            <input name="end_date" type="date" className={`${fieldClass} mt-1`} defaultValue={dateInput(editing.end_date)} />
                        </label>
                        <div className="flex gap-2 pt-2">
                            <button type="button" className="h-11 flex-1 rounded-xl border text-sm font-bold" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
                            <button type="submit" className={`${primaryButtonClass} flex-1`} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
