import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export interface AdminCreatorInstagram {
    id: number;
    platform: string;
    username: string;
    display_name?: string;
    profile_image?: string;
    followers_count?: number;
    following_count?: number;
    engagement_rate?: number;
    total_posts?: number;
    is_connected?: boolean;
    last_synced_at?: string;
    biography?: string;
    account_type?: string;
    score_status?: 'collecting' | 'ready' | 'provisional' | 'ineligible' | 'error';
    connected_at?: string;
}

export interface AdminCreator {
    id: number;
    name: string;
    email: string;
    profile_image?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    total_points: number;
    submissions_total: number;
    submissions_approved: number;
    instagram_followers: number;
    instagram?: AdminCreatorInstagram;
    rank?: {
        level: string;
        rank_score: number;
        rank_name?: string;
    };
    wallet?: {
        balance: number;
        locked_balance: number;
    };
}

export interface AdminListMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary?: Record<string, number>;
}

export type AdminCreatorStatusFilter = 'all' | 'active' | 'inactive';
export type AdminCreatorConnectedFilter = 'all' | 'connected' | 'not_connected';
export type AdminCreatorSortField = 'createdAt' | 'name' | 'followers' | 'points';
export type AdminSortOrder = 'asc' | 'desc';

export interface AdminCreatorsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: AdminCreatorStatusFilter;
    connected?: AdminCreatorConnectedFilter;
    sort?: AdminCreatorSortField;
    order?: AdminSortOrder;
}

export function useAdminCreators({
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    connected = 'all',
    sort = 'createdAt',
    order = 'desc',
}: AdminCreatorsParams) {
    return useQuery({
        queryKey: ['admin-creators', page, limit, search, status, connected, sort, order],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit, sort, order };
            if (search.trim()) params.search = search.trim();
            if (status !== 'all') params.status = status;
            if (connected !== 'all') params.connected = connected;

            const res = await api.get('/admin/creators', { params });
            return {
                creators: res.data.data as AdminCreator[],
                meta: res.data.meta as AdminListMeta,
            };
        },
    });
}

export interface AdminCreatorDetailSubmission {
    id: number;
    campaign_id: number;
    status: 'applied' | 'pending' | 'approved' | 'rejected';
    submission_url?: string;
    applied_at?: string;
    submitted_at?: string;
    approved_at?: string;
    payout_amount?: string | number;
    views?: number;
    campaign?: {
        id: number;
        title: string;
        brand_name?: string;
        campaign_type?: string;
        track_artwork_url?: string;
        status?: string;
        end_date?: string;
    };
    social_account?: {
        id: number;
        username: string;
        followers_count?: number;
    };
}

export interface AdminCreatorDetail {
    user: {
        id: number;
        name: string;
        email: string;
        profile_image?: string;
        status: 'active' | 'inactive';
        plan_id?: number | null;
        createdAt: string;
        updatedAt: string;
    };
    rank?: {
        level: string;
        rank_score: number;
        rank_name?: string;
    };
    instagram?: AdminCreatorInstagram;
    social_accounts: AdminCreatorInstagram[];
    wallet: {
        balance: number;
        locked_balance: number;
        pending_balance: number;
        total_earned: number;
    };
    stats: {
        total_points: number;
        submissions: {
            applied: number;
            pending: number;
            approved: number;
            rejected: number;
            all: number;
        };
    };
    recent_submissions: AdminCreatorDetailSubmission[];
    recent_points: {
        id: number;
        points: number;
        reason?: string;
        createdAt: string;
        campaign?: { id: number; title: string; brand_name?: string };
    }[];
    features: AdminCreatorFeature[];
}

export interface AdminCreatorFeature {
    id: number;
    key: string;
    name: string;
    description?: string | null;
    enabled: boolean;
}

export function useAdminCreatorDetail(id?: string) {
    return useQuery({
        queryKey: ['admin-creator', id],
        queryFn: async () => {
            const res = await api.get(`/admin/creators/${id}`);
            return res.data.data as AdminCreatorDetail;
        },
        enabled: !!id,
    });
}

