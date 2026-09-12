import { Loader2 } from 'lucide-react';
import { useInstagramAccount } from '@/hooks/useSocialAccounts';
import { formatCount, getVusicRank } from '@/utils/creator';
import { getStoredUser } from '@/utils/auth';

export default function CreatorSidebarProfile() {
    const { instagram, isLoading } = useInstagramAccount();
    const user = getStoredUser();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center px-2 mb-4 py-2">
                <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (!instagram) {
        return (
            <div className="px-2 mb-4">
                <p className="text-xs font-semibold text-gray-800">{user?.name || 'Creator'}</p>
                <p className="text-[10px] font-medium text-gray-500">Connect Instagram to get started</p>
            </div>
        );
    }

    const rank = getVusicRank(instagram.followers_count || 0);
    // const avatar = user?.profile_image;
    // const avatar =
    //     instagram?.profile_image ||
    //     `https://ui-avatars.com/api/?name=${encodeURIComponent(instagram.display_name || instagram.username)}&background=87D8FF&color=fff`;

    return (
        <div className="flex items-center gap-3 px-2 mb-4">
            {/* <img src={avatar} alt="Profile" className="w-8 h-8 rounded-full border border-gray-100 object-cover" /> */}
            <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-800 truncate">
                    {instagram.display_name || instagram.username}
                </span>
                <span className="text-[10px] font-medium text-gray-500 truncate">@{instagram.username}</span>
                <span className="text-[10px] font-medium text-[#00B4EB]">
                    Rank {rank.rank} {rank.label} · {formatCount(instagram.followers_count || 0)}
                </span>
            </div>
        </div>
    );
}
