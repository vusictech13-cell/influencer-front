import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    ExternalLink,
    Link2,
    Loader2,
    Music,
    PlayCircle,
    XCircle,
} from 'lucide-react';
import { useInstagramAccount } from '@/hooks/useSocialAccounts';
import {
    useApplyCampaign,
    useCampaign,
    useMySubmissions,
    useSubmitCampaignUrl,
    getPayoutForRank,
    getCampaignColor,
} from '@/hooks/useCampaigns';
import { getVusicRank } from '@/utils/creator';
import { resolveAssetUrl } from '@/utils/image';
import { getApiErrorMessage } from '@/api/axios';

export default function CreatorCampaign() {
    const { id } = useParams();
    const navigate = useNavigate();
    const campaignId = Number(id);

    const [submissionUrl, setSubmissionUrl] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [applyError, setApplyError] = useState('');

    const { instagram } = useInstagramAccount();
    const { data: campaign, isLoading: campaignLoading } = useCampaign(id);
    const { data: submissions, isLoading: submissionsLoading } = useMySubmissions();
    const { mutate: applyCampaign, isPending: isApplying } = useApplyCampaign();
    const { mutate: submitUrl, isPending: isSubmitting, error: submitError } = useSubmitCampaignUrl();

    const submission = submissions?.find((s) => s.campaign_id === campaignId);
    const followers = instagram?.followers_count ?? 0;
    const rank = getVusicRank(followers);
    const payout = getPayoutForRank(campaign, rank.rank);
    const color = campaign ? getCampaignColor(campaign, rank.rank) : 'bg-[#00B4EB]';

    const handleApply = () => {
        if (!instagram) return;
        setApplyError('');
        applyCampaign(
            { campaign_id: campaignId, social_account_id: Number(instagram.id) },
            {
                onSuccess: () => {
                    if (campaign?.spotify_link) {
                        window.open(campaign.spotify_link, '_blank');
                    }
                },
                onError: (error) => {
                    setApplyError(getApiErrorMessage(error, 'Failed to apply'));
                },
            },
        );
    };

    const handleSubmit = () => {
        if (!submission) return;
        submitUrl(
            { submissionId: submission.id, submission_url: submissionUrl },
            { onSuccess: () => setSubmitSuccess(true) },
        );
    };

    if (campaignLoading || submissionsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#00B4EB]" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 border border-gray-100">
                <p className="text-sm text-gray-500">Campaign not found.</p>
                <button
                    onClick={() => navigate('/creator/dashboard')}
                    className="mt-4 text-sm font-semibold text-[#00B4EB] hover:underline"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const isApplied = submission?.status === 'applied';
    const isSubmitted = submission && submission.status !== 'applied';

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/creator/campaigns')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Campaigns
            </button>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <div className={`absolute inset-0 ${color} opacity-20`} />
                    {campaign.track_artwork_url ? (
                        <img
                            src={resolveAssetUrl(campaign.track_artwork_url)}
                            alt={campaign.title}
                            className="w-24 h-24 rounded-2xl shadow-lg object-cover z-10 transform -rotate-6"
                        />
                    ) : (
                        <div className={`w-24 h-24 rounded-2xl ${color} shadow-lg flex items-center justify-center z-10 transform -rotate-6`}>
                            <Music size={40} className="text-white" />
                        </div>
                    )}
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">
                                {campaign.brand_name || 'Brand'} Campaign
                            </span>
                            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{campaign.title}</h1>
                            {campaign.genre && (
                                <p className="text-sm font-medium text-gray-500 mt-1">{campaign.genre}</p>
                            )}
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                Your Payout
                            </p>
                            <p className="text-2xl font-semibold text-emerald-500">₹{payout.toLocaleString()}</p>
                        </div>
                    </div>

                    {campaign.spotify_link && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1DB954]/10 rounded-full flex items-center justify-center">
                                <Link2 size={16} className="text-[#1DB954]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900">Audio Source</p>
                                <p className="text-[10px] font-medium text-gray-500 truncate">{campaign.spotify_link}</p>
                            </div>
                            <a
                                href={campaign.spotify_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                Open
                            </a>
                        </div>
                    )}

                    {campaign.description && (
                        <div>
                            <h2 className="text-xs font-semibold text-gray-900 mb-2">Brief & Requirements</h2>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed bg-white border border-gray-100 p-4 rounded-xl">
                                {campaign.description}
                                {campaign.hashtags && (
                                    <>
                                        {' '}
                                        Use hashtags:{' '}
                                        <strong className="text-[#00B4EB]">{campaign.hashtags}</strong>
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    {!submission && (
                        <div className="space-y-3">
                            {applyError && (
                                <p className="text-sm text-[#FF5A5F] bg-red-50 border border-red-100 rounded-xl p-3">
                                    {applyError}
                                </p>
                            )}
                            <button
                                onClick={handleApply}
                                disabled={isApplying || !instagram}
                                className="w-full py-4 bg-[#FF5A5F] hover:bg-[#ff464b] disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#FF5A5F]/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isApplying ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        Apply & Claim Audio <PlayCircle size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {isApplied && !submitSuccess && (
                        <div className="space-y-4 border-t border-gray-100 pt-6">
                            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                <Clock size={16} />
                                <span className="font-medium">Applied — create your reel and submit the post link below.</span>
                            </div>
                            <div>
                                <label htmlFor="submission-url" className="text-xs font-semibold text-gray-900 block mb-2">
                                    Instagram Reel URL
                                </label>
                                <input
                                    id="submission-url"
                                    type="url"
                                    placeholder="https://instagram.com/reel/..."
                                    value={submissionUrl}
                                    onChange={(e) => setSubmissionUrl(e.target.value)}
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4EB]/50 focus:border-[#00B4EB]"
                                />
                            </div>
                            {submitError && (
                                <p className="text-sm text-[#FF5A5F]">
                                    {getApiErrorMessage(submitError, 'Submission failed')}
                                </p>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !submissionUrl.trim()}
                                className="w-full py-4 bg-[#00B4EB] hover:bg-[#009fd4] disabled:opacity-60 text-gray-900 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        Submit for Review <ExternalLink size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {(submitSuccess || isSubmitted) && (
                        <div className="border-t border-gray-100 pt-6 space-y-4">
                            <div className="text-center py-4 space-y-3">
                                {submission?.status === 'approved' ? (
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                                ) : submission?.status === 'rejected' ? (
                                    <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                                ) : (
                                    <CheckCircle2 className="h-12 w-12 text-[#00B4EB] mx-auto" />
                                )}
                                <p className="font-semibold text-gray-900">
                                    {submitSuccess && 'Submission Successful!'}
                                    {!submitSuccess && submission?.status === 'pending' && 'Awaiting Brand Review'}
                                    {!submitSuccess && submission?.status === 'approved' && 'Approved'}
                                    {!submitSuccess && submission?.status === 'rejected' && 'Rejected'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {submission?.status === 'pending' && 'Your reel is pending brand verification.'}
                                    {submission?.status === 'approved' && 'Your payout will be released after 48 hours.'}
                                    {submission?.status === 'rejected' && 'This submission was not approved by the brand.'}
                                </p>
                                {submission?.submission_url && (
                                    <a
                                        href={submission.submission_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-[#00B4EB] hover:underline"
                                    >
                                        View submitted reel <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/creator/campaigns')}
                                className="w-full py-3 border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Back to Campaigns
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
