import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { message } from 'antd';
import {
    ArrowLeft,
    Wallet,
    Lock,
    Megaphone,
    Loader2,
    Plus,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import api from '@/api/axios';
import { useWallet, useRazorpayTopup, formatCurrency } from '@/hooks/useWallet';
import { buildCampaignPayload, type CampaignCheckoutState } from '@/types/campaign';
import { resolveAssetUrl } from '@/utils/image';
import {
    clearCampaignCheckoutState,
    loadCampaignCheckoutState,
    saveCampaignCheckoutState,
} from '@/utils/campaignCheckoutStorage';

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000];

function resolveCheckoutState(locationState: CampaignCheckoutState | null): CampaignCheckoutState | null {
    if (locationState?.formData?.title) {
        saveCampaignCheckoutState(locationState);
        return locationState;
    }
    return loadCampaignCheckoutState();
}

export default function CampaignCheckout() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as CampaignCheckoutState | null;

    const [checkoutState, setCheckoutState] = useState<CampaignCheckoutState | null>(() =>
        resolveCheckoutState(locationState),
    );
    const [topupAmount, setTopupAmount] = useState('');
    const [launching, setLaunching] = useState(false);

    const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
    const { mutate: topup, isPending: toppingUp } = useRazorpayTopup();

    useEffect(() => {
        const resolved = resolveCheckoutState(locationState);
        if (resolved) {
            setCheckoutState(resolved);
            return;
        }
        navigate('/brand/campaigns/create', { replace: true });
    }, [locationState, navigate]);

    const formData = checkoutState?.formData;
    const summary = checkoutState?.summary;

    const requiredBudget = summary?.totalLiability ?? 0;
    const walletBalance = Number(wallet?.balance ?? 0);
    const shortfall = Math.max(0, requiredBudget - walletBalance);
    const canLaunch = walletBalance >= requiredBudget && requiredBudget > 0;

    const suggestedTopup = useMemo(() => {
        if (shortfall <= 0) return 5000;
        return Math.ceil(shortfall / 1000) * 1000;
    }, [shortfall]);

    useEffect(() => {
        if (shortfall > 0 && !topupAmount) {
            setTopupAmount(String(suggestedTopup));
        }
    }, [shortfall, suggestedTopup, topupAmount]);

    if (!formData || !summary) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#00B4EB]" />
            </div>
        );
    }

    const handleTopup = () => {
        const value = Number(topupAmount);
        if (!value || value < 100) {
            message.error('Minimum top-up amount is ₹100');
            return;
        }

        topup(value, {
            onSuccess: async () => {
                message.success('Funds added to wallet');
                await refetchWallet();
            },
            onError: (error: Error) => message.error(error.message || 'Top-up failed'),
        });
    };

    const handleLaunch = async () => {
        if (!canLaunch) {
            message.warning(`Add at least ${formatCurrency(shortfall)} to your wallet to launch this campaign.`);
            return;
        }

        setLaunching(true);
        try {
            const payload = buildCampaignPayload(formData, summary.totalLiability);
            const response = await api.post('/campaigns', payload);
            if (response.data.success) {
                clearCampaignCheckoutState();
                message.success('Campaign launched! Budget locked from your wallet.');
                navigate('/brand/campaigns');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || 'Failed to launch campaign');
        } finally {
            setLaunching(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 pb-10">
            <button
                type="button"
                onClick={() => navigate('/brand/campaigns/create', { state: checkoutState })}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={16} /> Back to edit campaign
            </button>

            <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#00B4EB] mb-1">Step 3 of 3</p>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Review & Pay</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Confirm your campaign details, check wallet balance, and add funds if needed before launching.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Campaign summary</h2>
                        <div className="flex gap-3 mb-4">
                            {formData.track_artwork_url ? (
                                <img
                                    src={resolveAssetUrl(formData.track_artwork_url)}
                                    alt=""
                                    className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-100" />
                            )}
                            <div>
                                <p className="font-semibold text-gray-900">{formData.title}</p>
                                <p className="text-xs text-gray-500">
                                    {formData.brand_name || 'Brand'} • {formData.genre || 'Campaign'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm border-t border-gray-50 pt-4 mb-4">
                            {formData.description && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Brief</p>
                                    <p className="text-gray-600 text-xs leading-relaxed">{formData.description}</p>
                                </div>
                            )}
                            {formData.spotify_link && (
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500 shrink-0">Spotify</span>
                                    <span className="text-gray-700 truncate text-xs">{formData.spotify_link}</span>
                                </div>
                            )}
                            {formData.hashtags && (
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500 shrink-0">Hashtags</span>
                                    <span className="text-gray-700 text-xs text-right">{formData.hashtags}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-500">
                                <span>Audience</span>
                                <span className="text-gray-700">
                                    {formData.audience_gender} • {formData.audience_age}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm border-t border-gray-50 pt-4">
                            <div className="flex justify-between text-gray-500">
                                <span>Base allocations</span>
                                <span>{formatCurrency(summary.baseAllocationsTotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Bonus pool ({formData.bonus_max_creators} creators)</span>
                                <span>{formatCurrency(summary.bonusPoolTotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Expected reels</span>
                                <span>{summary.expectedReels}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Campaign budget</span>
                                <span>{formatCurrency(formData.total_budget)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-50">
                                <span>Total required</span>
                                <span>{formatCurrency(requiredBudget)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Wallet size={16} className="text-[#00B4EB]" /> Wallet & billing
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Available balance</p>
                                {walletLoading ? (
                                    <Loader2 size={18} className="animate-spin text-gray-400" />
                                ) : (
                                    <p className="text-xl font-semibold text-gray-900">{formatCurrency(walletBalance)}</p>
                                )}
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                    <Lock size={10} /> Locked in campaigns
                                </p>
                                {walletLoading ? (
                                    <Loader2 size={18} className="animate-spin text-gray-400" />
                                ) : (
                                    <p className="text-xl font-semibold text-amber-600">
                                        {formatCurrency(wallet?.locked_balance ?? 0)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {canLaunch ? (
                            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-6">
                                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-emerald-700">
                                    Sufficient balance available. You can launch this campaign and lock{' '}
                                    {formatCurrency(requiredBudget)} from your wallet.
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-6">
                                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-amber-800">
                                    Insufficient balance. You need <strong>{formatCurrency(shortfall)}</strong> more.
                                    Add funds below via Razorpay, then launch your campaign.
                                </p>
                            </div>
                        )}

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-xs font-semibold text-gray-900 mb-3">Add funds to wallet</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {QUICK_AMOUNTS.map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setTopupAmount(String(amt))}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                            topupAmount === String(amt)
                                                ? 'border-[#00B4EB] bg-[#00B4EB]/10 text-gray-900'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        {formatCurrency(amt)}
                                    </button>
                                ))}
                                {shortfall > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setTopupAmount(String(suggestedTopup))}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                            topupAmount === String(suggestedTopup)
                                                ? 'border-[#FF5A5F] bg-[#FF5A5F]/10 text-[#FF5A5F]'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        Cover shortfall ({formatCurrency(suggestedTopup)})
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                    <input
                                        type="number"
                                        min={100}
                                        value={topupAmount}
                                        onChange={(e) => setTopupAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B4EB]"
                                        placeholder="Amount"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleTopup}
                                    disabled={toppingUp}
                                    className="px-5 py-3 bg-[#00B4EB] hover:bg-[#009fd4] disabled:opacity-60 text-gray-900 text-sm font-semibold rounded-xl flex items-center gap-2 shrink-0"
                                >
                                    {toppingUp ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Add funds
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">Secured by Razorpay • Min ₹100</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLaunch}
                        disabled={launching || walletLoading || !canLaunch}
                        className={`w-full py-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            canLaunch && !launching
                                ? 'bg-[#FF5A5F] text-white hover:bg-[#ff464b] hover:shadow-lg'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {launching ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Launching campaign...
                            </>
                        ) : (
                            <>
                                <Megaphone size={18} /> Pay & Launch — {formatCurrency(requiredBudget)}
                            </>
                        )}
                    </button>

                    {!canLaunch && !walletLoading && (
                        <p className="text-xs text-center text-gray-500">
                            Add funds above to enable launch, or manage wallet in{' '}
                            <Link to="/brand/wallet" className="text-[#00B4EB] hover:underline">
                                Wallet settings
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
