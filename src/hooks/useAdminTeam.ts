import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import type { AdminRoleRef } from '@/hooks/useAdminAccess';

export type AdminAccount = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: 'active' | 'suspended';
    last_login_at: string | null;
    roles: AdminRoleRef[];
};

export type AccountPayload = {
    name: string;
    email?: string;
    password?: string;
    phone?: string;
    roleCodes: string[];
};

type AccountPage = { items: AdminAccount[]; page: number; limit: number; total: number };

export function useAdminAccounts(page: number, search: string, enabled = true) {
    return useQuery({
        queryKey: ['admin', 'accounts', page, search],
        enabled,
        queryFn: async () => {
            const response = await api.get('/admin/accounts', { params: { page, limit: 20, search } });
            return response.data.data as AccountPage;
        },
    });
}

export function useAdminAccountMutations() {
    const queryClient = useQueryClient();
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });

    const createAccount = useMutation({
        mutationFn: async (body: AccountPayload) => {
            const response = await api.post('/admin/accounts', body);
            return response.data.data;
        },
        onSuccess: refresh,
    });

    const updateAccount = useMutation({
        mutationFn: async ({ id, body }: { id: number; body: AccountPayload }) => {
            const response = await api.patch(`/admin/accounts/${id}`, body);
            return response.data.data;
        },
        onSuccess: refresh,
    });

    const setStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: 'active' | 'suspended' }) => {
            const path = status === 'suspended' ? 'suspend' : 'activate';
            const response = await api.post(`/admin/accounts/${id}/${path}`);
            return response.data.data;
        },
        onSuccess: refresh,
    });

    const removeAccount = useMutation({
        mutationFn: async (id: number) => {
            const response = await api.delete(`/admin/accounts/${id}`);
            return response.data.data;
        },
        onSuccess: refresh,
    });

    return { createAccount, updateAccount, setStatus, removeAccount };
}
