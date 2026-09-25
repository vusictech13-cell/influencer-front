import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { getStoredUser, updateStoredUser, type StoredUser } from '@/utils/auth';

function applyUser(user: StoredUser) {
    updateStoredUser(user);
    return user;
}

export function useAuthUser() {
    const stored = getStoredUser();
    return useQuery({
        queryKey: ['auth-user', stored?.id ?? 'anon'],
        queryFn: async () => {
            const res = await api.get('/auth/me');
            const user = res.data.data.user as StoredUser;
            return applyUser(user);
        },
        placeholderData: stored ?? undefined,
        staleTime: 0,
    });
}

export function useSendEmailOtp() {
    return useMutation({
        mutationFn: async () => {
            const res = await api.post('/auth/email/send-otp');
            return res.data as { message: string; devOtp?: string };
        },
    });
}

export function useVerifyEmail() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (otp: string) => {
            const res = await api.post('/auth/email/verify', { otp });
            return applyUser(res.data.data.user as StoredUser);
        },
        onSuccess: (user) => {
            queryClient.setQueryData(['auth-user', user.id], user);
        },
    });
}

export function useSendPhoneOtp() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (phone?: string) => {
            const res = await api.post('/auth/phone/send-otp', phone ? { phone } : {});
            if (res.data.data?.user) {
                applyUser(res.data.data.user as StoredUser);
                queryClient.setQueryData(['auth-user', res.data.data.user.id], res.data.data.user);
            }
            return res.data as { message: string; devOtp?: string; data?: { user: StoredUser } };
        },
    });
}

export async function startGoogleAuth(returnTo: 'login' | 'creator' = 'creator') {
    const res = await api.get(`/auth/google?returnTo=${returnTo}`);
    if (res.data.url) {
        window.location.href = res.data.url;
    }
}

export function useVerifyPhone() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (otp: string) => {
            const res = await api.post('/auth/phone/verify', { otp });
            return applyUser(res.data.data.user as StoredUser);
        },
        onSuccess: (user) => {
            queryClient.setQueryData(['auth-user', user.id], user);
        },
    });
}
