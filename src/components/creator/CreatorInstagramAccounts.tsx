import { useLocation } from 'react-router-dom';
import { useConnectInstagram, useInstagramAccounts } from '@/hooks/useSocialAccounts';
import { formatCount } from '@/utils/creator';
import type { SocialAccountRecord } from '@/utils/creator';

const AVATAR_GRADIENTS = [
    'linear-gradient(145deg,#0b2744,#123050)',
    'linear-gradient(145deg,#ffd4b8,#ff6a1a)',
    'linear-gradient(145deg,#b2e8f7,#00B4EB)',
];

export function accountAvatarStyle(account: SocialAccountRecord, index: number) {
    if (account.profile_image) {
        return {
            backgroundImage: `url(${account.profile_image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    }
    return { background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] };
}

export default function CreatorInstagramAccounts() {
    const location = useLocation();
    const { accounts, isLoading } = useInstagramAccounts();
    const returnTo = location.pathname.startsWith('/creator/reel-studio')
        ? 'reel-studio'
        : location.pathname.startsWith('/creator/bulk-reels')
            ? 'bulk-reels'
            : location.pathname.startsWith('/creator/settings')
                ? 'settings'
                : 'creator';
    const { mutate: connectInstagram, isPending } = useConnectInstagram(returnTo);

    return (
        <div className="px-3 pb-2">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-[1.2px] text-[#a0a2aa]">
                Instagram accounts
            </p>
            {isLoading ? (
                <p className="px-3 text-[10px] text-[#8a8c94]">Loading accounts…</p>
            ) : accounts.length === 0 ? (
                <p className="px-3 mb-2 text-[10px] leading-relaxed text-[#8a8c94]">
                    Connect a professional Instagram account to join campaigns and share insights.
                </p>
            ) : (
                <div className="space-y-2">
                    {accounts.map((account, index) => (
                        <div
                            key={account.id}
                            className="rounded-[15px] border border-[#dce8f0] bg-[#f4fbff] p-3"
                        >
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="h-[31px] w-[31px] flex-none rounded-full"
                                    style={accountAvatarStyle(account, index)}
                                />
                                <div className="min-w-0">
                                    <strong className="block truncate text-[11px]">@{account.username}</strong>
                                    <span className="mt-0.5 block text-[9px] text-[#888b94]">
                                        {formatCount(account.followers_count || 0)} · Connected
                                    </span>
                                </div>
                                <div className="ml-auto h-[7px] w-[7px] rounded-full bg-[#25af70] shadow-[0_0_0_4px_#eaf9f1]" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <button
                type="button"
                onClick={() => connectInstagram()}
                disabled={isPending}
                className="mt-2.5 w-full rounded-[10px] border border-dashed border-[#d9dae1] bg-white px-2 py-2 text-[10px] font-bold text-[#6d7079]"
            >
                {isPending ? 'Opening Instagram…' : '+ Add Instagram account'}
            </button>
        </div>
    );
}
