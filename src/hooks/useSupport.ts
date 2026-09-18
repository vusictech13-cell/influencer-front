import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { getSupportSocket, sameTicketId } from '@/lib/supportSocket';

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

export type SupportBotAction = 'show_children' | 'answer' | 'escalate' | 'root';

export type SupportBotButton = {
    id: number | null;
    label: string;
    action?: SupportBotAction;
};

export type SupportBotNext = {
    reply: string;
    action: SupportBotAction;
    source?: 'script' | 'ai';
    topic?: string | null;
    node_id?: number | null;
    buttons: SupportBotButton[];
};

export function useSupportBotNext() {
    return useMutation({
        mutationFn: async (payload: { node_id?: number | null; message?: string } = {}) => {
            const body: { node_id?: number; message?: string } = {};
            if (payload.node_id != null) body.node_id = payload.node_id;
            if (payload.message != null && payload.message.trim() !== '') {
                body.message = payload.message.trim();
            }
            const res = await api.post('/support/bot/next', body);
            return res.data.data as SupportBotNext;
        },
    });
}

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
    const id = ticketId != null ? Number(ticketId) : null;
    return useQuery({
        queryKey: ['support', 'tickets', id],
        enabled: Boolean(id),
        queryFn: async () => {
            const res = await api.get(`/support/tickets/${id}`);
            return res.data.data as SupportTicket;
        },
    });
}

function patchTicketLists(queryClient: QueryClient, ticketId: number, patch: (ticket: SupportTicket) => SupportTicket) {
    const apply = (old: SupportTicket[] | undefined) => {
        if (!old) return old;
        return old.map((ticket) => (sameTicketId(ticket.id, ticketId) ? patch(ticket) : ticket));
    };

    queryClient.setQueryData(['support', 'tickets', 'mine'], apply);
    queryClient.setQueriesData({ queryKey: ['support', 'admin', 'tickets'] }, apply);
}

export function applyIncomingSupportMessage(
    queryClient: QueryClient,
    ticketId: number,
    message: SupportMessage,
) {
    const id = Number(ticketId);
    if (!Number.isFinite(id) || !message) return;

    queryClient.setQueryData<SupportTicket>(['support', 'tickets', id], (old) => {
        if (!old) return old;
        if (old.messages?.some((item) => Number(item.id) === Number(message.id))) return old;
        return {
            ...old,
            last_message: message,
            messages: [...(old.messages || []), message],
        };
    });

    patchTicketLists(queryClient, id, (ticket) => ({
        ...ticket,
        last_message: message,
        updatedAt: message.createdAt || ticket.updatedAt,
    }));
}

export function applyIncomingSupportTicket(queryClient: QueryClient, ticket: SupportTicket) {
    if (!ticket?.id) return;
    const id = Number(ticket.id);

    queryClient.setQueryData<SupportTicket>(['support', 'tickets', id], (old) => {
        if (!old) return ticket;
        const oldMessages = old.messages || [];
        const nextMessages = ticket.messages || [];
        const merged = nextMessages.length >= oldMessages.length ? nextMessages : oldMessages;
        return { ...old, ...ticket, messages: merged.length ? merged : oldMessages };
    });

    const apply = (old: SupportTicket[] | undefined) => {
        if (!old) return old;
        const exists = old.some((item) => sameTicketId(item.id, id));
        if (!exists) return [ticket, ...old];
        return old.map((item) => (sameTicketId(item.id, id) ? { ...item, ...ticket, messages: item.messages } : item));
    };

    queryClient.setQueryData(['support', 'tickets', 'mine'], apply);
    queryClient.setQueriesData({ queryKey: ['support', 'admin', 'tickets'] }, apply);
}

/** Keep React Query in sync from socket payloads. Do not HTTP-refetch messages. */
export function useSupportRealtime() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = getSupportSocket();
        if (!socket) return;

        const onMessage = (payload: { ticket_id?: number; message?: SupportMessage }) => {
            if (!payload?.message || payload.ticket_id == null) return;
            applyIncomingSupportMessage(queryClient, payload.ticket_id, payload.message);
        };

        const onTicket = (ticket: SupportTicket) => {
            applyIncomingSupportTicket(queryClient, ticket);
        };

        const onStatus = (payload: {
            ticket_id?: number;
            status?: SupportTicket['status'];
            assigned_admin_id?: number | null;
        }) => {
            const id = Number(payload?.ticket_id);
            if (!Number.isFinite(id)) return;

            queryClient.setQueryData<SupportTicket>(['support', 'tickets', id], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    status: payload.status ?? old.status,
                    assigned_admin_id:
                        payload.assigned_admin_id !== undefined ? payload.assigned_admin_id : old.assigned_admin_id,
                };
            });

            patchTicketLists(queryClient, id, (ticket) => ({
                ...ticket,
                status: payload.status ?? ticket.status,
                assigned_admin_id:
                    payload.assigned_admin_id !== undefined ? payload.assigned_admin_id : ticket.assigned_admin_id,
            }));
        };

        socket.on('support:message:new', onMessage);
        socket.on('support:ticket:created', onTicket);
        socket.on('support:ticket:updated', onTicket);
        socket.on('support:status', onStatus);

        return () => {
            socket.off('support:message:new', onMessage);
            socket.off('support:ticket:created', onTicket);
            socket.off('support:ticket:updated', onTicket);
            socket.off('support:status', onStatus);
        };
    }, [queryClient]);
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
        onSuccess: (ticket) => {
            applyIncomingSupportTicket(queryClient, ticket);
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
        onSuccess: (data, variables) => {
            applyIncomingSupportMessage(queryClient, variables.ticketId, data.message);
            if (data.ticket) applyIncomingSupportTicket(queryClient, data.ticket);
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
        onSuccess: (ticket) => {
            applyIncomingSupportTicket(queryClient, ticket);
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

export type SupportBotNode = {
    id: number;
    parent_id: number | null;
    label: string;
    reply: string | null;
    action: SupportBotAction;
    keywords: string[];
    sort_order: number;
    is_active: boolean;
    createdAt?: string;
    updatedAt?: string;
    parent?: { id: number; label: string } | null;
};

export function useAdminBotNodes() {
    return useQuery({
        queryKey: ['support', 'admin', 'bot-nodes'],
        queryFn: async () => {
            const res = await api.get('/support/admin/bot/nodes');
            return (res.data.data || []) as SupportBotNode[];
        },
    });
}

export function useAdminSaveBotNode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            id?: number;
            parent_id?: number | null;
            label: string;
            reply?: string | null;
            action: SupportBotAction;
            keywords?: string[] | string;
            sort_order?: number;
            is_active?: boolean;
        }) => {
            const body = {
                parent_id: payload.parent_id ?? null,
                label: payload.label,
                reply: payload.reply ?? null,
                action: payload.action,
                keywords: Array.isArray(payload.keywords)
                    ? payload.keywords
                    : String(payload.keywords || '')
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                sort_order: payload.sort_order ?? 0,
                is_active: payload.is_active !== false,
            };
            if (payload.id) {
                const res = await api.patch(`/support/admin/bot/nodes/${payload.id}`, body);
                return res.data.data as SupportBotNode;
            }
            const res = await api.post('/support/admin/bot/nodes', body);
            return res.data.data as SupportBotNode;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support', 'admin', 'bot-nodes'] });
        },
    });
}

export function useAdminDeleteBotNode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/support/admin/bot/nodes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support', 'admin', 'bot-nodes'] });
        },
    });
}
