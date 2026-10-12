import { useState } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { returnToAdmin } from '@/utils/auth';

export default function ImpersonationBanner() {
    const { data: user } = useAuthUser();
    const [pending, setPending] = useState(false);
    if (!user?.impersonating) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ffd7bf] bg-[#fff4ec] px-4 py-3 md:px-8">
            <p className="text-sm font-semibold text-brand-ink">
                You are viewing this account as an admin. Support messages are turned off.
            </p>
            <button
                type="button"
                disabled={pending}
                onClick={() => {
                    setPending(true);
                    void returnToAdmin();
                }}
                className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
                {pending ? 'Returning...' : 'Return to admin'}
            </button>
        </div>
    );
}
