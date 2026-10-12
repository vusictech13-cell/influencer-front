import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export type ActivityItem = {
    id: number;
    actor_type: 'USER' | 'ADMIN';
    actor_id: number;
    actor?: {
        name: string | null;
        email: string | null;
        type: string | null;
    } | null;
    action: string;
    module: string;
    entity_type: string | null;
    entity_id: number | null;
    description: string | null;
    old_data?: unknown;
    new_data?: unknown;
    session_id?: string | null;
    ip_address: string | null;
    user_agent?: string | null;
    createdAt: string;
};

export type LoginHistoryItem = {
    id: number;
    event: string;
    status: string;
    device_name: string | null;
    device_type: string | null;
    os: string | null;
    browser: string | null;
    ip_address: string | null;
    city: string | null;
    country: string | null;
    createdAt: string;
};

export type AdminSession = {
    sessionId: string;
    deviceName: string | null;
    deviceType: string | null;
    os: string | null;
    browser: string | null;
    location: string | null;
    ipAddress: string | null;
    loginAt: string | null;
    lastActiveAt: string | null;
    isCurrent: boolean;
    status: string;
};

type Page<T> = { items: T[]; page: number; limit: number; total: number };

export function useAdminActivity(page: number, actorType: string, module: string, limit = 20, enabled = true) {
    return useQuery({
        queryKey: ['admin', 'activity', page, actorType, module, limit],
        enabled,
        queryFn: async () => {
            const response = await api.get('/admin/activity', {
                params: { page, limit, actor_type: actorType || undefined, module: module || undefined },
            });
            return response.data.data as Page<ActivityItem>;
        },
    });
}

export function useOwnSessions(enabled = true) {
    return useQuery({
        queryKey: ['admin', 'sessions'],
        enabled,
        queryFn: async () => {
            const response = await api.get('/admin/auth/sessions');
            return response.data.data as AdminSession[];
        },
    });
}

export function useOwnLoginHistory(page: number, enabled = true) {
    return useQuery({
        queryKey: ['admin', 'login-history', page],
        enabled,
        queryFn: async () => {
            const response = await api.get('/admin/auth/login-history', { params: { page, limit: 20 } });
            return response.data.data as Page<LoginHistoryItem>;
        },
    });
}

export function useSessionMutations() {
    const queryClient = useQueryClient();
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'login-history'] });
    };

    const revoke = useMutation({
        mutationFn: async (sessionId: string) => {
            await api.delete(`/admin/auth/sessions/${sessionId}`);
        },
        onSuccess: refresh,
    });

    const revokeOthers = useMutation({
        mutationFn: async () => {
            await api.post('/admin/auth/sessions/revoke-all');
        },
        onSuccess: refresh,
    });

    return { revoke, revokeOthers };
}
