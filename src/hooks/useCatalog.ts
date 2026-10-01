import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';

export type CatalogItem = {
    id: number;
    name: string;
    is_active?: boolean;
    country?: string;
    state?: string;
    city?: string;
};

export type CatalogKind = 'locations' | 'languages';

export type CatalogMeta = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

type CatalogWrite = {
    name?: string;
    is_active?: boolean;
    city?: string;
    state?: string;
    country?: string;
};

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

export function useAdminLanguages(page: number, limit = 10) {
    return useQuery({
        queryKey: ['admin', 'languages', page, limit],
        queryFn: async () => {
            const res = await api.get('/admin/languages', { params: { page, limit } });
            return { items: res.data.data as CatalogItem[], meta: res.data.meta as CatalogMeta };
        },
    });
}

export function useAdminLocations({
    page,
    limit = 10,
    country,
    q,
}: {
    page: number;
    limit?: number;
    country: string;
    q: string;
}) {
    return useQuery({
        queryKey: ['admin', 'locations', page, limit, country, q],
        queryFn: async () => {
            const res = await api.get('/admin/locations', {
                params: { page, limit, country, q: q || undefined },
            });
            return { items: res.data.data as CatalogItem[], meta: res.data.meta as CatalogMeta };
        },
    });
}

export function useAdminCountries() {
    return useQuery({
        queryKey: ['admin', 'location-countries'],
        queryFn: async () => {
            const res = await api.get('/admin/locations/countries');
            return res.data.data as string[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

function invalidateCatalog(queryClient: ReturnType<typeof useQueryClient>, kind: CatalogKind) {
    queryClient.invalidateQueries({ queryKey: ['admin', kind] });
    queryClient.invalidateQueries({ queryKey: [kind] });
    if (kind === 'locations') {
        queryClient.invalidateQueries({ queryKey: ['admin', 'location-countries'] });
    }
}

export function useCreateCatalogItem(kind: CatalogKind) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: string | CatalogWrite) => {
            const body = typeof payload === 'string' ? { name: payload } : payload;
            const res = await api.post(`/admin/${kind}`, body);
            return res.data.data as CatalogItem;
        },
        onSuccess: () => invalidateCatalog(queryClient, kind),
    });
}

export function useUpdateCatalogItem(kind: CatalogKind) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: { id: number } & CatalogWrite) => {
            const { id, ...body } = item;
            const res = await api.put(`/admin/${kind}/${id}`, body);
            return res.data.data as CatalogItem;
        },
        onSuccess: () => invalidateCatalog(queryClient, kind),
    });
}

export function useDeleteCatalogItem(kind: CatalogKind) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/admin/${kind}/${id}`);
        },
        onSuccess: () => invalidateCatalog(queryClient, kind),
    });
}
