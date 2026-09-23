import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import { campaignMatch } from '@/components/creator/CampaignGiftCard';
import { useInstagramAccount } from '@/hooks/useSocialAccounts';
import {
    getPayoutForRank,
    useApplyCampaign,
    useCampaign,
    useMySubmissions,
    useSubmitCampaignUrl,
    type Campaign,
    type CampaignSubmission,
} from '@/hooks/useCampaigns';
import { getApiErrorMessage } from '@/api/axios';
import { getVusicRank } from '@/utils/creator';
import { resolveAssetUrl } from '@/utils/image';

type FlowStep = 'start' | 'create' | 'submit' | 'approval' | 'approved' | 'rejected';

const FLOW_STEPS: { id: Exclude<FlowStep, 'approved' | 'rejected'>; label: string }[] = [
    { id: 'start', label: 'Start' },
    { id: 'create', label: 'Create' },
    { id: 'submit', label: 'Submit' },
    { id: 'approval', label: 'Approval' },
];

const CAMPAIGN_TYPE_LABEL: Record<string, string> = {
    reel: '1 Instagram Reel',
    post: '1 Instagram Post',
    story: '1 Instagram Story',
    youtube_video: '1 YouTube video',
    shorts: '1 YouTube Short',
    tiktok_video: '1 TikTok video',
};

function formatDeadline(dateStr?: string) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function requirementChips(campaign: Campaign) {
    const chips = [CAMPAIGN_TYPE_LABEL[campaign.campaign_type] || '1 social post'];
    if (campaign.spotify_link) chips.push('Use selected song');
    const tags = [campaign.hashtags, campaign.required_tags]
        .filter(Boolean)
        .join(' ')
        .split(/[\s,]+/)
        .map((tag) => tag.trim())
        .filter(Boolean);
    tags.forEach((tag) => {
        const label = tag.startsWith('#') ? tag : `#${tag}`;
        if (!chips.includes(label)) chips.push(label);
    });
    return chips;
}

function spotCount(campaign: Campaign) {
    return campaign.rank_allocations?.reduce((total, row) => total + (Number(row.qty) || 0), 0) ?? 0;
}

function isInstagramReelUrl(value: string) {
    try {
        const url = new URL(value.trim());
        return /(^|\.)instagram\.com$/i.test(url.hostname) && /\/(reel|reels|p)\//i.test(url.pathname);
    } catch {
        return false;
    }
}

function stepForSubmission(submission?: CampaignSubmission): FlowStep {
    if (!submission) return 'start';
    if (submission.status === 'applied') return 'create';
    if (submission.status === 'pending') return 'approval';
    if (submission.status === 'approved') return 'approved';
    return 'rejected';
}

function Artwork({
    url,
    className,
}: {
    url?: string;
    className: string;
}) {
    if (url) {
        return <img src={resolveAssetUrl(url)} alt="" className={`${className} object-cover`} />;
    }
    return (
        <div className={`${className} bg-[linear-gradient(145deg,#ffc18d,#d33d62)] text-white`}>
            ♪
        </div>
    );
}

function Stepper({ step }: { step: FlowStep }) {
    const activeIndex = FLOW_STEPS.findIndex((item) => item.id === step);
    return (
        <div className="mb-7 flex items-center">
            {FLOW_STEPS.map((item, index) => {
                const done = index < activeIndex;
                const active = index === activeIndex;
                return (
                    <div key={item.id} className="flex min-w-0 flex-1 items-center">
                        <div className={`flex items-center gap-2 text-[11px] font-extrabold ${active || done ? 'text-[#ff641c]' : 'text-[#a0a8b2]'}`}>
                            <span
                                className={`grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full ${
                                    active || done ? 'bg-[#ff641c] text-white' : 'bg-[#edf1f4]'
                                }`}
                            >
                                {done ? '✓' : index + 1}
                            </span>
                            <span className="hidden sm:inline">{item.label}</span>
                        </div>
                        {index < FLOW_STEPS.length - 1 && <span className="mx-2.5 h-px flex-1 bg-[#e5eaf0]" />}
                    </div>
                );
            })}
        </div>
    );
}

