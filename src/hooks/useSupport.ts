import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export type SupportFaq = {
    id: number;
    category: string;
    question: string;
    answer: string;
    sort_order: number;
    is_active: boolean;
};

export type SupportMessage = {
    id: number;
    ticket_id: number;
    sender_id: number | null;
    sender_role: 'creator' | 'admin' | 'bot' | 'system';
    body: string;
    attachments?: unknown;
    createdAt: string;
    sender?: {
        id: number;
        name: string;
        role: string;
        profile_image?: string | null;
    } | null;
};

export type SupportTicket = {
    id: number;
    ticket_code: string;
    creator_id: number;
    assigned_admin_id: number | null;
    topic: string;
    subject: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high';
    metadata?: Record<string, unknown> | null;
    resolved_at?: string | null;
    createdAt: string;
    updatedAt: string;
    creator?: {
        id: number;
        name: string;
        email: string;
        profile_image?: string | null;
    };
    assigned_admin?: {
        id: number;
        name: string;
        email: string;
    } | null;
    last_message?: SupportMessage;
    messages?: SupportMessage[];
};

export const SUPPORT_TOPICS = [
    {
        key: 'Campaigns & collaborations',
        title: 'Campaigns',
        subtitle: 'Applications, gifts & status',
        icon: '🤝',
    },
    {
        key: 'Payments & earnings',
        title: 'Payments & earnings',
        subtitle: 'Payouts, 48h hold & wallet',
        icon: '₹',
    },
    {
        key: 'Instagram / social account',
        title: 'Social account',
        subtitle: 'Connect, sync & verification',
        icon: '◎',
    },
    {
        key: 'Profile & creator account',
        title: 'Profile & account',
        subtitle: 'Profile, rates & access',
        icon: '👤',
    },
    {
        key: 'Content & deliverables',
        title: 'Content & sound',
        subtitle: 'Submit reel & verification',
        icon: '▣',
    },
    {
        key: 'Technical issue',
        title: 'Technical issue',
        subtitle: 'App, errors & bugs',
        icon: '⚙',
    },
] as const;

export const BOT_RESPONSES: Record<string, { text: string; choices: string[] }> = {
    'Campaigns & collaborations': {
        text: 'Sure. What do you need help with?',
        choices: ['Campaign application', 'Campaign status', 'Gift / payout amount', 'Something else'],
    },
    'Payments & earnings': {
        text: 'I can help with payments and earnings. What is the issue?',
        choices: ['Payment pending (48h hold)', 'Payment not received', 'Payout amount question', 'Wallet issue'],
    },
    'Instagram / social account': {
        text: "Let's troubleshoot your social account. What are you facing?",
        choices: ["Account won't connect", 'Data is not syncing', 'Professional account required', 'Reconnect account'],
    },
    'Profile & creator account': {
        text: 'What would you like to manage?',
        choices: ['Edit profile', 'Rates / media kit', 'Account access', 'Onboarding'],
    },
    'Content & deliverables': {
        text: 'I can help with content submission. Choose an issue:',
        choices: ['Submit reel URL', 'Sound verification failed', 'Under review / approval', 'Something else'],
    },
    'Technical issue': {
        text: "Let's diagnose the issue. Choose a common issue or describe it:",
        choices: ['App error', 'Page not loading', 'Button not working', 'Other technical issue'],
    },
};

