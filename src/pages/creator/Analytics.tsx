import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useInstagramAccount } from '@/hooks/useSocialAccounts';

export default function CreatorAnalytics() {
    const { instagram, isLoading } = useInstagramAccount();

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#ff6a1a]" />
            </div>
        );
    }

    if (!instagram) {
        return <Navigate to="/creator/dashboard" replace />;
    }

    return <Navigate to={`/creator/insights/${instagram.id}`} replace />;
}