export default function CreatorCampaignDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const campaignId = Number(id);

    const [flowOpen, setFlowOpen] = useState(false);
    const [step, setStep] = useState<FlowStep>('start');
    const [reelUrl, setReelUrl] = useState('');
    const [flowError, setFlowError] = useState('');

    const { instagram } = useInstagramAccount();
    const { data: campaign, isLoading: campaignLoading } = useCampaign(id);
    const { data: submissions, isLoading: submissionsLoading } = useMySubmissions();
    const { mutate: applyCampaign, isPending: isApplying } = useApplyCampaign();
    const { mutate: submitUrl, isPending: isSubmitting } = useSubmitCampaignUrl();

    const submission = submissions?.find((item) => item.campaign_id === campaignId);
    const rank = getVusicRank(instagram?.followers_count ?? 0);
    const payout = getPayoutForRank(campaign, rank.rank);
    const payoutLabel = `₹${payout.toLocaleString('en-IN')}`;

    useEffect(() => {
        if (!flowOpen) return undefined;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setFlowOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [flowOpen]);

    const openFlow = () => {
        setFlowError('');
        setStep(stepForSubmission(submission));
        if (submission?.submission_url) setReelUrl(submission.submission_url);
        setFlowOpen(true);
    };

    const handleStartCreating = () => {
        if (submission) {
            setStep('create');
            return;
        }
        if (!instagram) {
            setFlowError('Connect your Instagram account before starting this opportunity.');
            return;
        }
        setFlowError('');
        applyCampaign(
            { campaign_id: campaignId, social_account_id: Number(instagram.id) },
            {
                onSuccess: () => setStep('create'),
                onError: (error) => setFlowError(getApiErrorMessage(error, 'Could not start this opportunity')),
            },
        );
    };

    const handleSubmit = () => {
        const url = reelUrl.trim();
        if (!url) {
            setFlowError('Paste your Instagram Reel link.');
            return;
        }
        if (!isInstagramReelUrl(url)) {
            setFlowError('Use a public Instagram Reel link, like https://www.instagram.com/reel/... or https://www.instagram.com/p/...');
            return;
        }
        if (!submission) return;
        setFlowError('');
        submitUrl(
            { submissionId: submission.id, submission_url: url },
            {
                onSuccess: () => setStep('approval'),
                onError: (error) => setFlowError(getApiErrorMessage(error, 'Could not submit this Reel')),
            },
        );
    };

    if (campaignLoading || submissionsLoading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#ff641c]" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="mx-auto max-w-md rounded-3xl border border-[#e4ebf2] bg-white px-8 py-10 text-center">
                <p className="text-sm text-[#8d96a3]">This campaign is no longer available.</p>
                <button
                    type="button"
                    onClick={() => navigate('/creator/brands')}
                    className="mt-4 text-sm font-extrabold text-[#ff641c]"
                >
                    Back to Brands
                </button>
            </div>
        );
    }

    const deadline = formatDeadline(campaign.end_date);
    const spots = spotCount(campaign);
    const chips = requirementChips(campaign);
    const songMeta = [campaign.genre || 'Music', 'Official release'].join(' · ');
    const cta =
        submission?.status === 'approved'
            ? 'View approval'
            : submission?.status === 'rejected'
              ? 'View status'
              : submission?.status === 'pending'
                ? 'View submission'
                : submission?.status === 'applied'
                  ? 'Continue opportunity'
                  : 'Start Opportunity';
    const modalTitle =
        step === 'create'
            ? 'Create your Reel'
            : step === 'submit'
              ? 'Submit your Reel'
              : step === 'approval'
                ? 'Approval'
                : step === 'approved'
                  ? 'Opportunity complete'
                  : step === 'rejected'
                    ? 'Submission update'
                    : 'Start opportunity';
    const shownUrl = submission?.submission_url || reelUrl;

    return (
        <div className="mx-auto max-w-[850px] text-[#15385f]">
            <button
                type="button"
                onClick={() => navigate('/creator/brands')}
                className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#8d96a3] hover:text-[#15385f]"
            >
                <ArrowLeft size={14} /> Brands
            </button>
            <h1 className="mb-2 text-[30px] font-extrabold tracking-[-0.6px]">Fresh opportunity</h1>
            <p className="mb-7 text-[15px] text-[#8d96a3]">
                {campaign.spotify_link
                    ? 'A producer has selected a song and is looking for creators to make Reels.'
                    : 'A producer is looking for creators to make Reels for this campaign.'}
            </p>

            <article className="overflow-hidden rounded-3xl border border-[#e4ebf2] bg-white shadow-[0_18px_50px_rgba(23,55,86,0.09)]">
                <div
                    className="relative h-[220px] overflow-hidden sm:h-[260px]"
                    style={{
                        background:
                            'radial-gradient(circle at 15% 25%, rgba(255,255,255,.27), transparent 25%), linear-gradient(120deg, #ff8b43 0%, #ff641c 43%, #8c3764 100%)',
                    }}
                >
                    <div className="absolute -right-[70px] -top-[125px] h-[310px] w-[310px] rounded-full bg-white/15" />
                    <div className="absolute left-5 top-5 z-[2] rounded-full bg-white px-3.5 py-2 text-[12px] font-extrabold text-[#ff641c] sm:left-[26px] sm:top-6">
                        ✦ MUSIC OPPORTUNITY
                    </div>
                    <div className="absolute right-4 top-5 z-[2] rounded-full bg-[#e8fff4] px-3 py-2 text-[12px] font-extrabold text-[#168557] sm:right-6 sm:top-6">
                        {campaignMatch(campaign)}% match
                    </div>
                    <Artwork
                        url={campaign.track_artwork_url}
                        className="absolute bottom-5 left-5 z-[2] flex h-[108px] w-[108px] items-center justify-center rounded-2xl text-[36px] font-extrabold shadow-[0_20px_35px_rgba(0,0,0,0.23)] sm:bottom-7 sm:left-8 sm:h-[140px] sm:w-[140px] sm:text-[52px]"
                    />
                    <div className="absolute bottom-7 left-[140px] right-4 z-[2] text-white sm:bottom-9 sm:left-[196px]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.4px] text-white/80 sm:text-xs">
                            Create with this song
                        </p>
                        <h2 className="mt-1 text-[22px] font-extrabold leading-tight sm:text-[31px]">Make a Reel. Get paid.</h2>
                    </div>
                </div>

                <div className="px-5 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
                    <p className="text-[11px] font-extrabold uppercase tracking-[1px] text-[#9aa3af]">Producer campaign</p>
                    <h2 className="mb-1 mt-1.5 text-[24px] font-extrabold">{campaign.title}</h2>
                    <p className="text-sm text-[#8b95a2]">
                        Produced by <strong className="font-extrabold text-[#52657b]">{campaign.brand_name || 'the brand'}</strong>
                    </p>

                    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#e9eef3] bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3.5">
                            <Artwork
                                url={campaign.track_artwork_url}
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#ff9148,#bb3760)] text-[23px] font-extrabold"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-[15px] font-extrabold">{campaign.title}</p>
                                <p className="mt-1 text-xs text-[#929aa7]">{songMeta}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                aria-label="Play selected song"
                                disabled={!campaign.spotify_link}
                                onClick={() => campaign.spotify_link && window.open(campaign.spotify_link, '_blank', 'noopener,noreferrer')}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ff641c] text-white disabled:opacity-40"
                            >
                                <Play size={16} fill="currentColor" />
                            </button>
                            {campaign.spotify_link && (
                                <button
                                    type="button"
                                    onClick={() => window.open(campaign.spotify_link, '_blank', 'noopener,noreferrer')}
                                    className="whitespace-nowrap rounded-[10px] border border-[#dfe6ed] bg-white px-3.5 py-2.5 text-xs font-extrabold text-[#173d60]"
                                >
                                    <span className="mr-1.5 text-[#1db954]">●</span>
                                    Full song on Spotify
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {chips.map((chip) => (
                            <span key={chip} className="rounded-[9px] bg-[#f4f7fa] px-2.5 py-2 text-xs font-bold text-[#667487]">
                                {chip}
                            </span>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-4 border-t border-[#edf1f5] pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.8px] text-[#9ba3ae]">Potential payout</p>
                            <p className="mt-0.5 text-[25px] font-extrabold leading-none">
                                {payoutLabel}{' '}
                                <span className="text-xs font-medium text-[#9199a5]">/ approved Reel</span>
                            </p>
                            <p className="mt-1 text-xs text-[#9099a5]">
                                {deadline ? `Submit before ${deadline}` : 'Open now'}
                                {spots > 0 ? ` · ${spots} spots` : ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openFlow}
                            className="rounded-xl bg-[#ff641c] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(255,100,28,0.2)]"
                        >
                            {cta} →
                        </button>
                    </div>
                </div>
            </article>

            {flowOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,39,60,0.48)] p-5 backdrop-blur-[5px]"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setFlowOpen(false);
                    }}
                >
                    <div className="max-h-[calc(100vh-40px)] w-full max-w-[590px] overflow-y-auto rounded-[22px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
                        <div className="flex items-center justify-between border-b border-[#e4ebf2] px-6 pb-4 pt-6">
                            <h3 className="text-xl font-extrabold">{modalTitle}</h3>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setFlowOpen(false)}
                                className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#f3f6f8] text-[#697789]"
                            >
                                ×
                            </button>
                        </div>
                        <div className="px-6 py-6">
                            {step !== 'approved' && step !== 'rejected' && <Stepper step={step} />}

                            {flowError && (
                                <p className="mb-4 rounded-[13px] border border-[#ffd0d0] bg-[#fff0f0] px-4 py-3 text-[13px] text-[#b42323]">
                                    {flowError}
                                    {!instagram && step === 'start' && (
                                        <button
                                            type="button"
                                            onClick={() => navigate('/creator/settings')}
                                            className="mt-2 block font-extrabold text-[#15385f] underline"
                                        >
                                            Connect Instagram
                                        </button>
                                    )}
                                </p>
                            )}

                            {step === 'start' && (
                                <>
                                    <div className="rounded-[13px] border border-[#ffe0cf] bg-[#fff7f2] px-4 py-3.5 text-[13px] leading-relaxed text-[#6f7884]">
                                        <strong className="text-[#15385f]">You&apos;re starting this opportunity.</strong>
                                        <br />
                                        {campaign.spotify_link
                                            ? 'Create your Reel using the producer-selected song. You can submit the final Instagram Reel link once it is live.'
                                            : 'Create your Reel, then submit the public Instagram Reel link once it is live. This campaign has no required song, so sound is not checked.'}
                                    </div>
                                    <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-[#e9eef3] bg-[#f8fafc] p-4">
                                        <Artwork
                                            url={campaign.track_artwork_url}
                                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-[23px] font-extrabold"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-[15px] font-extrabold">{campaign.title}</p>
                                            <p className="mt-1 text-xs text-[#929aa7]">
                                                {campaign.spotify_link
                                                    ? 'Use the selected campaign audio in your Reel.'
                                                    : 'Publish your Reel, then come back with the public link.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-5 flex gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setFlowOpen(false)}
                                            className="rounded-[10px] border border-[#dce4eb] bg-white px-4 py-3 text-sm font-bold text-[#5d6c7d]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleStartCreating}
                                            disabled={isApplying}
                                            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#ff641c] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                                        >
                                            {isApplying && <Loader2 size={16} className="animate-spin" />}
                                            Start creating →
                                        </button>
                                    </div>
                                </>
                            )}

                            {step === 'create' && (
                                <>
                                    <div className="pb-1 pt-1 text-center">
                                        <div className="mx-auto grid h-[66px] w-[66px] place-items-center rounded-full bg-[#fff5e9] text-[29px]">
                                            🎬
                                        </div>
                                        <h3 className="mb-1.5 mt-3.5 text-[22px] font-extrabold">Opportunity started</h3>
                                        <p className="text-[13px] leading-relaxed text-[#8c96a3]">
                                            Your opportunity is now active.
                                            <br />
                                            Create and publish your Reel on Instagram, then come back here to submit the final link.
                                        </p>
                                    </div>
                                    <div className="mt-5 flex items-center gap-3 rounded-[13px] border border-[#e9eef3] bg-[#f7f9fb] p-4">
                                        <div className="h-[68px] w-[52px] shrink-0 rounded-lg bg-[linear-gradient(150deg,#263d58,#ff641c)]" />
                                        <div>
                                            <strong className="text-[13px]">{campaign.title}</strong>
                                            <span className="mt-0.5 block text-[11px] text-[#909aa6]">
                                                {payoutLabel} payout · Pending submission
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFlowError('');
                                            setStep('submit');
                                        }}
                                        className="mt-5 w-full rounded-xl bg-[#ff641c] px-5 py-3.5 text-sm font-extrabold text-white"
                                    >
                                        I&apos;ve posted my Reel → Submit link
                                    </button>
                                </>
                            )}

                            {step === 'submit' && (
                                <>
                                    <h3 className="mb-1.5 text-lg font-extrabold">Submit your final Reel</h3>
                                    <p className="mb-5 text-[13px] text-[#8c96a3]">
                                        Paste the public Instagram Reel URL. The team will review it against the opportunity brief.
                                    </p>
                                    <label htmlFor="reel-url" className="mb-2 block text-xs font-extrabold text-[#55677a]">
                                        Instagram Reel link
                                    </label>
                                    <input
                                        id="reel-url"
                                        type="text"
                                        value={reelUrl}
                                        onChange={(event) => setReelUrl(event.target.value)}
                                        placeholder="https://www.instagram.com/reel/... or /p/..."
                                        className="w-full rounded-[11px] border border-[#dce4eb] px-3.5 py-3.5 text-sm text-[#15385f] outline-none focus:border-[#9dc7dd] focus:shadow-[0_0_0_3px_rgba(24,181,217,0.08)]"
                                    />
                                    <div className="mt-4 rounded-[13px] border-[1.5px] border-dashed border-[#cbd7e1] px-4 py-4 text-center text-xs text-[#8290a0]">
                                        Your Reel must be live and publicly accessible on Instagram.
                                    </div>
                                    <div className="mt-5 flex gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFlowError('');
                                                setStep('create');
                                            }}
                                            className="rounded-[10px] border border-[#dce4eb] bg-white px-4 py-3 text-sm font-bold text-[#5d6c7d]"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#ff641c] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                                        >
                                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                            Submit for approval →
                                        </button>
                                    </div>
                                </>
                            )}

                            {step === 'approval' && (
                                <>
                                    <div className="pb-1 pt-1 text-center">
                                        <div className="mx-auto grid h-[66px] w-[66px] place-items-center rounded-full bg-[#fff5e9] text-[29px]">
                                            ⌛
                                        </div>
                                        <h3 className="mb-1.5 mt-3.5 text-[22px] font-extrabold">Submitted for approval</h3>
                                        <p className="text-[13px] leading-relaxed text-[#8c96a3]">
                                            Your Reel has been submitted successfully.
                                            <br />
                                            The producer will review your content before the payout is released.
                                        </p>
                                    </div>
                                    <div className="mt-5 flex items-center gap-3 rounded-[13px] border border-[#e9eef3] bg-[#f7f9fb] p-4">
                                        <div className="h-[68px] w-[52px] shrink-0 rounded-lg bg-[linear-gradient(150deg,#263d58,#ff641c)]" />
                                        <div className="min-w-0">
                                            <strong className="text-[13px]">Your Instagram Reel</strong>
                                            <span className="mt-0.5 block truncate text-[11px] text-[#909aa6]">
                                                {shownUrl || 'Link submitted · Under review'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-[13px] border border-[#ffe0cf] bg-[#fff7f2] px-4 py-3.5 text-[13px] leading-relaxed text-[#6f7884]">
                                        <strong className="text-[#15385f]">What happens next?</strong>
                                        <br />
                                        Tapnlike checks the Reel against the campaign requirements. Once approved, your {payoutLabel} payout will move to your earnings.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFlowOpen(false)}
                                        className="mt-5 w-full rounded-xl bg-[#ff641c] px-5 py-3.5 text-sm font-extrabold text-white"
                                    >
                                        Done
                                    </button>
                                </>
                            )}

                            {step === 'approved' && (
                                <>
                                    <div className="pb-1 pt-1 text-center">
                                        <div className="mx-auto grid h-[66px] w-[66px] place-items-center rounded-full bg-[#e9faf2] text-[29px] text-[#1b9a62]">
                                            ✓
                                        </div>
                                        <h3 className="mb-1.5 mt-3.5 text-[22px] font-extrabold">Reel approved</h3>
                                        <p className="text-[13px] leading-relaxed text-[#8c96a3]">
                                            Congratulations! Your Reel has been approved by the producer.
                                        </p>
                                    </div>
                                    <div className="mt-5 flex items-center gap-3 rounded-[13px] border border-[#e9eef3] bg-[#f7f9fb] p-4">
                                        <div className="h-[68px] w-[52px] shrink-0 rounded-lg bg-[linear-gradient(150deg,#263d58,#ff641c)]" />
                                        <div>
                                            <strong className="text-[13px]">{payoutLabel} payout approved</strong>
                                            <span className="mt-0.5 block text-[11px] text-[#909aa6]">Added to your Tapnlike earnings</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFlowOpen(false)}
                                        className="mt-5 w-full rounded-xl bg-[#ff641c] px-5 py-3.5 text-sm font-extrabold text-white"
                                    >
                                        Done
                                    </button>
                                </>
                            )}

                            {step === 'rejected' && (
                                <>
                                    <div className="pb-1 pt-1 text-center">
                                        <div className="mx-auto grid h-[66px] w-[66px] place-items-center rounded-full bg-[#fff0f0] text-[29px] text-[#dc5353]">
                                            ×
                                        </div>
                                        <h3 className="mb-1.5 mt-3.5 text-[22px] font-extrabold">Reel not approved</h3>
                                        <p className="text-[13px] leading-relaxed text-[#8c96a3]">
                                            This Reel did not pass review. The payout stays pending until a Reel is approved.
                                        </p>
                                    </div>
                                    {shownUrl && (
                                        <a
                                            href={shownUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-5 block truncate rounded-[13px] border border-[#e9eef3] bg-[#f7f9fb] px-4 py-3 text-[13px] font-bold text-[#15385f]"
                                        >
                                            {shownUrl}
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setFlowOpen(false)}
                                        className="mt-5 w-full rounded-xl bg-[#ff641c] px-5 py-3.5 text-sm font-extrabold text-white"
                                    >
                                        Done
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