export const BOT_ANSWERS: Record<string, string> = {
    'Campaign application':
        'Open Home or Brands, pick a gift/campaign, connect Instagram if needed, then Apply. Status becomes In Progress. Need more help? Create an admin support request.',
    'Campaign status':
        'In Progress = applied. Under Review = sound verified, brand reviewing. Approved = payout scheduled (48h hold). Rejected = no payout for that submission. Check Campaigns for details.',
    'Gift / payout amount':
        'Gift amount depends on your Vusic follower rank and the campaign rank allocations shown on the campaign page.',
    'Payment pending (48h hold)':
        'After brand approval, earnings stay Pending for 48 hours, then move to Available in Earnings. If it is past 48 hours, create an admin support request.',
    'Payment not received':
        'Confirm the submission is Approved under Campaigns, then check Earnings → Pending vs Available. If approved and past 48 hours with no credit, escalate to admin.',
    'Payout amount question':
        'Payout is based on your follower rank band for that campaign. Open the campaign details to see rank allocations.',
    'Wallet issue':
        'Open Earnings to see Available, Pending (48h), and history. If a transaction looks wrong, create an admin support request with the campaign name.',
    "Account won't connect":
        'Use an Instagram Professional (Business/Creator) account in Settings. If connect fails, try reconnecting or contact admin with a screenshot.',
    'Data is not syncing':
        'Reconnect Instagram in Settings. Insights refresh after reconnect. If still empty, escalate to admin.',
    'Professional account required':
        'TapnLike needs Instagram Business or Creator. Switch account type in Instagram, then reconnect in Settings.',
    'Reconnect account':
        'Go to Settings → Instagram and reconnect. Meta/Facebook is only required for Reel Studio and bulk publish.',
    'Edit profile':
        'Open Profile to update bio, categories, and rates. Stronger profiles get better campaign matches.',
    'Rates / media kit':
        'Add rates on Profile and complete Media kit to unlock higher-value matches.',
    'Account access':
        'Use Login with your email/Google. For OTP or locked access issues, create an admin support request.',
    Onboarding:
        'Finish onboarding (Instagram, categories, rates) to unlock campaigns. You can update details later in Profile/Settings.',
    'Submit reel URL':
        'Post a reel with the official campaign sound, then paste the Instagram Reel URL on the campaign page. Sound must match before brand review.',
    'Sound verification failed':
        'Check: valid reel URL, reel is on your connected account, and audio matches the campaign Spotify track. Fix and resubmit, or escalate with the campaign ID.',
    'Under review / approval':
        'Under Review means sound passed and the brand is deciding. You’ll see Approved or Rejected on Campaigns. Payout starts only after Approved.',
    'App error':
        'Try refresh and hard reload. Note the page URL and what you clicked. Create an admin request if it keeps happening.',
    'Page not loading':
        'Check your network, then try again. If one page always fails, create an admin request with the URL.',
    'Button not working':
        'Refresh once. If a specific button still fails (Apply, Submit, Publish), escalate with the page name.',
    'Other technical issue':
        'Describe what you expected vs what happened. You can create an admin support request for manual help.',
};

export function useSupportFaqs() {
    return useQuery({
        queryKey: ['support', 'faqs'],
        queryFn: async () => {
            const res = await api.get('/support/faqs');
            return (res.data.data || []) as SupportFaq[];
        },
    });
}

export function useMySupportTickets() {
    return useQuery({
        queryKey: ['support', 'tickets', 'mine'],
        queryFn: async () => {
            const res = await api.get('/support/tickets');
            return (res.data.data || []) as SupportTicket[];
        },
    });
}

export function useSupportTicket(ticketId?: number | null) {
    return useQuery({
        queryKey: ['support', 'tickets', ticketId],
        enabled: Boolean(ticketId),
        queryFn: async () => {
            const res = await api.get(`/support/tickets/${ticketId}`);
            return res.data.data as SupportTicket;
        },
    });
}

export function useCreateSupportTicket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            topic: string;
            subject?: string;
            message: string;
            metadata?: Record<string, unknown>;
            attachments?: Array<Record<string, unknown>>;
        }) => {
            const res = await api.post('/support/tickets', payload);
            return res.data.data as SupportTicket;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
        },
    });
}

export function useSendSupportMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            ticketId: number;
            message: string;
            attachments?: Array<Record<string, unknown>>;
        }) => {
            const res = await api.post(`/support/tickets/${payload.ticketId}/messages`, {
                message: payload.message,
                attachments: payload.attachments,
            });
            return res.data.data as { message: SupportMessage; ticket: SupportTicket };
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['support', 'tickets', variables.ticketId] });
            queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
        },
    });
}

export function useAdminSupportTickets(status = 'all') {
    return useQuery({
        queryKey: ['support', 'admin', 'tickets', status],
        queryFn: async () => {
            const res = await api.get('/support/admin/tickets', {
                params: status === 'all' ? undefined : { status },
            });
            return (res.data.data || []) as SupportTicket[];
        },
    });
}

export function useAdminUpdateTicketStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { ticketId: number; status: SupportTicket['status'] }) => {
            const res = await api.patch(`/support/admin/tickets/${payload.ticketId}`, {
                status: payload.status,
            });
            return res.data.data as SupportTicket;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support'] });
        },
    });
}

export function useAdminFaqs() {
    return useQuery({
        queryKey: ['support', 'admin', 'faqs'],
        queryFn: async () => {
            const res = await api.get('/support/admin/faqs');
            return (res.data.data || []) as SupportFaq[];
        },
    });
}

export function useAdminSaveFaq() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<SupportFaq> & { question: string; answer: string; category: string }) => {
            if (payload.id) {
                const res = await api.patch(`/support/admin/faqs/${payload.id}`, payload);
                return res.data.data as SupportFaq;
            }
            const res = await api.post('/support/admin/faqs', payload);
            return res.data.data as SupportFaq;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support', 'faqs'] });
            queryClient.invalidateQueries({ queryKey: ['support', 'admin', 'faqs'] });
        },
    });
}

export function useAdminDeleteFaq() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/support/admin/faqs/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support', 'faqs'] });
            queryClient.invalidateQueries({ queryKey: ['support', 'admin', 'faqs'] });
        },
    });
}
