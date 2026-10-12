import { useState } from 'react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminOpsMutations, useAdminPayouts } from '@/hooks/useAdminOps';
import { formatCurrency } from '@/hooks/useWallet';
import { formatWhen, LoadingRow, Notice, PageHeader, Panel, StatusPill } from './adminUi';

export default function AdminPayouts() {
    const me = useAdminMe();
    const canManage = adminCan(me.data, 'PAYOUT_MANAGE');
    const [page, setPage] = useState(1);
    const payouts = useAdminPayouts(page);
    const { payoutAction } = useAdminOpsMutations();
    const items = payouts.data?.items || [];
    const pages = Math.max(1, Math.ceil((payouts.data?.total || 0) / 20));

    return (
        <div className="space-y-5">
            <PageHeader title="Payouts" description="Creator earnings waiting to release, and payouts that already moved." />
            <Panel>
                {payouts.isLoading ? <LoadingRow /> : payouts.isError ? <div className="p-4"><Notice>{getApiErrorMessage(payouts.error, 'Could not load payouts.')}</Notice></div> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                                <tr>
                                    <th className="px-4 py-3 font-bold">Creator</th>
                                    <th className="px-4 py-3 font-bold">Campaign</th>
                                    <th className="px-4 py-3 font-bold">Amount</th>
                                    <th className="px-4 py-3 font-bold">Status</th>
                                    <th className="px-4 py-3 font-bold">Release</th>
                                    {canManage && <th className="px-4 py-3 font-bold">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((payout) => (
                                    <tr key={payout.id} className="border-b border-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-brand-ink">{payout.creator?.name || 'Creator'}</p>
                                            <p className="text-xs text-brand-gray">{payout.brand?.name}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{payout.campaign?.title || '—'}</td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency(payout.amount)}</td>
                                        <td className="px-4 py-3"><StatusPill status={payout.status === 'released' ? 'active' : payout.status === 'failed' || payout.status === 'cancelled' ? 'failed' : payout.status} label={payout.status} /></td>
                                        <td className="px-4 py-3 text-xs text-brand-gray">{formatWhen(payout.released_at || payout.release_at)}</td>
                                        {canManage && (
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    <button type="button" className="rounded-full bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={payoutAction.isPending || payout.status !== 'scheduled'} onClick={() => payoutAction.mutate({ id: payout.id, action: 'release' })}>Release</button>
                                                    <button type="button" className="rounded-full border border-[#ffd7c2] px-2.5 py-1 text-[11px] font-bold text-brand-orange disabled:cursor-not-allowed disabled:opacity-40" disabled={payoutAction.isPending || payout.status !== 'scheduled'} onClick={() => payoutAction.mutate({ id: payout.id, action: 'cancel' })}>Cancel</button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {!items.length && <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-sm text-brand-gray">No payouts yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
            {payoutAction.isError && <Notice>{getApiErrorMessage(payoutAction.error, 'Could not update that payout.')}</Notice>}
            {pages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <button type="button" className="rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Newer</button>
                    <span className="text-xs text-brand-gray">{page} of {pages}</span>
                    <button type="button" className="rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Older</button>
                </div>
            )}
        </div>
    );
}
