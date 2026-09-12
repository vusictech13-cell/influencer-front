import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export interface WalletSummary {
    balance: number;
    locked_balance: number;
    pending_balance: number;
    total_earned: number;
}

export interface WalletTransaction {
    id: number;
    type: string;
    amount: string;
    balance_after: string;
    description: string;
    reference_type?: string;
    reference_id?: string;
    createdAt: string;
}

export interface RazorpayOrder {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    prefill: { name: string; email: string };
}

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => { open: () => void };
    }
}

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export function useWallet(enabled = true) {
    return useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const res = await api.get('/wallet');
            return res.data.data as WalletSummary;
        },
        enabled,
    });
}

export function useWalletTransactions(enabled = true) {
    return useQuery({
        queryKey: ['wallet-transactions'],
        queryFn: async () => {
            const res = await api.get('/wallet/transactions');
            return res.data.data as WalletTransaction[];
        },
        enabled,
    });
}

export function useRazorpayTopup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (amount: number) => {
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error('Failed to load Razorpay checkout');

            const res = await api.post('/wallet/topup/order', { amount });
            const order = res.data.data as RazorpayOrder;

            return new Promise<void>((resolve, reject) => {
                const options = {
                    key: order.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'MeloTap',
                    description: 'Brand Wallet Top-up',
                    order_id: order.orderId,
                    prefill: order.prefill,
                    theme: { color: '#00B4EB' },
                    handler: async (response: {
                        razorpay_order_id: string;
                        razorpay_payment_id: string;
                        razorpay_signature: string;
                    }) => {
                        try {
                            await api.post('/wallet/topup/verify', response);
                            queryClient.invalidateQueries({ queryKey: ['wallet'] });
                            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    },
                    modal: {
                        ondismiss: () => reject(new Error('Payment cancelled')),
                    },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            });
        },
    });
}

export function formatCurrency(amount: number | string): string {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function getTransactionLabel(type: string): string {
    const labels: Record<string, string> = {
        topup: 'Wallet Top-up',
        campaign_lock: 'Campaign Budget Locked',
        campaign_refund: 'Campaign Refund',
        payout_debit: 'Creator Payout',
        payout_credit: 'Campaign Earnings',
    };
    return labels[type] || type;
}
