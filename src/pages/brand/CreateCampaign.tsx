import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";
import {
  AtSign,
  ArrowRight,
  ArrowLeft,
  Globe,
  Trophy,
  Music,
  Building2,
  IndianRupee,
  Link2,
  Users,
  Activity,
  TrendingUp,
  Star,
} from "lucide-react";
import BrandLogoUploader from "@/components/brand/BrandLogoUploader";
import TrackArtworkUploader from "@/components/brand/TrackArtworkUploader";
import type { CampaignCheckoutState, CampaignFormData } from "@/types/campaign";
import { saveCampaignCheckoutState } from "@/utils/campaignCheckoutStorage";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const location = useLocation();
  const restoredState = location.state as CampaignCheckoutState | null;
  const [step, setStep] = useState(restoredState ? 2 : 1);

  const defaultRankAllocations = [
    {
      rank: 1,
      range: "> 1M Followers",
      payout: 5000,
      qty: 2,
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      rank: 2,
      range: "100K - 1M",
      payout: 1500,
      qty: 5,
      color: "text-orange-500 bg-orange-500/10",
    },
    {
      rank: 3,
      range: "10K - 100K",
      payout: 500,
      qty: 20,
      color: "text-yellow-500 bg-yellow-500/10",
    },
    {
      rank: 4,
      range: "1K - 10K",
      payout: 100,
      qty: 50,
      color: "text-blue-500 bg-blue-500/10",
    },
  ];

  const defaultBonusReward = 10000;
  const defaultBonusMaxCreators = 5;
  const defaultBaseTotal = defaultRankAllocations.reduce((sum, r) => sum + r.payout * r.qty, 0);
  const defaultTotalLiability = defaultBaseTotal + defaultBonusReward * defaultBonusMaxCreators;

  const [formData, setFormData] = useState<CampaignFormData>(
    restoredState?.formData ?? {
      title: "",
      spotify_link: "",
      genre: "",
      required_tags: "",
      hashtags: "",
      description: "",
      brand_name: "",
      brand_logo_url: "",
      track_artwork_url: "",
      bonus_target_views: "1M Views",
      bonus_reward: defaultBonusReward,
      bonus_max_creators: defaultBonusMaxCreators,
      audience_gender: "Any",
      audience_age: "Any",
      specific_creators: "",
      total_budget: defaultTotalLiability,
      rank_allocations: defaultRankAllocations,
    },
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAllocationChange = (
    index: number,
    field: "payout" | "qty",
    value: number,
  ) => {
    const newAllocations = [...formData.rank_allocations];
    newAllocations[index] = {
      ...newAllocations[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      rank_allocations: newAllocations,
    }));
  };

  const calculateSubtotal = (payout: number, qty: number) => payout * qty;

  const baseAllocationsTotal = formData.rank_allocations.reduce(
    (sum, r) => sum + calculateSubtotal(r.payout, r.qty),
    0,
  );

  const bonusPoolTotal =
    Number(formData.bonus_reward) * Number(formData.bonus_max_creators);
  const totalLiability = baseAllocationsTotal + bonusPoolTotal;
  const expectedReels = formData.rank_allocations.reduce(
    (sum, r) => sum + r.qty,
    0,
  );

  useEffect(() => {
    setFormData((prev) => {
      if (totalLiability > Number(prev.total_budget)) {
        return { ...prev, total_budget: totalLiability };
      }
      return prev;
    });
  }, [totalLiability]);

  const handleProceedToCheckout = () => {
    if (!formData.title.trim()) {
      message.error("Enter a campaign title in step 1 before proceeding to payment.");
      return;
    }

    const syncedBudget = Math.max(Number(formData.total_budget) || 0, totalLiability);
    const checkoutState = {
      formData: {
        ...formData,
        total_budget: syncedBudget,
      },
      summary: {
        totalLiability,
        baseAllocationsTotal,
        bonusPoolTotal,
        expectedReels,
      },
    } satisfies CampaignCheckoutState;

    saveCampaignCheckoutState(checkoutState);
    navigate("/brand/campaigns/create/checkout", { state: checkoutState });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-gray-900">
      <div className="flex items-center gap-4 mb-6 px-2">
        <div
          className={`flex items-center gap-2 ${step === 1 ? "text-[#00B4EB]" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors duration-500 ${step === 1 ? "border-[#00B4EB] bg-[#00B4EB]/10" : "border-gray-200 bg-white"}`}
          >
            1
          </div>
          <span className="font-medium text-sm">Creative & Brand</span>
        </div>
        <div className="w-16 h-px bg-gray-200"></div>
        <div
          className={`flex items-center gap-2 ${step === 2 ? "text-[#00B4EB]" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors duration-500 ${step === 2 ? "border-[#00B4EB] bg-[#00B4EB]/10" : "border-gray-200 bg-white"}`}
          >
            2
          </div>
          <span className="font-medium text-sm">Targeting & Budget</span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
            Create New Campaign
          </h2>
          <p className="text-sm text-gray-500 mb-8 font-medium">
            Define the creative brief, track details, brand identity, and viral
            bonuses.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-2">
                <Music size={16} /> Track & Guidelines
              </h3>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                  Campaign Name
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Summer Vibes Playlist Promo"
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00B4EB]/30 focus:border-[#00B4EB] transition-all"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                    Spotify Link
                  </label>
                  <div className="relative">
                    <Link2
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      name="spotify_link"
                      value={formData.spotify_link}
                      onChange={handleInputChange}
                      placeholder="https://open.spotify.com/..."
                      className="w-full pl-9 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#00B4EB]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                    Genre
                  </label>
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#00B4EB]"
                  >
                    <option value="">Select...</option>
                    <option value="Pop">Pop</option>
                    <option value="Hip-Hop / Rap">Hip-Hop / Rap</option>
                    <option value="Electronic">Electronic / Dance</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                    Required Tags
                  </label>
                  <div className="relative">
                    <AtSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      name="required_tags"
                      value={formData.required_tags}
                      onChange={handleInputChange}
                      placeholder="@artistname"
                      className="w-full pl-8 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#00B4EB]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                    Hashtags
                  </label>
                  <div className="relative">
                    <AtSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={14}
                    />
                    <input
                      name="hashtags"
                      value={formData.hashtags}
                      onChange={handleInputChange}
                      placeholder="#trending"
                      className="w-full pl-8 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#00B4EB]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                  Creative Brief
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what the creator needs to do in the reel..."
                  className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#00B4EB] resize-none min-h-[100px]"
                ></textarea>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-2">
                <Building2 size={16} /> Brand Context & Assets
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                    Brand Name
                  </label>
                  <input
                    name="brand_name"
                    value={formData.brand_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Spotify India"
                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#00B4EB]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                    Brand Logo
                  </label>
                  <BrandLogoUploader
                    value={formData.brand_logo_url}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, brand_logo_url: url }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-2 block uppercase tracking-wider">
                  Track Artwork
                </label>
                <TrackArtworkUploader
                  value={formData.track_artwork_url}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, track_artwork_url: url }))
                  }
                />
              </div>
              <div className="bg-[#FFE98F]/20 border border-[#FFE98F] rounded-xl p-5">
                <h4 className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <Trophy size={14} className="text-[#FFA542]" /> Viral
                  Milestone Bonus Pool
                </h4>
                <p className="text-[10px] text-gray-600 mb-4 font-medium leading-relaxed">
                  Incentivize top performance. Set a view milestone and reward
                  the first creators who hit it. (Reserved from budget).
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">
                      Target Views
                    </label>
                    <select
                      name="bonus_target_views"
                      value={formData.bonus_target_views}
                      onChange={handleInputChange}
                      className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none"
                    >
                      <option value="100K Views">100K Views</option>
                      <option value="500K Views">500K Views</option>
                      <option value="1M Views">1M Views</option>
                      <option value="10M Views">10M Views</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">
                      Reward (₹)
                    </label>
                    <input
                      name="bonus_reward"
                      type="number"
                      value={formData.bonus_reward}
                      onChange={handleInputChange}
                      className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">
                      Max Creators
                    </label>
                    <input
                      name="bonus_max_creators"
                      type="number"
                      value={formData.bonus_max_creators}
                      onChange={handleInputChange}
                      className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.title}
              className={`px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${formData.title ? "bg-[#00B4EB] text-gray-900 hover:bg-[#009fd4] hover:scale-[1.02]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              Next: Targeting & Budget <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  {formData.title || "Untitled Campaign"}
                </h2>
                <p className="text-sm font-medium text-gray-500 mt-1">
                  Target your audience and allocate funds.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end w-full md:w-auto bg-gray-50 p-4 rounded-2xl border border-gray-100 gap-3">
              {/* <div className="text-right">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Wallet Balance</p>
                <p className={`text-lg font-semibold ${hasEnoughWallet ? 'text-emerald-600' : 'text-[#FF5A5F]'}`}>
                  {formatCurrency(walletBalance)}
                </p>
                {!hasEnoughWallet && (
                  <Link to="/brand/wallet" className="text-[10px] font-semibold text-[#00B4EB] hover:underline">
                    Top up wallet →
                  </Link>
                )}
              </div> */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block text-right">
                  Total Campaign Budget (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IndianRupee size={18} />
                  </span>
                  <input
                    name="total_budget"
                    type="number"
                    value={formData.total_budget}
                    onChange={handleInputChange}
                    className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-2xl font-semibold text-gray-900 focus:outline-none focus:border-[#00B4EB] w-full md:w-56 text-right shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 xl:col-span-8 space-y-6">
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-6">
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
                  <Globe size={16} className="text-[#00B4EB]" /> Audience &
                  Creator Targeting
                </h3>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex gap-4 w-full md:w-1/2">
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                        Audience Gender
                      </label>
                      <select
                        name="audience_gender"
                        value={formData.audience_gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#00B4EB]"
                      >
                        <option>Any</option>
                        <option>Female Primary</option>
                        <option>Male Primary</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                        Audience Age
                      </label>
                      <select
                        name="audience_age"
                        value={formData.audience_age}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#00B4EB]"
                      >
                        <option>Any</option>
                        <option>18-24 (Gen Z)</option>
                        <option>25-34</option>
                      </select>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                      Specific Creators (Optional)
                    </label>
                    <div className="relative">
                      <AtSign
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={14}
                      />
                      <input
                        name="specific_creators"
                        value={formData.specific_creators}
                        onChange={handleInputChange}
                        placeholder="Search & whitelist by handle..."
                        className="w-full pl-8 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#00B4EB]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight px-2 mb-3">
                  Allocations by Vusic Rank
                </h3>
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                  {formData.rank_allocations.map((r, index) => (
                    <div
                      key={r.rank}
                      className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${index !== formData.rank_allocations.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      <div className="flex items-center gap-4 w-full md:w-1/3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.color}`}
                        >
                          {r.rank === 1 && <Star size={16} />}
                          {r.rank === 2 && <TrendingUp size={16} />}
                          {r.rank === 3 && <Users size={16} />}
                          {r.rank === 4 && <Activity size={16} />}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200/50 shadow-sm">
                            Rank {r.rank}
                          </span>
                          <h4 className="font-semibold text-gray-800 text-xs mt-1">
                            {r.range}
                          </h4>
                        </div>
                      </div>
                      <div className="flex flex-col w-full md:w-1/4">
                        <label className="text-[10px] font-medium text-gray-400 mb-1.5">
                          Payout per Reel (₹)
                        </label>
                        <input
                          type="number"
                          value={r.payout}
                          onChange={(e) =>
                            handleAllocationChange(
                              index,
                              "payout",
                              Number(e.target.value),
                            )
                          }
                          className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#00B4EB] w-full shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col w-full md:w-1/4 md:items-center">
                        <label className="text-[10px] font-medium text-gray-400 mb-1.5">
                          Target Quantity
                        </label>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl p-1 w-fit">
                          <button
                            onClick={() =>
                              handleAllocationChange(
                                index,
                                "qty",
                                Math.max(0, r.qty - 1),
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[#FF5A5F]"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={r.qty}
                            onChange={(e) =>
                              handleAllocationChange(
                                index,
                                "qty",
                                Number(e.target.value),
                              )
                            }
                            className="w-10 text-center bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              handleAllocationChange(index, "qty", r.qty + 1)
                            }
                            className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[#00B4EB]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="w-full md:w-1/4 md:text-right">
                        <p className="text-[10px] font-medium text-gray-400 mb-1">
                          Subtotal
                        </p>
                        <p
                          className={`text-sm font-semibold tracking-tight ${r.qty > 0 ? "text-gray-900" : "text-gray-300"}`}
                        >
                          ₹{calculateSubtotal(r.payout, r.qty).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 tracking-tight px-2">
                Financial Projection
              </h3>
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                <div className="space-y-6">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                      Expected Reels
                    </p>
                    <h3 className="text-4xl font-semibold tracking-tight text-gray-900">
                      {expectedReels}
                    </h3>
                  </div>
                  <div className="pt-5 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>Base Allocations</span>
                      <span>₹{baseAllocationsTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-[#FFA542]">
                      <span>Reserved Bonus Pool</span>
                      <span>₹{bonusPoolTotal.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-50">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1">
                        Total Liability
                      </p>
                      <h3
                        className={`text-2xl font-semibold tracking-tight ${totalLiability > Number(formData.total_budget) ? "text-[#FF5A5F]" : "text-gray-900"}`}
                      >
                        ₹{totalLiability.toLocaleString()}
                      </h3>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-2">
                      <span className="text-gray-500">Remaining Budget</span>
                      <span
                        className={
                          totalLiability > Number(formData.total_budget)
                            ? "text-[#FF5A5F]"
                            : "text-emerald-500"
                        }
                      >
                        {totalLiability > Number(formData.total_budget)
                          ? "Over Budget"
                          : `₹${(Number(formData.total_budget) - totalLiability).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${totalLiability > Number(formData.total_budget) ? "bg-[#FF5A5F]" : "bg-[#00B4EB]"}`}
                        style={{
                          width: `${Math.min((totalLiability / Number(formData.total_budget || 1)) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 rounded-xl text-sm font-semibold transition-all duration-300 flex justify-center items-center gap-2 bg-[#FF5A5F] text-white hover:bg-[#ff464b] hover:shadow-lg hover:scale-[1.02]"
                  >
                    Make Payment <IndianRupee size={16} />
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-2">
                    Review campaign details, wallet balance, and add funds on the next step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
