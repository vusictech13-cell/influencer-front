import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    BarChart3,
    Instagram,
    Loader2,
    RefreshCw,
    Star,
    TrendingUp,
    Users,
    Heart,
    MessageCircle,
    Video,
} from 'lucide-react';
import { useAdminCreatorInsights } from '@/hooks/useAdminCreators';
import { formatCount, getVusicRank, type ReelsStats } from '@/utils/creator';
import { resolveAssetUrl } from '@/utils/image';

function StatItem({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className={`text-sm font-semibold tracking-tight ${color}`}>{value}</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{label}</span>
        </div>
    );
}

export default function AdminCreatorInsights() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: syncData, isLoading, refetch, isFetching, isError, error } = useAdminCreatorInsights(id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#00B4EB]" />
            </div>
        );
    }

    if (isError || !syncData) {
        const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Unable to load Instagram insights.';
        return (
            <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-8 border border-gray-100">
                <p className="text-sm text-gray-500">{message}</p>
                <button
                    type="button"
                    onClick={() => navigate(`/admin/creators/${id}`)}
                    className="mt-4 text-sm font-semibold text-[#00B4EB] hover:underline"
                >
                    Back to creator
                </button>
            </div>
        );
    }

    const { profile, top_posts, engagement_rate, influencer_score, adv_stats, creator } = syncData;
    const rank = getVusicRank(profile.followers_count || 0);
    const reelsStats: ReelsStats = syncData.reels_stats ?? {
        total: 0, '>1k': 0, '>10k': 0, '>100k': 0, '>1m': 0, '>10m': 0,
    };
    const avatarUrl = resolveAssetUrl(profile.profile_picture_url || creator.profile_image);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <button
                    type="button"
                    onClick={() => navigate(`/admin/creators/${id}`)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to {creator.name}
                </button>
                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                    Refresh Analytics
                </button>
            </div>

            <div className="flex items-center gap-2">
                <BarChart3 size={24} className="text-[#00B4EB]" />
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Instagram Insights</h1>
                    <p className="text-sm text-gray-500">Full analytics for {creator.name}</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#00B4EB]/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-6 z-10 w-full md:w-auto">
                        <div className="relative">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={profile.name}
                                    className="w-20 h-20 rounded-[1.2rem] border border-gray-100 shadow-sm object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-[1.2rem] bg-[#00B4EB]/20 flex items-center justify-center">
                                    <Users size={28} className="text-[#00B4EB]" />
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                                <Instagram size={14} className="text-[#FF5A5F]" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">{profile.name}</h2>
                            <p className="text-sm font-medium text-gray-500 mb-2">@{profile.username}</p>
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Users size={14} /> {formatCount(profile.followers_count)}
                                </span>
                                <span className="flex items-center gap-1 text-emerald-500">
                                    <TrendingUp size={14} /> {engagement_rate != null ? `${engagement_rate}% ER` : 'ER pending'}
                                </span>
                            </div>
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#FFE98F]/40 text-[#d48e00] px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                <Star size={10} /> Rank {rank.rank} · Score {influencer_score ?? '—'}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end w-full md:w-auto z-10 p-4 md:p-0 bg-gray-50 md:bg-transparent rounded-2xl md:rounded-none">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                            Influencer Score
                        </p>
                        <h3 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">{influencer_score ?? '—'}</h3>
                        <p className="text-xs font-medium text-gray-500 mt-2 max-w-[220px] text-right leading-relaxed">
                            {profile.biography || 'No biography available'}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between overflow-x-auto gap-4">
                    <div className="flex items-center gap-2 min-w-max">
                        <Video size={16} className="text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                            Reels Analytics
                        </span>
                    </div>
                    <div className="flex items-center gap-6 min-w-max text-sm">
                        <StatItem label="Total" value={reelsStats.total} color="text-gray-900" />
                        <StatItem label="> 1K" value={reelsStats['>1k']} color="text-[#00B4EB]" />
                        <StatItem label="> 10K" value={reelsStats['>10k']} color="text-[#FFA542]" />
                        <StatItem label="> 100K" value={reelsStats['>100k']} color="text-[#FF5A5F]" />
                        <StatItem label="> 1M" value={reelsStats['>1m']} color="text-emerald-500" />
                        <StatItem label="> 10M" value={reelsStats['>10m']} color="text-purple-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Followers', value: formatCount(profile.followers_count) },
                    { label: 'Uploads', value: formatCount(profile.media_count ?? 0) },
                    { label: 'Avg. Likes', value: adv_stats ? formatCount(adv_stats.avgLikes) : '—' },
                    { label: 'Avg. Comments', value: adv_stats?.avgComments ?? '—' },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
                    >
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                            {stat.label}
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {adv_stats && (
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <h3 className="text-sm font-semibold text-gray-900 mb-6">Publishing Frequency</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-3xl font-semibold text-gray-900">{adv_stats.postsPerDay}</p>
                            <p className="text-sm text-gray-500 font-medium mt-1">Posts per day</p>
                        </div>
                        <div>
                            <p className="text-3xl font-semibold text-gray-900">{adv_stats.postsPerWeek}</p>
                            <p className="text-sm text-gray-500 font-medium mt-1">Posts per week</p>
                        </div>
                    </div>
                </div>
            )}

            {top_posts?.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-tight text-gray-900 px-2">Top Reels</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {top_posts.map((item) => (
                            <a
                                key={item.id}
                                href={item.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-square relative group overflow-hidden rounded-2xl border border-gray-100 shadow-sm block"
                            >
                                {item.media_url || item.thumbnail_url ? (
                                    <img
                                        src={item.media_url || item.thumbnail_url}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <div className="flex justify-between text-white font-semibold text-xs">
                                        <span className="flex items-center gap-1">
                                            <Heart size={12} /> {formatCount(item.like_count ?? 0)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle size={12} /> {item.comments_count ?? 0}
                                        </span>
                                    </div>
                                    {item.views != null && (
                                        <p className="text-[10px] text-gray-200 mt-1 font-medium">
                                            {formatCount(item.views)} views
                                        </p>
                                    )}
                                    {item.timestamp && (
                                        <p className="text-[10px] text-gray-300 mt-0.5 font-medium">
                                            {new Date(item.timestamp).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
