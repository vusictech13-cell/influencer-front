import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    Award,
    CheckCircle,
    ArrowLeft,
    ExternalLink,
    Calendar,
    Music,
} from 'lucide-react';
import { useState } from 'react';
import { getStoredUser } from '@/utils/auth';
import { resolveAssetUrl } from '@/utils/image';
import BrandCampaignSubmissions from '@/components/brand/BrandCampaignSubmissions';

export default function CampaignDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const user = getStoredUser();
    const isBrandView = user?.role === 'brand' || location.pathname.startsWith('/brand/');
    const backPath = isBrandView ? '/brand/campaigns' : '/creator/campaigns';

    const [submissionUrl, setSubmissionUrl] = useState('');
    const [success, setSuccess] = useState(false);

    const { data: campaign, isLoading } = useQuery({
        queryKey: ['campaign', id],
        queryFn: async () => {
            const res = await api.get(`/campaigns/${id}`);
            return res.data.data;
        },
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            const accountsRes = await api.get('/social-accounts');
            const accountId = accountsRes.data.data[0]?.id;

            if (!accountId) throw new Error('Please connect a social account first');

            return api.post('/submissions', {
                campaign_id: id,
                social_account_id: accountId,
                submission_url: submissionUrl,
            });
        },
        onSuccess: () => setSuccess(true),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-[#00B4EB] h-8 w-8" />
            </div>
        );
    }

    if (isBrandView) {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <button
                    onClick={() => navigate(backPath)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Campaigns
                </button>

                <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                        {campaign.track_artwork_url ? (
                            <img
                                src={resolveAssetUrl(campaign.track_artwork_url)}
                                alt={campaign.title}
                                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover shadow-inner flex-shrink-0"
                            />
                        ) : (
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[#00B4EB]/20 flex items-center justify-center flex-shrink-0">
                                <Music size={36} className="text-[#00B4EB]" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 capitalize">
                                    {campaign.campaign_type}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 capitalize">
                                    {campaign.status}
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
                                {campaign.title}
                            </h1>
                            {campaign.brand_name && (
                                <p className="text-sm font-medium text-gray-500 mt-1">{campaign.brand_name}</p>
                            )}
                            {campaign.description && (
                                <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-2">
                                    {campaign.description}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-row md:flex-col gap-4 md:gap-3 md:text-right flex-shrink-0">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center md:justify-end gap-1">
                                    <Award size={12} /> Budget
                                </p>
                                <p className="text-xl font-semibold text-gray-900">
                                    ₹{Number(campaign.total_budget).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center md:justify-end gap-1">
                                    <Calendar size={12} /> Ends
                                </p>
                                <p className="text-sm font-semibold text-gray-700">
                                    {new Date(campaign.end_date).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {id && <BrandCampaignSubmissions campaignId={id} />}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <Button variant="ghost" onClick={() => navigate(backPath)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Campaigns
            </Button>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">{campaign.title}</h1>
                <p className="text-sm text-gray-500 mb-6">{campaign.description}</p>

                {success ? (
                    <div className="text-center py-6 space-y-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        <p className="font-semibold">Submission Successful!</p>
                        <p className="text-sm text-gray-500">Your work is pending brand verification.</p>
                        <Button onClick={() => navigate('/creator/dashboard')} className="w-full">
                            Go to Dashboard
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url">Post URL</Label>
                            <Input
                                id="url"
                                placeholder="https://..."
                                value={submissionUrl}
                                onChange={(e) => setSubmissionUrl(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => submitMutation.mutate()}
                            disabled={submitMutation.isPending || !submissionUrl}
                        >
                            {submitMutation.isPending ? (
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            ) : (
                                <ExternalLink className="mr-2 h-4 w-4" />
                            )}
                            Submit for Review
                        </Button>
                        {submitMutation.error && (
                            <p className="text-xs text-red-500">{(submitMutation.error as Error).message}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
