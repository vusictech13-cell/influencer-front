import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { updateStoredUser, withImpersonationFlag, type OnboardingData, type StoredUser } from '@/utils/auth';

export function useSaveOnboarding() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { step?: number; data?: OnboardingData; completed?: boolean }) => {
            const res = await api.put('/auth/onboarding', payload);
            const user = withImpersonationFlag(res.data.data.user as StoredUser);
            updateStoredUser(user);
            queryClient.setQueryData(['auth-user', user.id], user);
            return user;
        },
    });
}
