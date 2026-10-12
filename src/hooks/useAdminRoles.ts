import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export type AdminPermission = {
    id: number;
    module: string;
    name: string;
    code: string;
    description: string | null;
    status: string;
};

export type AdminRole = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_system: boolean;
    status: string;
    permissions: string[];
};

export function useAdminRoles(enabled = true) {
    return useQuery({
        queryKey: ['admin', 'roles'],
        enabled,
        queryFn: async () => {
            const response = await api.get('/admin/roles');
            return response.data.data as AdminRole[];
        },
    });
}

export function useAdminPermissions(enabled = true) {
    return useQuery({
        queryKey: ['admin', 'permissions'],
        enabled,
        queryFn: async () => {
            const response = await api.get('/admin/permissions');
            return response.data.data as AdminPermission[];
        },
    });
}

export function useAdminRoleMutations() {
    const queryClient = useQueryClient();
    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
    };

    const createRole = useMutation({
        mutationFn: async (body: { name: string; code: string; description?: string }) => {
            const response = await api.post('/admin/roles', body);
            return response.data.data as AdminRole;
        },
        onSuccess: refresh,
    });

    const deleteRole = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/admin/roles/${id}`);
        },
        onSuccess: refresh,
    });

    const updateRole = useMutation({
        mutationFn: async ({ id, name, description }: { id: number; name: string; description: string }) => {
            const response = await api.patch(`/admin/roles/${id}`, { name, description });
            return response.data.data as AdminRole;
        },
        onSuccess: refresh,
    });

    const setPermissions = useMutation({
        mutationFn: async ({ id, permissionCodes }: { id: number; permissionCodes: string[] }) => {
            const response = await api.put(`/admin/roles/${id}/permissions`, { permissionCodes });
            return response.data.data as AdminRole;
        },
        onSuccess: refresh,
    });

    return { createRole, deleteRole, updateRole, setPermissions };
}
