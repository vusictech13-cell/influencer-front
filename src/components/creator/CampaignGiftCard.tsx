import { Loader2, Music, PlayCircle, X } from 'lucide-react';
import { resolveAssetUrl } from '@/utils/image';
import { getCampaignColor, type Campaign } from '@/hooks/useCampaigns';

const COVER_STYLES = [
    'bg-[linear-gradient(135deg,#ffd4b8,#ff6a1a_52%,#0b2744)]',
    'bg-[linear-gradient(135deg,#b2e8f7,#00B4EB_48%,#0b2744)]',
    'bg-[linear-gradient(135deg,#f0dd9f,#d89d50_45%,#3b2718)]',
];

export type SelectedGig = Campaign & { payout: number; color: string };

export function CampaignGiftCard({
    campaign,
    payout,
    match,
    index,
    onView,
}: {
    campaign: Campaign;
    payout: number;
    match: number;
    index: number;
    onView: () => void;
}) {
    return (
        <div className="overflow-hidden rounded-[19px] border border-[#dce8f0] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(20,20,40,0.08)]">
            <div className={`relative h-[175px] overflow-hidden ${COVER_STYLES[index % COVER_STYLES.length]}`}>
                {index % 3 === 0 ? (
                    <>
                        <div className="absolute -left-[30px] top-5 h-[140px] w-[140px] rounded-full bg-white/20" />
                        <div className="absolute -bottom-[75px] -right-[35px] h-[170px] w-[170px] rounded-full bg-black/30" />
                    </>
                ) : index % 3 === 1 ? (
                    <>
                        <div className="absolute -right-[35px] -top-[50px] h-[170px] w-[170px] rounded-full bg-white/25" />
                        <div className="absolute bottom-[-60px] left-5 h-[120px] w-[120px] rounded-full bg-black/30" />
                    </>
                ) : (
                    <>
                        <div className="absolute left-[35px] -top-[65px] h-[150px] w-[150px] rounded-full bg-white/20" />
                        <div className="absolute bottom-[-48px] right-[25px] h-[120px] w-[120px] rounded-full bg-black/30" />
                    </>
                )}
                {campaign.track_artwork_url ? (
                    <img
                        src={resolveAssetUrl(campaign.track_artwork_url)}
                        alt=""
                        className="absolute bottom-[19px] right-[31px] h-[120px] w-[95px] rotate-[5deg] rounded-2xl object-cover shadow-[0_16px_25px_rgba(0,0,0,0.18)]"
                    />
                ) : index % 3 === 0 ? (
                    <div className="absolute bottom-0 right-7 h-[152px] w-[112px] rounded-[55px_55px_20px_20px] bg-[linear-gradient(145deg,#202128,#494b55)] opacity-90">
                        <div className="absolute left-[29px] -top-6 h-[54px] w-[54px] rounded-full bg-[#282a30]" />
                    </div>
                ) : (
                    <div className="absolute bottom-[19px] right-[31px] h-[120px] w-[95px] rotate-[5deg] rounded-2xl bg-white/95 shadow-[0_16px_25px_rgba(0,0,0,0.18)]">
                        <div className="absolute inset-x-[14px] top-[19px] h-[35px] rounded-lg bg-black/10" />
                        <div className="absolute bottom-[19px] left-[18px] text-[8px] font-extrabold tracking-wide text-[#777]">
                            TAPNLIKE
                        </div>
                    </div>
                )}
            </div>
            <div className="px-[15px] pb-4 pt-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                    <div className="text-[9px] font-extrabold uppercase tracking-[0.8px] text-[#a0a2aa]">
                        {campaign.brand_name || 'Brand'}
                    </div>
                    <div className="rounded-full bg-[#eaf9f1] px-1.5 py-1 text-[8px] font-extrabold text-[#168d58]">
                        {match}% match
                    </div>
                </div>
                <h3 className="mb-1 text-[13px] font-bold">{campaign.title}</h3>
                <p className="mb-3 text-[10px] leading-relaxed text-[#878a93]">
                    {campaign.genre || campaign.campaign_type}
                    {campaign.hashtags ? ` · ${campaign.hashtags}` : ''}
                </p>
                <div className="flex items-end justify-between">
                    <div>
                        <strong className="block text-[17px] tracking-[-0.5px]">₹{payout.toLocaleString('en-IN')}</strong>
                        <span className="text-[9px] text-[#9a9ca4]">Potential payout</span>
                    </div>
                    <button
                        type="button"
                        onClick={onView}
                        className="rounded-full bg-brand-orange px-2.5 py-2 text-[9px] font-extrabold text-white"
                    >
                        View gift →
                    </button>
                </div>
            </div>
        </div>
    );
}

export function GigApplyModal({
    gig,
    applyError,
    isApplying,
    onClose,
    onApply,
}: {
    gig: SelectedGig;
    applyError?: string;
    isApplying?: boolean;
    onClose: () => void;
    onApply: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <button type="button" aria-label="Close" className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
                <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gray-100">
                    <div className={`absolute inset-0 ${gig.color} opacity-20`} />
                    {gig.track_artwork_url ? (
                        <img
                            src={resolveAssetUrl(gig.track_artwork_url)}
                            alt={gig.title}
                            className="z-10 h-24 w-24 -rotate-6 rounded-2xl object-cover shadow-lg"
                        />
                    ) : (
                        <div className={`z-10 flex h-24 w-24 -rotate-6 items-center justify-center rounded-2xl ${gig.color} shadow-lg`}>
                            <Music size={40} className="text-white" />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/50 text-gray-800"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="p-6 md:p-8">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                {gig.brand_name || 'Brand'} Campaign
                            </span>
                            <h2 className="text-2xl font-semibold tracking-tight">{gig.title}</h2>
                        </div>
                        <div className="text-right">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                Potential payout
                            </p>
                            <p className="text-2xl font-semibold tracking-tight text-[#ff6a1a]">
                                ₹{gig.payout.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    {gig.description && <p className="mb-6 text-sm leading-relaxed text-gray-600">{gig.description}</p>}
                    {applyError && (
                        <p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-500">{applyError}</p>
                    )}
                    <button
                        type="button"
                        onClick={onApply}
                        disabled={isApplying}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange py-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,106,26,0.22)] disabled:opacity-60"
                    >
                        {isApplying ? <Loader2 size={18} className="animate-spin" /> : <>Apply now <PlayCircle size={18} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function campaignMatch(campaign: Campaign) {
    return 88 + (campaign.id % 10);
}

export function toSelectedGig(campaign: Campaign, rank: number, payout: number): SelectedGig {
    return { ...campaign, payout, color: getCampaignColor(campaign, rank) };
}
