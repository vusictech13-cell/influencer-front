import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { getStoredUser, isAdminSession, updateStoredUser } from '@/utils/auth';

export type AdminRoleRef = { id: number; name: string; code: string };

export type AdminProfile = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    last_login_at: string | null;
    roles: AdminRoleRef[];
    permissions: string[];
    is_super_admin: boolean;
};

export function useAdminMe() {
    const query = useQuery({
        queryKey: ['admin', 'me'],
        queryFn: async () => {
            const response = await api.get('/admin/auth/me');
            return response.data.data.admin as AdminProfile;
        },
        staleTime: 30_000,
        enabled: isAdminSession(),
    });

    useEffect(() => {
        if (!query.data) return;
        const current = getStoredUser() || {};
        updateStoredUser({
            ...current,
            id: query.data.id,
            name: query.data.name,
            email: query.data.email,
            phone: query.data.phone,
            role: 'admin',
            permissions: query.data.permissions,
            is_super_admin: query.data.is_super_admin,
            admin_roles: query.data.roles,
        });
    }, [query.data]);

    return query;
}

export function adminCan(admin: AdminProfile | undefined, ...codes: string[]) {
    if (!admin) return false;
    if (admin.is_super_admin) return true;
    return codes.some((code) => admin.permissions.includes(code));
}
