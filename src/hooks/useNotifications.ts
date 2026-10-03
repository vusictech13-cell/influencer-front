import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { getSupportSocket } from '@/lib/supportSocket';

export type AppNotification = {
    id: number;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
    read: boolean;
    read_at: string | null;
    created_at: string;
};

type NotificationPage = {
    items: AppNotification[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

function normalize(raw: AppNotification): AppNotification {
    return {
        ...raw,
        id: Number(raw.id),
        data: asRecord(raw.data),
        read: Boolean(raw.read),
    };
}

export function notificationPath(item: AppNotification): string | null {
    const data = item.data || {};
    if (item.type === 'support_message' && data.ticket_id != null) {
        return `/creator/support?ticket=${data.ticket_id}`;
    }
    if (item.type === 'campaign_created' && data.campaign_id != null) {
        return `/creator/campaigns/${data.campaign_id}`;
    }
    if (item.type === 'payout_released') {
        return '/creator/payments';
    }
    return null;
}

export function useNotifications() {
    const queryClient = useQueryClient();

    const list = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications', { params: { limit: 30 } });
            const page = res.data.data as NotificationPage;
            return {
                ...page,
                items: (page.items || []).map(normalize),
            };
        },
    });

    const unread = useQuery({
        queryKey: ['notifications', 'unread'],
        queryFn: async () => {
            const res = await api.get('/notifications/unread-count');
            return { count: Number(res.data.data?.count || 0) };
        },
    });

    useEffect(() => {
        const socket = getSupportSocket();
        if (!socket) return;

        const onNew = (payload: AppNotification) => {
            if (!payload?.id) return;
            const item = normalize(payload);
            let inserted = false;
            queryClient.setQueryData<NotificationPage>(['notifications'], (old) => {
                if (!old) return old;
                if (old.items.some((row) => row.id === item.id)) return old;
                inserted = true;
                return { ...old, items: [item, ...old.items], total: old.total + 1 };
            });
            if (inserted && !item.read) {
                queryClient.setQueryData<{ count: number }>(['notifications', 'unread'], (old) => ({
                    count: (old?.count ?? 0) + 1,
                }));
            }
        };

        const onConnect = () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        };

        socket.on('notification:new', onNew);
        socket.on('connect', onConnect);

        return () => {
            socket.off('notification:new', onNew);
            socket.off('connect', onConnect);
        };
    }, [queryClient]);

    const markRead = useMutation({
        mutationFn: async (id: number) => {
            const res = await api.post(`/notifications/${id}/read`);
            return normalize(res.data.data as AppNotification);
        },
        onSuccess: (item) => {
            let wasUnread = false;
            queryClient.setQueryData<NotificationPage>(['notifications'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    items: old.items.map((row) => {
                        if (row.id !== item.id) return row;
                        if (!row.read) wasUnread = true;
                        return { ...row, read: true, read_at: item.read_at };
                    }),
                };
            });
            if (wasUnread) {
                queryClient.setQueryData<{ count: number }>(['notifications', 'unread'], (old) => ({
                    count: Math.max(0, (old?.count ?? 1) - 1),
                }));
            }
        },
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            await api.post('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.setQueryData<NotificationPage>(['notifications'], (old) => {
                if (!old) return old;
                return { ...old, items: old.items.map((row) => ({ ...row, read: true })) };
            });
            queryClient.setQueryData(['notifications', 'unread'], { count: 0 });
        },
    });

    return {
        items: list.data?.items ?? [],
        isLoading: list.isLoading,
        unreadCount: unread.data?.count ?? 0,
        markRead,
        markAllRead,
    };
}
