import { useState } from 'react';
import { message } from 'antd';
import { Wallet, Lock, Plus, Loader2, ArrowUpRight } from 'lucide-react';
import { useWallet, useWalletTransactions, useRazorpayTopup, formatCurrency, getTransactionLabel } from '@/hooks/useWallet';

export default function BrandWallet() {
    const [amount, setAmount] = useState('5000');
    const { data: wallet, isLoading } = useWallet();
    const { data: transactions, isLoading: txLoading } = useWalletTransactions();
    const { mutate: topup, isPending: toppingUp } = useRazorpayTopup();

    const handleTopup = () => {
        const value = Number(amount);
        if (!value || value < 100) {
            message.error('Minimum top-up amount is ₹100');
            return;
        }

        topup(value, {
            onSuccess: () => message.success('Wallet topped up successfully!'),
            onError: (error: Error) => message.error(error.message || 'Top-up failed'),
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Brand Wallet</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Add funds via Razorpay before creating campaigns. Campaign budgets are locked from your wallet.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Wallet size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Available Balance</span>
                    </div>
                    {isLoading ? (
                        <Loader2 className="animate-spin text-[#00B4EB]" size={24} />
                    ) : (
                        <p className="text-4xl font-semibold text-gray-900">{formatCurrency(wallet?.balance ?? 0)}</p>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Lock size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Locked in Campaigns</span>
                    </div>
                    {isLoading ? (
                        <Loader2 className="animate-spin text-[#00B4EB]" size={24} />
                    ) : (
                        <p className="text-4xl font-semibold text-amber-600">{formatCurrency(wallet?.locked_balance ?? 0)}</p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Add Money via Razorpay</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                        <input
                            type="number"
                            min={100}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B4EB]"
                            placeholder="Enter amount"
                        />
                    </div>
                    <button
                        onClick={handleTopup}
                        disabled={toppingUp}
                        className="px-6 py-3 bg-[#00B4EB] hover:bg-[#009fd4] disabled:opacity-60 text-gray-900 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                        {toppingUp ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Add Funds
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">Minimum top-up: ₹100. Secured by Razorpay.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 px-4 pt-4 pb-2">Recent Transactions</h2>
                {txLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-[#00B4EB]" />
                    </div>
                ) : !transactions?.length ? (
                    <p className="text-sm text-gray-500 text-center py-8">No transactions yet.</p>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="px-4 py-3 flex items-center justify-between border-b border-gray-50 last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{getTransactionLabel(tx.type)}</p>
                                <p className="text-[10px] text-gray-400">{tx.description}</p>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-semibold flex items-center gap-1 ${tx.type === 'topup' || tx.type === 'campaign_refund' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                    {tx.type === 'topup' || tx.type === 'campaign_refund' ? '+' : '-'}
                                    {formatCurrency(tx.amount)}
                                    <ArrowUpRight size={12} />
                                </p>
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
