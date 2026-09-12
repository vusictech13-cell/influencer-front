import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    IndianRupee,
    Loader2,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import {
    CampaignGiftCard,
    GigApplyModal,
    campaignMatch,
    toSelectedGig,
    type SelectedGig,
} from '@/components/creator/CampaignGiftCard';
import { useInstagramAccount, useSyncAccount } from '@/hooks/useSocialAccounts';
import {
    useApplyCampaign,
    useCampaigns,
    useMySubmissions,
    getPayoutForRank,
} from '@/hooks/useCampaigns';
import {
    computeProfileStrength,
    estimateMonthlyEarnings,
    getVusicRank,
    hasCreatorRates,
} from '@/utils/creator';
import { getApiErrorMessage } from '@/api/axios';
import { getStoredUser } from '@/utils/auth';
import { creatorTypeLabel } from '@/constants/onboarding';

function formatAudience(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return value.toLocaleString();
}

function formatDelta(value: number, suffix = '%') {
    if (!value) return undefined;
    const abs = Math.abs(value).toFixed(1).replace(/\.0$/, '');
    return `${value > 0 ? '+' : '−'}${abs}${suffix}`;
}

function KpiCard({
    label,
    icon: Icon,
    value,
    delta,
    foot,
    onClick,
}: {
    label: string;
    icon: typeof Users;
    value: string;
    delta?: string;
    foot: string;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="min-h-[90px] rounded-[15px] border border-[#dce8f0] bg-white px-[15px] py-3.5 text-left"
        >
            <div className="mb-2.5 flex items-center justify-between">
                <div className="text-[11px] text-[#858791]">{label}</div>
                <div className="grid h-[31px] w-[31px] place-items-center rounded-[9px] bg-[#f6f6f8] text-[#4f5159]">
                    <Icon size={15} />
                </div>
            </div>
            <div className="flex items-baseline gap-1.5">
                <strong className="text-[26px] tracking-[-1px] text-brand-ink">{value}</strong>
                {delta ? <span className="text-[11px] font-bold text-[#15945a]">{delta}</span> : null}
            </div>
            <div className="mt-1.5 text-[11px] text-[#989aa2]">{foot}</div>
        </button>
    );
}

