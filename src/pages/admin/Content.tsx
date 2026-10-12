import { useState } from 'react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminContent, useAdminOpsMutations } from '@/hooks/useAdminOps';
import { formatWhen, LoadingRow, Notice, PageHeader, Panel, StatusPill } from './adminUi';

export default function AdminContent() {
    const me = useAdminMe();
    const canManage = adminCan(me.data, 'CONTENT_MANAGE');
    const [page, setPage] = useState(1);
    const content = useAdminContent(page);
    const { cancelContent, removeContent } = useAdminOpsMutations();
    const items = content.data?.items || [];
    const pages = Math.max(1, Math.ceil((content.data?.total || 0) / 20));
    const busy = cancelContent.isPending || removeContent.isPending;

    return (
        <div className="space-y-5">
            <PageHeader title="Content" description="Reels creators prepared in Reel Studio." />
            <Panel>
                {content.isLoading ? <LoadingRow /> : content.isError ? <div className="p-4"><Notice>{getApiErrorMessage(content.error, 'Could not load content.')}</Notice></div> : (
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                            <tr>
                                <th className="px-4 py-3 font-bold">Creator</th>
                                <th className="px-4 py-3 font-bold">Caption</th>
                                <th className="px-4 py-3 font-bold">Status</th>
                                <th className="px-4 py-3 font-bold">Created</th>
                                {canManage && <th className="px-4 py-3 font-bold">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-brand-ink">{item.user?.name || 'Creator'}</p>
                                        <p className="text-xs text-brand-gray">{item.user?.email}</p>
                                    </td>
                                    <td className="max-w-xs px-4 py-3 text-xs text-brand-gray">{item.caption || '—'}</td>
                                    <td className="px-4 py-3"><StatusPill status={item.status === 'published' ? 'active' : item.status === 'failed' || item.status === 'cancelled' ? 'failed' : item.status} label={item.status} /></td>
                                    <td className="px-4 py-3 text-xs text-brand-gray">{formatWhen(item.createdAt)}</td>
                                    {canManage && (
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                {['draft', 'scheduled', 'failed', 'publishing'].includes(item.status) && (
                                                    <button type="button" className="rounded-full border border-[#ffd7c2] px-2.5 py-1 text-[11px] font-bold text-brand-orange disabled:opacity-40" disabled={busy} onClick={() => cancelContent.mutate(item.id)}>Cancel</button>
                                                )}
                                                <button type="button" className="rounded-full border border-red-100 px-2.5 py-1 text-[11px] font-bold text-red-500 disabled:opacity-40" disabled={busy} onClick={() => removeContent.mutate(item.id)}>Remove</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {!items.length && <tr><td colSpan={canManage ? 5 : 4} className="px-4 py-10 text-center text-sm text-brand-gray">No reels yet.</td></tr>}
                        </tbody>
                    </table>
                )}
            </Panel>
            {(cancelContent.isError || removeContent.isError) && <Notice>{getApiErrorMessage(cancelContent.error || removeContent.error, 'Could not update that reel.')}</Notice>}
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
