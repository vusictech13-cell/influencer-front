import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useInstagramAccount, useSyncAccount } from '@/hooks/useSocialAccounts';
import { creatorTypeLabel } from '@/constants/onboarding';
import { formatCompactInr, formatCount, hasCreatorRates } from '@/utils/creator';
import { useWallet } from '@/hooks/useWallet';

export default function CreatorMediaKit() {
    const navigate = useNavigate();
    const { data: user } = useAuthUser();
    const { instagram } = useInstagramAccount();
    const { data: syncData } = useSyncAccount(instagram?.id);
    const { data: wallet } = useWallet();
    const onboarding = user?.onboarding_data;
    const profile = syncData?.profile;
    const followers = profile?.followers_count ?? instagram?.followers_count ?? 0;
    const engagement = Number(syncData?.engagement_rate ?? instagram?.engagement_rate ?? 0);
    const avatar =
        profile?.profile_picture_url ||
        instagram?.profile_image ||
        user?.profile_image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Creator')}&background=121318&color=fff`;
    const rates = onboarding?.rates;
    const hasRates = hasCreatorRates(rates);

    return (
        <div className="mx-auto max-w-[980px]">
            <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                    <h1 className="mb-1.5 text-[31px] font-extrabold leading-[1.06] tracking-[-1.3px]">Media kit</h1>
                    <p className="m-0 text-[13px] text-[#777a83]">A brand-ready snapshot of your audience, niche and rates.</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/creator/profile')}
                    className="rounded-[9px] bg-brand-orange px-3.5 py-2 text-[11px] font-extrabold text-white"
                >
                    Edit profile
                </button>
            </div>

            <div className="overflow-hidden rounded-[21px] border border-[#dce8f0] bg-white">
                <div className="relative bg-[linear-gradient(145deg,#00B4EB_0%,#0094d4_48%,#0b2744_100%)] px-6 py-8 text-white">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,106,26,0.72),transparent_65%)]" />
                    <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-center">
                        <img src={avatar} alt="" className="h-20 w-20 rounded-full border-2 border-white object-cover" />
                        <div>
                            <div className="mb-2 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[9px]">Creator media kit</div>
                            <h2 className="text-[28px] font-extrabold tracking-[-1px]">{user?.name || instagram?.display_name || 'Creator'}</h2>
                            <p className="text-xs text-[#c4c6ce]">
                                {instagram ? `@${instagram.username}` : 'Instagram not connected'} · {creatorTypeLabel(onboarding?.creatorType)}
                                {onboarding?.location ? ` · ${onboarding.location}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-[#e9e9ef] sm:grid-cols-4">
                    {[
                        { label: 'Followers', value: formatCount(followers) },
                        { label: 'Engagement', value: `${engagement.toFixed(1)}%` },
                        { label: 'Earned', value: formatCompactInr(wallet?.total_earned ?? 0) },
                        { label: 'Niche', value: onboarding?.contentCategories?.[0] || 'Creator' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white px-5 py-4">
                            <div className="text-[10px] uppercase tracking-[1.1px] text-[#8b8d95]">{stat.label}</div>
                            <strong className="mt-1 block text-lg tracking-[-0.4px]">{stat.value}</strong>
                        </div>
                    ))}
                </div>

                <div className="grid gap-5 p-5 md:grid-cols-2">
                    <div>
                        <h3 className="mb-2 text-[13px] font-bold">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                            {(onboarding?.contentCategories || []).length ? (
                                onboarding?.contentCategories?.map((item) => (
                                    <span key={item} className="rounded-full bg-[#f2f2f5] px-3 py-1 text-[11px] font-bold">
                                        {item}
                                    </span>
                                ))
                            ) : (
                                <p className="text-[11px] text-[#8b8d95]">Add categories in your profile.</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="mb-2 text-[13px] font-bold">Collaboration rates</h3>
                        {hasRates ? (
                            <div className="space-y-2">
                                {rates?.reel ? <p className="text-sm"><strong>₹{rates.reel.toLocaleString('en-IN')}</strong> <span className="text-[11px] text-[#8b8d95]">per Reel</span></p> : null}
                                {rates?.story ? <p className="text-sm"><strong>₹{rates.story.toLocaleString('en-IN')}</strong> <span className="text-[11px] text-[#8b8d95]">per Story</span></p> : null}
                                {rates?.post ? <p className="text-sm"><strong>₹{rates.post.toLocaleString('en-IN')}</strong> <span className="text-[11px] text-[#8b8d95]">per Post</span></p> : null}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => navigate('/creator/profile#rates')}
                                className="text-[11px] font-bold text-[#f05a0c]"
                            >
                                Add rates →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
