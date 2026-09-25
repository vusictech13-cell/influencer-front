import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export type CatalogItem = {
    id: number;
    name: string;
    is_active?: boolean;
};

export type CatalogKind = 'locations' | 'languages';

export function useLocations(q?: string) {
    const term = q?.trim() || '';
    return useQuery({
        queryKey: ['locations', term],
        enabled: q === undefined || term.length >= 2,
        queryFn: async () => {
            const res = await api.get('/locations', {
                params: term ? { q: term, limit: 20 } : undefined,
            });
            return res.data.data as CatalogItem[];
        },
    });
}

export function useLanguages() {
    return useQuery({
        queryKey: ['languages'],
        queryFn: async () => {
            const res = await api.get('/languages');
            return res.data.data as CatalogItem[];
        },
    });
}

export function useAdminCatalog(kind: CatalogKind) {
    return useQuery({
        queryKey: ['admin', kind],
        queryFn: async () => {
            const res = await api.get(`/admin/${kind}`);
            return res.data.data as CatalogItem[];
        },
    });
}

export function useCreateCatalogItem(kind: CatalogKind) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (name: string) => {
            const res = await api.post(`/admin/${kind}`, { name });
            return res.data.data as CatalogItem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', kind] });
            queryClient.invalidateQueries({ queryKey: [kind] });
        },
    });
}

export function useUpdateCatalogItem(kind: CatalogKind) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: { id: number; name?: string; is_active?: boolean }) => {
            const res = await api.put(`/admin/${kind}/${item.id}`, item);
            return res.data.data as CatalogItem;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', kind] });
            queryClient.invalidateQueries({ queryKey: [kind] });
        },
    });
}

export function useDeleteCatalogItem(kind: CatalogKind) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/admin/${kind}/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', kind] });
            queryClient.invalidateQueries({ queryKey: [kind] });
        },
    });
}
