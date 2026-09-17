import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';

export interface BrandSubmission {
    id: number;
    campaign_id: number;
    submission_url: string;
    status: 'pending' | 'approved' | 'rejected';
    payout_amount?: number;
    submitted_at?: string;
    approved_at?: string;
    views?: number;
    sound_verified?: boolean;
    detected_audio_title?: string | null;
    detected_audio_artist?: string | null;
    campaign?: { id: number; title: string; track_artwork_url?: string; brand_name?: string };
    user?: { id: number; name: string; email: string };
    social_account?: {
        id: number;
        username: string;
        display_name: string;
        followers_count: number;
        platform: string;
    };
    payout_schedule?: { release_at: string; status: string; amount: number };
}

export interface SubmissionListMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    counts: {
        pending: number;
        approved: number;
        rejected: number;
        all: number;
    };
}

export type SubmissionStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
export type SubmissionSortField = 'submitted_at' | 'approved_at';
export type SubmissionSortOrder = 'asc' | 'desc';

export interface SubmissionListParams {
    campaignId: number | string;
    page?: number;
    limit?: number;
    status?: SubmissionStatusFilter;
    sort?: SubmissionSortField;
    order?: SubmissionSortOrder;
    dateFrom?: string;
    dateTo?: string;
}

export function useCampaignSubmissions({
    campaignId,
    page = 1,
    limit = 10,
    status = 'all',
    sort = 'submitted_at',
    order = 'desc',
    dateFrom,
    dateTo,
}: SubmissionListParams) {
    return useQuery({
        queryKey: ['campaign-submissions', campaignId, page, limit, status, sort, order, dateFrom, dateTo],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit, sort, order };
            if (status !== 'all') params.status = status;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const res = await api.get(`/submissions/campaign/${campaignId}`, { params });
            return {
                submissions: res.data.data as BrandSubmission[],
                meta: res.data.meta as SubmissionListMeta,
            };
        },
        enabled: !!campaignId,
    });
}
