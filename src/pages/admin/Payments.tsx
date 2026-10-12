import { useState } from 'react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminPayments } from '@/hooks/useAdminOps';
import { formatCurrency } from '@/hooks/useWallet';
import { formatWhen, LoadingRow, Notice, PageHeader, Panel, primaryButtonClass } from './adminUi';

export default function AdminPayments() {
    const me = useAdminMe();
    const canManage = adminCan(me.data, 'PAYMENT_MANAGE');
    const [page, setPage] = useState(1);
    const payments = useAdminPayments(page);
    const items = payments.data?.items || [];
    const pages = Math.max(1, Math.ceil((payments.data?.total || 0) / 20));

    return (
        <div className="space-y-5">
            <PageHeader
                title="Payments"
                description="Wallet top-ups recorded for creators and brands."
                action={canManage ? (
                    <div className="flex flex-col items-end">
                        <button type="button" className={`${primaryButtonClass} disabled:cursor-not-allowed`} disabled>Record top-up</button>
                        <p className="mt-1 text-[11px] font-medium text-brand-gray">Coming soon</p>
                    </div>
                ) : undefined}
            />
            <Panel>
                {payments.isLoading ? <LoadingRow /> : payments.isError ? <div className="p-4"><Notice>{getApiErrorMessage(payments.error, 'Could not load payments.')}</Notice></div> : (
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                            <tr>
                                <th className="px-4 py-3 font-bold">Account</th>
                                <th className="px-4 py-3 font-bold">Amount</th>
                                <th className="px-4 py-3 font-bold">Note</th>
                                <th className="px-4 py-3 font-bold">When</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((payment) => (
                                <tr key={payment.id} className="border-b border-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-brand-ink">{payment.user?.name || 'Account'}</p>
                                        <p className="text-xs text-brand-gray">{payment.user?.email}</p>
                                    </td>
                                    <td className="px-4 py-3 font-semibold">{formatCurrency(payment.amount)}</td>
                                    <td className="px-4 py-3 text-xs text-brand-gray">{payment.description || '—'}</td>
                                    <td className="px-4 py-3 text-xs text-brand-gray">{formatWhen(payment.createdAt)}</td>
                                </tr>
                            ))}
                            {!items.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-brand-gray">No top-ups yet.</td></tr>}
                        </tbody>
                    </table>
                )}
            </Panel>
            {pages > 1 && <Pager page={page} pages={pages} setPage={setPage} />}
        </div>
    );
}

function Pager({ page, pages, setPage }: { page: number; pages: number; setPage: (value: number | ((current: number) => number)) => void }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <button type="button" className="rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Newer</button>
            <span className="text-xs text-brand-gray">{page} of {pages}</span>
            <button type="button" className="rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-40" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}>Older</button>
        </div>
    );
}