export function useUpdateCreatorFeature(id?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
            const res = await api.patch(`/admin/creators/${id}/features/${key}`, { enabled });
            return res.data.data as AdminCreatorFeature;
        },
        onSuccess: (feature) => {
            queryClient.setQueryData(['admin-creator', id], (current: AdminCreatorDetail | undefined) => (
                current
                    ? {
                        ...current,
                        features: (current.features || []).map((item) => (item.key === feature.key ? feature : item)),
                    }
                    : current
            ));
        },
    });
}

export interface AdminCreatorScoreBadge {
    key: string;
    label: string;
    tone: 'green' | 'blue' | 'yellow';
}

export interface AdminCreatorScoreBreakdown {
    key: string;
    name: string;
    score: number | null;
}

export interface AdminCreatorScore {
    overall: number | null;
    status?: 'collecting' | 'ready' | 'provisional' | 'ineligible' | 'error';
    score_version?: string;
    rising_score?: number | null;
    peer_tier?: string;
    peer_count?: number;
    label: string;
    percentile_label: string;
    description: string;
    badges: AdminCreatorScoreBadge[];
    breakdown: AdminCreatorScoreBreakdown[];
    audience: {
        avg_reach: number | null;
        avg_reach_change?: string | null;
        engagement_rate: number | null;
        engagement_change?: string | null;
        avg_reel_views: number | null;
        avg_reel_views_change?: string | null;
        non_follower_reach_pct?: number | null;
        non_follower_note?: string | null;
    };
    engagement: {
        like_rate: number | null;
        comment_rate: number | null;
        save_rate?: number | null;
        share_rate?: number | null;
        weighted_er?: number | null;
    };
    consistency: {
        title?: string;
        median_reel_views: number | null;
        median_vs_average_pct?: number | null;
        median_note?: string | null;
        above_baseline_pct: number | null;
        baseline_note?: string | null;
        growth_30d_pct?: number | null;
        growth_note?: string | null;
        posts_per_week: number;
    };
}

export interface AdminCreatorInsightsData {
    creator: {
        id: number;
        name: string;
        email: string;
        profile_image?: string;
    };
    account: {
        id: number;
        username: string;
        last_synced_at?: string;
    };
    profile: {
        name: string;
        username: string;
        profile_picture_url?: string;
        followers_count: number;
        follows_count?: number;
        media_count?: number;
        biography?: string;
    };
    reels_stats: {
        total: number;
        '>1k': number;
        '>10k': number;
        '>100k': number;
        '>1m': number;
        '>10m': number;
    };
    top_posts: {
        id: string;
        caption?: string;
        media_url?: string;
        thumbnail_url?: string;
        permalink?: string;
        like_count?: number;
        comments_count?: number;
        saved?: number | null;
        shares?: number | null;
        reach?: number | null;
        timestamp?: string;
        views?: number | null;
    }[];
    engagement_rate: number | null;
    influencer_score: number | null;
    creator_score?: AdminCreatorScore;
    eligible?: boolean;
    account_type?: string;
    adv_stats?: {
        avgLikes: number;
        avgComments: number;
        postsPerDay: number;
        postsPerWeek: number;
    };
}

export interface AdminCompareProfile {
    id: number;
    name: string;
    email: string;
    profile_image?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    total_points: number;
    submissions_total: number;
    submissions_approved: number;
    instagram?: AdminCreatorInstagram | null;
    rank?: {
        level: string;
        rank_score: number;
        rank_name?: string;
    } | null;
    creator_score?: AdminCreatorScore | null;
    score_calculated_at?: string | null;
}

export function useAdminCreatorCompare(ids: number[]) {
    const unique = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0).slice(0, 4);

    return useQuery({
        queryKey: ['admin-creator-compare', unique],
        queryFn: async () => {
            const res = await api.get('/admin/creators/compare', {
                params: { ids: unique.join(',') },
            });
            return res.data.data as AdminCompareProfile[];
        },
        enabled: unique.length >= 1,
        staleTime: 60 * 1000,
    });
}

export function useAdminCreatorInsights(creatorId?: string) {
    return useQuery({
        queryKey: ['admin-creator-insights', creatorId],
        queryFn: async () => {
            const res = await api.post(`/admin/creators/${creatorId}/insights`);
            return res.data.data as AdminCreatorInsightsData;
        },
        enabled: !!creatorId,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}
