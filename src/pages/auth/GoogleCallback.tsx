import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '@/api/axios';
import { getPostAuthPath, persistSession } from '@/utils/auth';

export default function GoogleCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            setError('Google sign-in did not complete. Please try again.');
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const response = await api.post('/auth/google/exchange', { code });
                const { accessToken, refreshToken, user } = response.data.data;
                persistSession(accessToken, refreshToken, user);
                if (!cancelled) {
                    navigate(getPostAuthPath(user), { replace: true });
                }
            } catch (err: unknown) {
                const apiError = err as { response?: { data?: { message?: string } } };
                if (!cancelled) {
                    setError(apiError?.response?.data?.message || 'Google sign-in failed. Please try again.');
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [navigate, searchParams]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-brand-lightbg px-6 font-jakarta">
            {error ? (
                <div className="w-full max-w-sm rounded-[28px] border border-[#dce8f0] bg-white p-8 text-center shadow-[0_28px_80px_rgba(18,19,24,0.08)]">
                    <p className="text-sm text-red-500">{error}</p>
                    <button
                        type="button"
                        onClick={() => navigate('/login', { replace: true })}
                        className="mt-5 h-11 w-full rounded-full bg-brand-orange text-xs font-extrabold text-white"
                    >
                        Back to log in
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3 text-sm text-[#7c7f88]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#ff6a1a]" />
                    Completing Google sign-in...
                </div>
            )}
        </div>
    );
}
