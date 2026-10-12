import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';

export type MyActivityChange = {
    field: string;
    added: string[];
    removed: string[];
    before: string | null;
    after: string | null;
};

export type MyActivityItem = {
    id: number;
    action: string;
    module: string;
    description: string | null;
    createdAt: string;
    changes: MyActivityChange[];
};

type Page = {
    items: MyActivityItem[];
    page: number;
    limit: number;
    total: number;
};

export function useMyActivity(page: number) {
    return useQuery({
        queryKey: ['my-activity', page],
        queryFn: async () => {
            const response = await api.get('/auth/activity', { params: { page, limit: 20 } });
            return response.data.data as Page;
        },
    });
}
