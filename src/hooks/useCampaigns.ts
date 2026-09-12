import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export interface RankAllocation {
    rank: number;
    range: string;
    payout: number;
    qty: number;
    color: string;
}

export interface Campaign {
    id: number;
    title: string;
    description: string;
    campaign_type: string;
    brand_name: string;
    genre: string;
    spotify_link?: string;
    hashtags?: string;
    track_artwork_url?: string;
    rank_allocations: RankAllocation[];
    status: string;
    start_date: string;
    end_date: string;
}

export interface CampaignSubmission {
    id: number;
    campaign_id: number;
    views: number;
    payout_amount?: number;
    status: 'applied' | 'pending' | 'approved' | 'rejected';
    submission_url?: string;
    applied_at?: string;
    submitted_at?: string;
    approved_at?: string;
    createdAt: string;
    campaign?: Campaign;
}

const RANK_BG_COLORS = ['bg-[#FF5A5F]', 'bg-[#FFA542]', 'bg-[#FBBF24]', 'bg-[#00B4EB]'];

export function getPayoutForRank(campaign: Campaign | undefined, userRank: number): number {
    const allocation = campaign?.rank_allocations?.find((r) => r.rank === userRank);
    return allocation?.payout ?? 0;
}

export function getCampaignColor(campaign: Campaign, userRank: number): string {
    const allocation = campaign.rank_allocations?.find((r) => r.rank === userRank);
    if (allocation?.color) {
        const bgMatch = allocation.color.match(/bg-\S+/);
        if (bgMatch) return bgMatch[0];
    }
    return RANK_BG_COLORS[userRank - 1] ?? RANK_BG_COLORS[3];
}

export function useCampaigns() {
    return useQuery({
        queryKey: ['campaigns'],
        queryFn: async () => {
            const res = await api.get('/campaigns');
            return res.data.data as Campaign[];
        },
    });
}

export function useCampaign(id: number | string | undefined) {
    return useQuery({
        queryKey: ['campaign', id],
        queryFn: async () => {
            const res = await api.get(`/campaigns/${id}`);
            return res.data.data as Campaign;
        },
        enabled: !!id,
    });
}

export function useMySubmissions() {
    return useQuery({
        queryKey: ['my-submissions'],
        queryFn: async () => {
            const res = await api.get('/submissions/mine');
            return res.data.data as CampaignSubmission[];
        },
    });
}

export function useApplyCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { campaign_id: number; social_account_id: number }) => {
            const res = await api.post('/submissions/apply', payload);
            return res.data.data as CampaignSubmission;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
        },
    });
}

export function useSubmitCampaignUrl() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { submissionId: number; submission_url: string }) => {
            const res = await api.patch(`/submissions/${payload.submissionId}/submit`, {
                submission_url: payload.submission_url,
            });
            return res.data.data as CampaignSubmission;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
        },
    });
}

export interface CreatorEarnings {
    totalEarned: number;
    balance: number;
    pendingBalance: number;
    lockedBalance?: number;
}

export function useCreatorEarnings(enabled = true) {
    return useQuery({
        queryKey: ['creator-earnings'],
        queryFn: async () => {
            const res = await api.get('/analytics/earnings');
            return res.data.data as CreatorEarnings;
        },
        enabled,
    });
}
