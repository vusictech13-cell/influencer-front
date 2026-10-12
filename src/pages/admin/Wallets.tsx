import { useState } from 'react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminWallets } from '@/hooks/useAdminOps';
import { formatCurrency } from '@/hooks/useWallet';
import { fieldClass, LoadingRow, Notice, PageHeader, Panel, primaryButtonClass } from './adminUi';

export default function AdminWallets() {
    const me = useAdminMe();
    const canManage = adminCan(me.data, 'WALLET_MANAGE');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const wallets = useAdminWallets(page, search);
    const items = wallets.data?.items || [];
    const pages = Math.max(1, Math.ceil((wallets.data?.total || 0) / 20));

    return (
        <div className="space-y-5">
            <PageHeader
                title="Wallets"
                description="Available balance can be changed. Money locked in a campaign stays locked."
                action={canManage ? (
                    <div className="flex flex-col items-end">
                        <button type="button" className={`${primaryButtonClass} disabled:cursor-not-allowed`} disabled>Adjust balance</button>
                        <p className="mt-1 text-[11px] font-medium text-brand-gray">Coming soon</p>
                    </div>
                ) : undefined}
            />
            <input className={`${fieldClass} max-w-sm`} placeholder="Search name or email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            <Panel>
                {wallets.isLoading ? <LoadingRow /> : wallets.isError ? <div className="p-4"><Notice>{getApiErrorMessage(wallets.error, 'Could not load wallets.')}</Notice></div> : (
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                            <tr>
                                <th className="px-4 py-3 font-bold">Account</th>
                                <th className="px-4 py-3 font-bold">Role</th>
                                <th className="px-4 py-3 font-bold">Available</th>
                                <th className="px-4 py-3 font-bold">Locked</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((wallet) => (
                                <tr key={wallet.id} className="border-b border-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-brand-ink">{wallet.user?.name}</p>
                                        <p className="text-xs text-brand-gray">{wallet.user?.email}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs capitalize">{wallet.user?.role}</td>
                                    <td className="px-4 py-3 font-semibold">{formatCurrency(wallet.balance)}</td>
                                    <td className="px-4 py-3 text-xs text-brand-gray">{formatCurrency(wallet.locked_balance)}</td>
                                </tr>
                            ))}
                            {!items.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-brand-gray">No wallets found.</td></tr>}
                        </tbody>
                    </table>
                )}
            </Panel>
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