export default function CreatorDashboard() {
    const navigate = useNavigate();
    const campaignsRef = useRef<HTMLDivElement>(null);
    const [selectedGig, setSelectedGig] = useState<SelectedGig | null>(null);
    const [applyError, setApplyError] = useState('');

    const user = getStoredUser();
    const onboarding = user?.onboarding_data;
    const { instagram } = useInstagramAccount();
    const { data: syncData } = useSyncAccount(instagram?.id);
    const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
    const { data: submissions } = useMySubmissions();
    const { mutate: applyCampaign, isPending: isApplying } = useApplyCampaign();

    const participatedCampaignIds = useMemo(
        () => new Set(submissions?.map((s) => s.campaign_id) ?? []),
        [submissions],
    );

    const profile = syncData?.profile;
    const followers = profile?.followers_count ?? instagram?.followers_count ?? 0;
    const engagement = Number(syncData?.engagement_rate ?? instagram?.engagement_rate ?? 0);
    const rank = getVusicRank(followers);
    const displayName = user?.name || instagram?.display_name || instagram?.username || 'there';
    const username = instagram?.username || user?.name?.replace(/\s+/g, '_').toLowerCase() || 'creator';
    const avatar =
        profile?.profile_picture_url ||
        instagram?.profile_image ||
        user?.profile_image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=121318&color=fff`;
    const firstName = displayName.split(' ')[0];
    const availableCampaigns = campaigns?.filter((c) => !participatedCampaignIds.has(c.id)) ?? [];
    const featured = availableCampaigns.slice(0, 3);
    const topPayout = featured.reduce((max, campaign) => Math.max(max, getPayoutForRank(campaign, rank.rank)), 0);
    const earnings = estimateMonthlyEarnings(followers, onboarding?.earningGoal);
    const hasRates = hasCreatorRates(onboarding?.rates);
    const strength = computeProfileStrength({
        connected: Boolean(instagram),
        creatorType: onboarding?.creatorType,
        categories: onboarding?.contentCategories?.length,
        opportunities: onboarding?.opportunities?.length,
        location: onboarding?.location,
        languages: onboarding?.languages?.length,
        earningGoal: onboarding?.earningGoal,
        rates: hasRates,
    });
    const creatorScore = Math.min(100, Math.round(36 + engagement * 5 + Math.min(24, followers / 8000)));
    const nicheLine = [
        creatorTypeLabel(onboarding?.creatorType),
        ...(onboarding?.contentCategories?.slice(0, 2) || []),
        onboarding?.location,
    ]
        .filter(Boolean)
        .join(' · ');

    const growthPct = Number(
        syncData?.creator_score?.consistency?.growth_30d_pct ??
            syncData?.creator_score?.metrics?.follower_growth_pct ??
            0,
    );
    const actionsLeft = strength >= 100 ? 0 : Math.max(1, Math.ceil((100 - strength) / 15));
    const engagementDelta = engagement >= 3 ? Number((engagement - 3).toFixed(1)) : 0;
    const isVerified = Boolean(user?.email_verified || user?.phone_verified);

    const nextMove = !hasRates
        ? {
              title: 'Your next best move',
              copy: 'Add your collaboration rates to make your earning estimate more accurate.',
              cta: 'Add rates',
              to: '/creator/profile#rates',
          }
        : strength < 100
          ? {
                title: 'Your next best move',
                copy: 'Finish the remaining profile details so TapnLike can match you with better campaigns.',
                cta: 'Finish profile',
                to: '/creator/profile',
            }
          : featured.length
            ? {
                  title: 'Your next best move',
                  copy: 'Open a fresh opportunity and apply while the match is still strong.',
                  cta: 'View gifts',
                  to: '/creator/campaigns',
              }
            : {
                  title: 'Your next best move',
                  copy: 'Review your audience insights to see what brands you are best positioned for.',
                  cta: 'Open analytics',
                  to: '/creator/analytics',
              };

    const handleApply = (gig: SelectedGig) => {
        if (!instagram?.id) {
            setApplyError('Your Instagram account is still syncing. Try applying again in a moment.');
            return;
        }
        setApplyError('');
        applyCampaign(
            { campaign_id: gig.id, social_account_id: Number(instagram.id) },
            {
                onSuccess: () => {
                    if (gig.spotify_link) window.open(gig.spotify_link, '_blank');
                    setSelectedGig(null);
                    navigate(`/creator/campaigns/${gig.id}`);
                },
                onError: (error) => setApplyError(getApiErrorMessage(error, 'Failed to apply')),
            },
        );
    };

    const scrollToCampaigns = () => campaignsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return (
        <>
            <div className="mx-auto max-w-[1420px]">
                <div className="mb-5 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <h1 className="mb-1.5 font-outfit text-[31px] font-extrabold leading-[1.06] tracking-[-1.3px]">
                            Hey, {firstName} 👋
                        </h1>
                        <p className="m-0 text-[13px] text-[#777a83]">
                            Here are the best opportunities waiting for you today.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/creator/profile')}
                        className="flex items-center gap-2.5 rounded-[13px] border border-[#dce8f0] bg-white px-3 py-2"
                    >
                        <img src={avatar} alt="" className="h-[35px] w-[35px] rounded-full object-cover" />
                        <div className="text-left">
                            <strong className="block text-xs">
                                @{username}{' '}
                                {isVerified && (
                                    <span className="ml-1 rounded-full bg-[#eaf9f1] px-1.5 py-0.5 text-[9px] text-[#168d58]">
                                        Verified
                                    </span>
                                )}
                            </strong>
                            <span className="text-[10px] text-[#858891]">{nicheLine || 'Creator'}</span>
                        </div>
                    </button>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-[11px] sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        label="Followers"
                        icon={Users}
                        value={formatAudience(followers)}
                        delta={formatDelta(growthPct)}
                        foot="vs. last 30 days"
                        onClick={() => navigate('/creator/analytics')}
                    />
                    <KpiCard
                        label="Engagement rate"
                        icon={TrendingUp}
                        value={`${engagement.toFixed(1)}%`}
                        delta={formatDelta(engagementDelta)}
                        foot={engagement >= 3 ? 'above your category avg.' : 'vs. your category avg.'}
                        onClick={() => navigate('/creator/analytics')}
                    />
                    <KpiCard
                        label="Profile strength"
                        icon={Clock}
                        value={`${strength}%`}
                        foot={strength >= 100 ? 'Your profile is complete' : `${actionsLeft} action${actionsLeft === 1 ? '' : 's'} to reach 100%`}
                        onClick={() => navigate('/creator/profile')}
                    />
                    <KpiCard
                        label="Monthly earning potential"
                        icon={Wallet}
                        value={earnings.label}
                        foot="estimated potential"
                        onClick={() => navigate('/creator/payments')}
                    />
                </div>

                <div ref={campaignsRef} className="mb-3 mt-6 flex items-end justify-between">
                    <div>
                        <h2 className="mb-1 text-[17px] font-bold tracking-[-0.5px]">Fresh opportunities for you</h2>
                        <p className="m-0 text-[11px] text-[#8b8d95]">Personalized from your profile, audience and content</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/creator/campaigns')}
                        className="text-[11px] font-bold text-[#f05a0c]"
                    >
                        View all →
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                    {campaignsLoading ? (
                        <div className="col-span-full flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-[#ff6a1a]" />
                        </div>
                    ) : featured.length === 0 ? (
                        <p className="col-span-full py-8 text-sm text-[#8b8d95]">No available campaigns right now. Check back soon.</p>
                    ) : (
                        featured.map((campaign, index) => {
                            const payout = getPayoutForRank(campaign, rank.rank);
                            return (
                                <CampaignGiftCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    payout={payout}
                                    match={campaignMatch(campaign)}
                                    index={index}
                                    onView={() => setSelectedGig(toSelectedGig(campaign, rank.rank, payout))}
                                />
                            );
                        })
                    )}
                </div>

                <div className="mb-4 mr-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_.75fr]">
                    <div className="relative min-h-[290px] overflow-hidden rounded-[21px] bg-[linear-gradient(145deg,#00B4EB_0%,#0094d4_48%,#0b2744_100%)] p-[27px] text-white">
                        <div className="pointer-events-none absolute -right-[70px] -top-[120px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,106,26,0.72),transparent_65%)]" />
                        <div className="pointer-events-none absolute bottom-[-170px] right-[90px] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,rgba(255,138,61,0.32),transparent_65%)]" />
                        <div className="relative z-[1] max-w-[58%] max-sm:max-w-full max-sm:pb-24">
                            <div className="mb-[18px] inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/10 px-2.5 py-1.5 text-[9px] text-[#e9e9ed]">
                                ✦ Recommended for you
                            </div>
                            <h2 className="mb-2.5 text-[30px] font-extrabold leading-[1.06] tracking-[-1.3px] max-sm:text-[27px]">
                                Turn your audience into your next big opportunity.
                            </h2>
                            <p className="mb-5 text-xs leading-relaxed text-[#c4c6ce]">
                                {featured.length
                                    ? `You've got a strong match with ${featured.length} fresh brand campaign${featured.length === 1 ? '' : 's'}.${topPayout ? ` One of them could pay up to ₹${topPayout.toLocaleString('en-IN')}.` : ''}`
                                    : 'New brand campaigns will show up here as soon as they match your profile.'}
                            </p>
                            <button
                                type="button"
                                onClick={scrollToCampaigns}
                                className="rounded-[10px] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-brand-ink"
                            >
                                Explore opportunities →
                            </button>
                        </div>
                        <div className="absolute bottom-0 right-[15px] z-[1] h-[86%] w-[46%] max-sm:right-[-4px] max-sm:h-[45%] max-sm:w-[42%]">
                            <div className="absolute right-[42%] top-[25%] h-[95px] w-[95px] rounded-full bg-[linear-gradient(145deg,#fff,#ffe0cc)] opacity-20 blur-[1px]" />
                            <div className="absolute bottom-[11%] right-[12%] h-[245px] w-[165px] rotate-[7deg] overflow-hidden rounded-[24px] border-[5px] border-white/12 bg-[linear-gradient(180deg,#ffd4b8,#ff6a1a_48%,#0b2744)] shadow-[0_22px_40px_rgba(11,39,68,0.28)] max-sm:right-0 max-sm:rotate-[4deg] max-sm:scale-[.8]">
                                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0_40%,rgba(255,255,255,0.28)_42%,transparent_50%)]" />
                                <div className="absolute left-[62px] top-[23px] h-[42px] w-[42px] rounded-full bg-[#202126]" />
                                <div className="absolute left-[35px] top-[48px] h-[132px] w-[94px] rounded-[50px_50px_24px_24px] bg-[linear-gradient(145deg,#292631,#15161b)]" />
                                <div className="absolute bottom-3.5 left-4 text-[9px] font-extrabold uppercase tracking-wide text-white">
                                    Creator pick
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-[21px] border border-[#dce8f0] bg-white p-[22px]">
                        <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-[1.1px] text-[#8b8d95]">
                                Your earning potential
                            </div>
                            <h3 className="my-2 text-[28px] font-extrabold tracking-[-1px]">{earnings.rangeLabel}</h3>
                            <div className="text-[10px] text-[#8f9199]">Estimated monthly collaboration potential</div>
                            <div className="my-[18px] h-2 overflow-hidden rounded-full bg-[#efeff3]">
                                <span
                                    className="block h-full rounded-full bg-[linear-gradient(90deg,#ff6a1a,#ff8a3d)]"
                                    style={{ width: `${earnings.width}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#898c95]">
                                <span>Creator score</span>
                                <span className="font-extrabold text-[#ff6a1a]">{creatorScore} / 100</span>
                            </div>
                        </div>
                        <div className="mt-[17px] flex gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/creator/payments')}
                                className="flex-1 rounded-full border border-brand-orange bg-brand-orange py-2 text-[10px] font-bold text-white"
                            >
                                View estimate
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/creator/profile#rates')}
                                className="flex-1 rounded-[9px] border border-[#dce8f0] bg-white py-2 text-[10px] font-bold"
                            >
                                Add rates
                            </button>
                        </div>
                    </div>
                </div>

                {/* <div ref={campaignsRef} className="mb-3 mt-6 flex items-end justify-between">
                    <div>
                        <h2 className="mb-1 text-[17px] font-bold tracking-[-0.5px]">Fresh opportunities for you</h2>
                        <p className="m-0 text-[11px] text-[#8b8d95]">Personalized from your profile, audience and content</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/creator/campaigns')}
                        className="text-[11px] font-bold text-[#f05a0c]"
                    >
                        View all →
                    </button>
                </div> */}

                {/* <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                    {campaignsLoading ? (
                        <div className="col-span-full flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-[#ff6a1a]" />
                        </div>
                    ) : featured.length === 0 ? (
                        <p className="col-span-full py-8 text-sm text-[#8b8d95]">No available campaigns right now. Check back soon.</p>
                    ) : (
                        featured.map((campaign, index) => {
                            const payout = getPayoutForRank(campaign, rank.rank);
                            return (
                                <CampaignGiftCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    payout={payout}
                                    match={campaignMatch(campaign)}
                                    index={index}
                                    onView={() => setSelectedGig(toSelectedGig(campaign, rank.rank, payout))}
                                />
                            );
                        })
                    )}
                </div> */}

                <div className="mb-3 mt-6">
                    <h2 className="mb-1 text-[17px] font-bold tracking-[-0.5px]">Your creator progress</h2>
                    <p className="m-0 text-[11px] text-[#8b8d95]">Small improvements can unlock better opportunities</p>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_.85fr]">
                    <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                        <div className="flex items-center gap-4">
                            <div
                                className="relative grid h-[72px] w-[72px] flex-none place-items-center rounded-full"
                                style={{
                                    background: `conic-gradient(#ff6a1a 0 ${strength}%, #eeeef2 ${strength}% 100%)`,
                                }}
                            >
                                <span className="absolute inset-[7px] rounded-full bg-white" />
                                <span className="relative z-[1] text-sm font-extrabold">{strength}%</span>
                            </div>
                            <div>
                                <strong className="text-[13px]">
                                    {strength >= 100 ? 'Your profile is ready.' : 'Your profile is almost ready.'}
                                </strong>
                                <p className="my-1.5 text-[10px] leading-relaxed text-[#858891]">
                                    Adding your rates and media kit can help TapnLike match you with higher-value campaigns.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/creator/profile')}
                                    className="rounded-lg bg-[#f2f2f5] px-2.5 py-1.5 text-[9px] font-bold"
                                >
                                    Finish profile →
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#dce8f0] bg-white p-5">
                        <div className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[#e8f8fe] text-[#f05a0c]">
                            <IndianRupee size={21} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <strong className="text-xs">{nextMove.title}</strong>
                            <p className="mt-1 text-[10px] leading-relaxed text-[#858891]">{nextMove.copy}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(nextMove.to)}
                            className="whitespace-nowrap rounded-[9px] bg-brand-orange px-2.5 py-2 text-[9px] font-extrabold text-white"
                        >
                            {nextMove.cta}
                        </button>
                    </div>
                </div>
            </div>

            {selectedGig && (
                <GigApplyModal
                    gig={selectedGig}
                    applyError={applyError}
                    isApplying={isApplying}
                    onClose={() => setSelectedGig(null)}
                    onApply={() => handleApply(selectedGig)}
                />
            )}
        </>
    );
}
