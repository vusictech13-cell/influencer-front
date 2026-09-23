import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { CampaignGiftCard, campaignMatch } from '@/components/creator/CampaignGiftCard';
import { useInstagramAccount } from '@/hooks/useSocialAccounts';
import { useCampaigns, useMySubmissions, getPayoutForRank, type Campaign } from '@/hooks/useCampaigns';
import { getVusicRank } from '@/utils/creator';

export default function CreatorBrands() {
    const navigate = useNavigate();
    const { instagram } = useInstagramAccount();
    const { data: campaigns, isLoading } = useCampaigns();
    const { data: submissions } = useMySubmissions();

    const rank = getVusicRank(instagram?.followers_count ?? 0);
    const appliedIds = useMemo(
        () => new Set(submissions?.map((item) => item.campaign_id) ?? []),
        [submissions],
    );

    const brands = useMemo(() => {
        const groups = new Map<string, Campaign[]>();
        (campaigns ?? []).forEach((campaign) => {
            const name = campaign.brand_name || 'Independent brand';
            const list = groups.get(name) ?? [];
            list.push(campaign);
            groups.set(name, list);
        });
        return Array.from(groups.entries()).map(([name, items]) => ({
            name,
            campaigns: items,
            openCount: items.filter((item) => !appliedIds.has(item.id)).length,
        }));
    }, [appliedIds, campaigns]);

    return (
        <div className="mx-auto max-w-[1420px]">
            <div className="mb-5">
                <h1 className="mb-1.5 text-[31px] font-extrabold leading-[1.06] tracking-[-1.3px]">Brands</h1>
                <p className="m-0 text-[13px] text-[#777a83]">Campaigns grouped by the brands looking for creators like you.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#ff6a1a]" />
                </div>
            ) : brands.length === 0 ? (
                <p className="rounded-[18px] border border-[#dce8f0] bg-white px-5 py-10 text-sm text-[#8b8d95]">
                    No brand campaigns are live right now.
                </p>
            ) : (
                <div className="space-y-8">
                    {brands.map((brand) => (
                        <section key={brand.name}>
                            <div className="mb-3 flex items-end justify-between">
                                <div>
                                    <h2 className="text-[17px] font-bold tracking-[-0.5px]">{brand.name}</h2>
                                    <p className="m-0 text-[11px] text-[#8b8d95]">
                                        {brand.openCount} open opportunit{brand.openCount === 1 ? 'y' : 'ies'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                                {brand.campaigns.map((campaign, index) => {
                                    const payout = getPayoutForRank(campaign, rank.rank);
                                    return (
                                        <CampaignGiftCard
                                            key={campaign.id}
                                            campaign={campaign}
                                            payout={payout}
                                            match={campaignMatch(campaign)}
                                            index={index}
                                            onView={() => navigate(`/creator/campaign-details/${campaign.id}`)}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

        </div>
    );
}
