import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import type { AdminSortOrder } from '@/hooks/useAdminCreators'; 

export interface AdminBrand {
    id: number;
    name: string;
    email: string;
    profile_image?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    campaigns_total: number;
    campaigns_active: number;
    total_spent: number;
    wallet_balance: number;
    wallet_locked: number;
    wallet?: {
        balance: number;
        locked_balance: number;
    };
}

export interface AdminBrandsMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary?: {
        total: number;
        active: number;
        inactive: number;
        total_spent: number;
        active_campaigns: number;
    };
}

export type AdminBrandStatusFilter = 'all' | 'active' | 'inactive';
export type AdminBrandSortField = 'createdAt' | 'name' | 'balance' | 'spent' | 'campaigns';

export interface AdminBrandsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdminBrandStatusFilter;
    sort?: AdminBrandSortField;
    order?: AdminSortOrder;
}

export function useAdminBrands({
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    sort = 'createdAt',
    order = 'desc',
}: AdminBrandsParams) {
    return useQuery({
        queryKey: ['admin-brands', page, limit, search, status, sort, order],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit, sort, order };
            if (search.trim()) params.search = search.trim();
            if (status !== 'all') params.status = status;

            const res = await api.get('/admin/brands', { params });
            return {
                brands: res.data.data as AdminBrand[],
                meta: res.data.meta as AdminBrandsMeta,
            };
        },
    });
}

export interface AdminBrandCampaign {
    id: number;
    title: string;
    brand_name?: string;
    campaign_type: string;
    status: 'active' | 'draft' | 'completed' | 'paused';
    total_budget: string | number;
    spent_budget: string | number;
    start_date: string;
    end_date: string;
    track_artwork_url?: string;
    submission_stats?: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
}

export interface AdminBrandDetail {
    user: {
        id: number;
        name: string;
        email: string;
        profile_image?: string;
        status: 'active' | 'inactive';
        createdAt: string;
        updatedAt: string;
    };
    wallet: {
        balance: number;
        locked_balance: number;
    };
    campaignCounts: {
        active: number;
        draft: number;
        completed: number;
        paused: number;
        all: number;
    };
    total_spent: number;
    pending_submissions_count: number;
    recent_campaigns: AdminBrandCampaign[];
    recent_transactions: {
        id: number;
        type: string;
        amount: string | number;
        description?: string;
        createdAt: string;
    }[];
    recent_pending: {
        id: number;
        campaign_id: number;
        submission_url?: string;
        submitted_at?: string;
        campaign?: { id: number; title: string; track_artwork_url?: string; brand_name?: string };
        user?: { id: number; name: string; email: string };
        social_account?: { id: number; username: string; followers_count?: number };
    }[];
}

export function useAdminBrandDetail(id?: string) {
    return useQuery({
        queryKey: ['admin-brand', id],
        queryFn: async () => {
            const res = await api.get(`/admin/brands/${id}`);
            return res.data.data as AdminBrandDetail;
        },
        enabled: !!id,
    });
}
