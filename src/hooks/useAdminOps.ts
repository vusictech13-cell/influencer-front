import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

type Page<T> = { items: T[]; page: number; limit: number; total: number };

export type AdminCampaign = {
    id: number;
    title: string;
    description?: string | null;
    campaign_type: string;
    brand_name?: string | null;
    status: 'draft' | 'active' | 'completed' | 'paused';
    total_budget: number;
    spent_budget: number;
    start_date: string;
    end_date: string;
    owner: { id: number; name: string; email: string } | null;
};

export type AdminPayment = {
    id: number;
    amount: number;
    description?: string | null;
    createdAt: string;
    user: { id: number; name: string; email: string; role: string } | null;
};

export type AdminPayout = {
    id: number;
    amount: number;
    status: 'scheduled' | 'released' | 'cancelled' | 'failed';
    release_at: string;
    released_at?: string | null;
    creator: { name: string; email: string } | null;
    brand: { name: string; email: string } | null;
    campaign: { id: number; title: string } | null;
};

export type AdminWalletRow = {
    id: number;
    balance: number;
    locked_balance: number;
    user: { id: number; name: string; email: string; role: string; status: string };
};

export type AdminContentRow = {
    id: number;
    caption?: string | null;
    status: string;
    createdAt: string;
    user: { id: number; name: string; email: string } | null;
};

export type AdminSessionRow = {
    sessionId: string;
    deviceName?: string | null;
    browser?: string | null;
    os?: string | null;
    location?: string | null;
    ipAddress?: string | null;
    lastActiveAt?: string | null;
    isCurrent: boolean;
};

function usePage<T>(key: string, path: string, page: number, extra: Record<string, string> = {}) {
    return useQuery({
        queryKey: [key, page, extra],
        queryFn: async () => {
            const response = await api.get(path, { params: { page, limit: 20, ...extra } });
            return response.data.data as Page<T>;
        },
    });
}

export function useAdminCampaigns(page: number, status = '') {
    return usePage<AdminCampaign>('admin-campaigns', '/admin/campaigns', page, status ? { status } : {});
}

export function useAdminPayments(page: number) {
    return usePage<AdminPayment>('admin-payments', '/admin/payments', page);
}

export function useAdminPayouts(page: number, status = '') {
    return usePage<AdminPayout>('admin-payouts', '/admin/payouts', page, status ? { status } : {});
}

export function useAdminWallets(page: number, search: string) {
    return usePage<AdminWalletRow>('admin-wallets', '/admin/wallets', page, search.trim() ? { search: search.trim() } : {});
}

export function useAdminContent(page: number) {
    return usePage<AdminContentRow>('admin-content', '/admin/content', page);
}

export type ReportRange = { from?: string; to?: string };

export function useAdminReport(range: ReportRange = {}) {
    return useQuery({
        queryKey: ['admin-report', range.from || '', range.to || ''],
        queryFn: async () => {
            const response = await api.get('/admin/reports', {
                params: {
                    from: range.from || undefined,
                    to: range.to || undefined,
                },
            });
            return response.data.data as {
                creators: number;
                brands: number;
                campaigns: number;
                payments: number;
                payouts: number;
                wallets: number;
            };
        },
    });
}

export function useAdminOpsMutations() {
    const queryClient = useQueryClient();
    const refresh = (key: string) => queryClient.invalidateQueries({ queryKey: [key] });

    const createCampaign = useMutation({
        mutationFn: async (body: { title: string; campaign_type: string; brand_user_id: number; start_date: string; end_date: string; description?: string; brand_name?: string }) => {
            await api.post('/admin/campaigns', body);
        },
        onSuccess: () => refresh('admin-campaigns'),
    });
    const updateCampaign = useMutation({
        mutationFn: async (body: { id: number; title: string; description: string; brand_name: string; end_date: string }) => {
            await api.patch(`/admin/campaigns/${body.id}`, body);
        },
        onSuccess: () => refresh('admin-campaigns'),
    });
    const setCampaignStatus = useMutation({
        mutationFn: async ({ id, action }: { id: number; action: 'approve' | 'reject' }) => {
            await api.post(`/admin/campaigns/${id}/status`, { action });
        },
        onSuccess: () => refresh('admin-campaigns'),
    });
    const deleteCampaign = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/admin/campaigns/${id}`);
        },
        onSuccess: () => refresh('admin-campaigns'),
    });
    const recordPayment = useMutation({
        mutationFn: async (body: { email: string; amount: number; description: string }) => {
            await api.post('/admin/payments', body);
        },
        onSuccess: () => refresh('admin-payments'),
    });
    const payoutAction = useMutation({
        mutationFn: async ({ id, action }: { id: number; action: 'release' | 'cancel' }) => {
            await api.post(`/admin/payouts/${id}/${action}`, {});
        },
        onSuccess: () => refresh('admin-payouts'),
    });
    const adjustWallet = useMutation({
        mutationFn: async (body: { email: string; amount: number; direction: 'credit' | 'debit'; description: string }) => {
            await api.post('/admin/wallets/adjust', body);
        },
        onSuccess: () => refresh('admin-wallets'),
    });
    const cancelContent = useMutation({
        mutationFn: async (id: number) => {
            await api.post(`/admin/content/${id}/cancel`, {});
        },
        onSuccess: () => refresh('admin-content'),
    });
    const removeContent = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/admin/content/${id}`);
        },
        onSuccess: () => refresh('admin-content'),
    });

    return {
        createCampaign,
        updateCampaign,
        setCampaignStatus,
        deleteCampaign,
        recordPayment,
        payoutAction,
        adjustWallet,
        cancelContent,
        removeContent,
    };
}

export async function searchCampaignBrands(search: string) {
    const response = await api.get('/admin/campaigns/brands', { params: { search } });
    return response.data.data as { id: number; name: string; email: string }[];
}

export type ReportFormat = 'xlsx' | 'csv' | 'pdf';

export async function downloadReport(kind: string, range: ReportRange = {}, format: ReportFormat = 'xlsx') {
    const response = await api.get('/admin/reports/export', {
        params: { kind, format, from: range.from || undefined, to: range.to || undefined },
        responseType: 'blob',
    });
    const disposition = String(response.headers['content-disposition'] || '');
    const named = /filename="([^"]+)"/.exec(disposition)?.[1];
    const extension = format === 'xlsx' ? 'xlsx' : format;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = named || `${kind}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
}

export function useOwnerSessions(owner: 'user' | 'admin', id?: number, enabled = true) {
    return useQuery({
        queryKey: ['admin-sessions', owner, id],
        enabled: enabled && !!id,
        queryFn: async () => {
            const path = owner === 'user' ? `/admin/users/${id}/sessions` : `/admin/admins/${id}/sessions`;
            const response = await api.get(path);
            return response.data.data as AdminSessionRow[];
        },
    });
}

export function useRevokeOwnerSession(owner: 'user' | 'admin', id?: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sessionId: string) => {
            const path = owner === 'user'
                ? `/admin/users/${id}/sessions/${sessionId}`
                : `/admin/admins/${id}/sessions/${sessionId}`;
            await api.delete(path);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sessions', owner, id] }),
    });
}
