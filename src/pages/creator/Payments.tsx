import { Wallet, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useWallet, useWalletTransactions, formatCurrency, getTransactionLabel } from '@/hooks/useWallet';

export default function CreatorPayments() {
    const { data: wallet, isLoading } = useWallet();
    const { data: transactions, isLoading: txLoading } = useWalletTransactions();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Payments</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Earnings are credited to your wallet 48 hours after brand verification.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <Wallet size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Available Balance</span>
                    </div>
                    {isLoading ? (
                        <Loader2 className="animate-spin text-[#00B4EB]" size={24} />
                    ) : (
                        <p className="text-3xl font-semibold text-gray-900">{formatCurrency(wallet?.balance ?? 0)}</p>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <Clock size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Pending (48hr hold)</span>
                    </div>
                    {isLoading ? (
                        <Loader2 className="animate-spin text-[#00B4EB]" size={24} />
                    ) : (
                        <p className="text-3xl font-semibold text-amber-600">{formatCurrency(wallet?.pending_balance ?? 0)}</p>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-[#00B4EB] mb-2">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Total Earned</span>
                    </div>
                    {isLoading ? (
                        <Loader2 className="animate-spin text-[#00B4EB]" size={24} />
                    ) : (
                        <p className="text-3xl font-semibold text-gray-900">{formatCurrency(wallet?.total_earned ?? 0)}</p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 px-4 pt-4 pb-2">Transaction History</h2>
                {txLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-[#00B4EB]" />
                    </div>
                ) : !transactions?.length ? (
                    <p className="text-sm text-gray-500 text-center py-8">No payments yet. Complete campaigns to start earning.</p>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{getTransactionLabel(tx.type)}</p>
                                <p className="text-[10px] text-gray-400">{tx.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(tx.amount)}</p>
                                <p className="text-[10px] text-gray-400">
                                    {new Date(tx.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
