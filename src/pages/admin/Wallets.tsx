import { useState } from 'react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminOpsMutations, useAdminWallets } from '@/hooks/useAdminOps';
import { formatCurrency } from '@/hooks/useWallet';
import { fieldClass, LoadingRow, Modal, Notice, PageHeader, Panel, primaryButtonClass } from './adminUi';

export default function AdminWallets() {
    const me = useAdminMe();
    const canManage = adminCan(me.data, 'WALLET_MANAGE');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const wallets = useAdminWallets(page, search);
    const { adjustWallet } = useAdminOpsMutations();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ email: '', amount: '', direction: 'credit' as 'credit' | 'debit', description: '' });
    const [error, setError] = useState('');
    const items = wallets.data?.items || [];
    const pages = Math.max(1, Math.ceil((wallets.data?.total || 0) / 20));

    return (
        <div className="space-y-5">
            <PageHeader
                title="Wallets"
                description="Available balance can be changed. Money locked in a campaign stays locked."
                action={canManage ? <button type="button" className={primaryButtonClass} onClick={() => { setError(''); setOpen(true); }}>Adjust balance</button> : undefined}
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
            {open && (
                <Modal title="Adjust balance" onClose={() => !adjustWallet.isPending && setOpen(false)}>
                    <form className="space-y-3" onSubmit={(event) => {
                        event.preventDefault();
                        adjustWallet.mutate({ ...form, amount: Number(form.amount) }, {
                            onSuccess: () => setOpen(false),
                            onError: (err) => setError(getApiErrorMessage(err, 'Could not adjust this wallet.')),
                        });
                    }}>
                        {error && <Notice>{error}</Notice>}
                        <label className="block text-xs font-semibold text-[#5c6570]">Email
                            <input className={`${fieldClass} mt-1`} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Amount
                            <input className={`${fieldClass} mt-1`} inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Action
                            <select className={`${fieldClass} mt-1`} value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value as 'credit' | 'debit' })}>
                                <option value="credit">Add available balance</option>
                                <option value="debit">Remove available balance</option>
                            </select>
                        </label>
                        <label className="block text-xs font-semibold text-[#5c6570]">Note
                            <input className={`${fieldClass} mt-1`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                        </label>
                        <button type="submit" className={`${primaryButtonClass} w-full`} disabled={adjustWallet.isPending}>{adjustWallet.isPending ? 'Saving...' : 'Save'}</button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
