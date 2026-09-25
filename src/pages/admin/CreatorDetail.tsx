import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
    useAdminCreatorDetail,
    useAdminCreatorInsights,
    useUpdateCreatorFeature,
    type AdminCreatorScore,
} from '@/hooks/useAdminCreators';
import { resolveAssetUrl } from '@/utils/image';
import './CreatorDetail.css';

const BREAKDOWN = [
    { key: 'reach', name: 'Reach Power' },
    { key: 'engagement', name: 'Engagement Quality' },
    { key: 'content', name: 'Content Performance' },
    { key: 'audience', name: 'Audience Scale' },
    { key: 'consistency', name: 'Consistency' },
] as const;

function formatStat(value?: number | null) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    const n = Number(value);
    if (n >= 1_000_000) {
        const v = n / 1_000_000;
        return `${v.toFixed(v >= 10 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1')}M`;
    }
    if (n >= 1_000) {
        const v = n / 1_000;
        if (v >= 100) return `${Math.round(v)}K`;
        return `${v.toFixed(v >= 10 ? 0 : 1).replace(/\.0$/, '')}K`;
    }
    return n.toLocaleString();
}

function formatPct(value?: number | null, digits = 1) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Number(value).toFixed(digits)}%`;
}

function reelTitle(caption?: string) {
    if (!caption?.trim()) return 'Untitled reel';
    const line = caption.trim().split('\n')[0];
    return line.length > 52 ? `${line.slice(0, 52).trim()}…` : line;
}

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function AnalyticsSkeleton() {
    return (
        <div aria-busy="true" aria-live="polite" aria-label="Loading creator analytics">
            <section className="score-grid">
                <div className="card score-card">
                    <div className="score-layout">
                        <div className="sk-ring" />
                        <div className="score-copy" style={{ width: '100%' }}>
                            <span className="sk sk-pill" />
                            <span className="sk sk-title" />
                            <span className="sk sk-line" />
                            <span className="sk sk-line short" />
                        </div>
                    </div>
                </div>

                <div className="card category-card">
                    <span className="sk sk-heading" />
                    <span className="sk sk-subhead" />
                    {BREAKDOWN.map((category) => (
                        <div className="category" key={category.key}>
                            <div className="category-head">
                                <span className="category-name">{category.name}</span>
                                <span className="sk" style={{ width: 28, height: 13 }} />
                            </div>
                            <span className="sk sk-bar" />
                        </div>
                    ))}
                </div>
            </section>

            <section className="section">
                <div className="section-title">
                    <h2>Audience performance</h2>
                    <span>Last 30 days</span>
                </div>
                <div className="metric-grid">
                    {['Average Reach', 'Engagement Rate', 'Avg Reel Views', 'Non-Follower Reach'].map((label) => (
                        <div className="metric" key={label}>
                            <div className="metric-label">{label}</div>
                            <span className="sk sk-metric-value" />
                            <span className="sk sk-metric-change" />
                        </div>
                    ))}
                </div>
            </section>

            <section className="section">
                <div className="section-title">
                    <h2>Engagement quality</h2>
                    <span>Per reached account</span>
                </div>
                <div className="metric-grid">
                    {['Like Rate', 'Comment Rate', 'Save Rate', 'Share Rate'].map((label) => (
                        <div className="metric" key={label}>
                            <div className="metric-label">{label}</div>
                            <span className="sk sk-metric-value" />
                        </div>
                    ))}
                </div>
            </section>

            <section className="section">
                <div className="performance-grid">
                    <div className="card performance-card">
                        <div className="section-title">
                            <h2>Top performing content</h2>
                            <span>Recent posts & Reels</span>
                        </div>
                        {[0, 1, 2].map((row) => (
                            <div className="reel-row" key={row}>
                                <span className="sk sk-thumb" />
                                <div>
                                    <span className="sk" style={{ width: '72%', height: 13, marginBottom: 8 }} />
                                    <span className="sk" style={{ width: '48%', height: 10 }} />
                                </div>
                                <span className="sk" style={{ width: 42, height: 16 }} />
                            </div>
                        ))}
                    </div>

                    <div className="card performance-card">
                        <span className="sk sk-heading" />
                        <span className="sk sk-subhead" />
                        {['Median Reel Views', 'Content above baseline', '30 Day Growth'].map((label) => (
                            <div className="consistency-block" key={label}>
                                <div className="metric-label">{label}</div>
                                <span className="sk sk-metric-value" />
                                <span className="sk sk-metric-change" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function AdminCreatorDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const { data, isLoading, isError } = useAdminCreatorDetail(id);
    const updateFeature = useUpdateCreatorFeature(id);
    const { data: insights, isLoading: insightsLoading } = useAdminCreatorInsights(
        data?.instagram ? id : undefined,
    );

    const score: AdminCreatorScore | undefined = insights?.creator_score;

    const breakdown = useMemo(() => {
        return BREAKDOWN.map((item) => {
            const match = score?.breakdown.find((row) => row.key === item.key);
            return { ...item, score: match?.score ?? null };
        });
    }, [score]);

    if (isLoading) {
        return (
            <div className="creator-score-page -m-6 md:-m-8 min-h-full">
                <div className="page" aria-busy="true" aria-label="Loading creator">
                    <header className="topbar">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/creators')}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to creators
                        </button>
                        <div className="top-actions">
                            <span className="sk" style={{ width: 118, height: 40, borderRadius: 10 }} />
                            <span className="sk" style={{ width: 92, height: 40, borderRadius: 10 }} />
                        </div>
                    </header>

                    <section className="profile-header">
                        <span className="sk sk-avatar" />
                        <div className="profile-info">
                            <span className="sk sk-name" />
                            <span className="sk sk-username" />
                            <span className="sk sk-line" />
                            <span className="sk sk-line short" />
                        </div>
                        <div className="profile-stats">
                            {['Followers', 'Following', 'Media'].map((label) => (
                                <div className="profile-stat" key={label}>
                                    <span className="sk sk-stat" />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <AnalyticsSkeleton />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="creator-score-page -m-6 md:-m-8 min-h-full">
                <div className="page" style={{ textAlign: 'center', paddingTop: 120 }}>
                    <p>Creator not found</p>
                    <button type="button" className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/admin/creators')}>
                        Back to creators
                    </button>
                </div>
            </div>
        );
    }

    const { user, instagram } = data;
    const profile = insights?.profile;
    const displayName = profile?.name || user.name;
    const username = profile?.username || instagram?.username || '';
    const bio = profile?.biography || '';
    const followers = profile?.followers_count ?? instagram?.followers_count ?? 0;
    const following = profile?.follows_count ?? instagram?.following_count ?? 0;
    const mediaCount = profile?.media_count ?? instagram?.total_posts ?? 0;
    const avatarUrl = resolveAssetUrl(profile?.profile_picture_url || instagram?.profile_image || user.profile_image);
    const instagramUrl = username ? `https://instagram.com/${username}` : '';
    const topReels = insights?.top_posts?.slice(0, 3) ?? [];
    const overall = score?.overall;
    const scoreStatus = score?.status || instagram?.score_status;
    const isCollecting = scoreStatus === 'collecting' || (Boolean(instagram) && insightsLoading && overall == null);
    const isIneligible = scoreStatus === 'ineligible';
    const isScoreError = scoreStatus === 'error';
    const ringDeg = Math.max(0, Math.min(100, overall ?? 0)) * 3.6;
    const audience = score?.audience;
    const engagement = score?.engagement;
    const consistency = score?.consistency;
    const showAnalyticsSkeleton = Boolean(instagram) && insightsLoading && !insights;

    const handleShare = async () => {
        if (!instagramUrl) return;
        try {
            await navigator.clipboard.writeText(instagramUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            window.open(instagramUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="creator-score-page -m-6 md:-m-8 min-h-full">
            <div className="page">
                <header className="topbar">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/creators')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to creators
                    </button>
                    {/* <button type="button" className="brand" onClick={() => navigate('/admin/creators')}>
                        TAKI<span>LA</span>
                    </button> */}
                    <div className="top-actions">
                        <button
                            type="button"
                            className="btn"
                            onClick={() => navigate(`/admin/compare?ids=${id}`)}
                        >
                            Compare
                        </button>
                        <button type="button" className="btn" onClick={handleShare} disabled={!instagramUrl}>
                            {copied ? 'Link copied' : 'Share Profile'}
                        </button>
                        <button
                            type="button"
                            className="btn primary"
                            onClick={() => instagramUrl && window.open(instagramUrl, '_blank', 'noopener,noreferrer')}
                            disabled={!instagramUrl}
                        >
                            Connect
                        </button>
                    </div>
                </header>

                <section className="mb-4 rounded-2xl border border-[#e7e7ed] bg-white p-4">
                    <h2 className="text-sm font-bold text-gray-900">Features</h2>
                    <p className="mt-1 text-xs text-gray-500">Allow or disallow tools for this creator. Plans can grant these later.</p>
                    <div className="mt-3 divide-y divide-[#ededf1]">
                        {(data.features || []).map((feature) => (
                            <div key={feature.key} className="flex items-center justify-between gap-3 py-2.5">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{feature.name}</p>
                                    {feature.description && (
                                        <p className="text-xs text-gray-500">{feature.description}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className={feature.enabled ? 'btn primary' : 'btn'}
                                    disabled={updateFeature.isPending}
                                    onClick={() => updateFeature.mutate({ key: feature.key, enabled: !feature.enabled })}
                                >
                                    {feature.enabled ? 'Disallow' : 'Allow'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="profile-header">
                    {avatarUrl ? (
                        <img className="avatar" src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
                    ) : (
                        <div className="avatar avatar-fallback">{initials(displayName) || 'C'}</div>
                    )}

                    <div className="profile-info">
                        <h1>{displayName}</h1>
                        <div className="username">{username ? `@${username}` : ''}</div>
                        <div className="bio">
                            {bio ? bio : insightsLoading ? (
                                <>
                                    <span className="sk sk-line" />
                                    <span className="sk sk-line short" />
                                </>
                            ) : 'No biography available.'}
                        </div>
                    </div>

                    <div className="profile-stats">
                        <div className="profile-stat">
                            <strong>
                                {followers ? formatStat(followers) : insightsLoading ? <span className="sk sk-stat" /> : '—'}
                            </strong>
                            <span>Followers</span>
                        </div>
                        <div className="profile-stat">
                            <strong>
                                {following ? formatStat(following) : insightsLoading ? <span className="sk sk-stat" /> : '—'}
                            </strong>
                            <span>Following</span>
                        </div>
                        <div className="profile-stat">
                            <strong>
                                {mediaCount ? formatStat(mediaCount) : insightsLoading ? <span className="sk sk-stat" /> : '—'}
                            </strong>
                            <span>Media</span>
                        </div>
                    </div>
                </section>

                {showAnalyticsSkeleton ? (
                    <AnalyticsSkeleton />
                ) : (
                <>
                <section className="score-grid">
                    <div className="card score-card">
                        {/* <div className="eyebrow">TAKILA Creator Score</div> */}
                        <div className="score-layout">
                            <div
                                className="score-ring"
                                style={{
                                    background: `conic-gradient(var(--accent) 0deg, var(--accent) ${ringDeg}deg, #f0f0ec ${ringDeg}deg, #f0f0ec 360deg)`,
                                }}
                            > 
                                <div className="score-number">
                                    <strong>{overall ?? '—'}</strong>
                                    <span>{isCollecting ? 'collecting' : 'out of 100'}</span>
                                </div>
                            </div>

                            <div className="score-copy">
                                <div className="rank-pill">● {score?.percentile_label || (insightsLoading ? 'Calculating score' : isIneligible ? 'Not eligible' : 'Score unavailable')}</div>
                                <h2>{score?.label || (insightsLoading ? 'Loading analytics' : instagram ? 'Collecting data' : 'Connect Instagram')}</h2>
                                <p>
                                    {score?.description
                                        || (insightsLoading
                                            ? 'Loading live reach, engagement and content performance.'
                                            : isIneligible
                                                ? 'Creator Score requires an Instagram Professional account (Business or Creator).'
                                                : isScoreError
                                                    ? 'Instagram Insights failed. TapnLike will retry instead of scoring incomplete data.'
                                                    : instagram
                                                        ? 'Need at least 5 recent Reels plus usable Insights before a mature Creator Score is published.'
                                                        : 'Link an Instagram account to generate a live Creator Score.')}
                                </p>
                                {score?.rising_score != null ? (
                                    <div className="rising-score">Rising Score {score.rising_score}</div>
                                ) : null}
                                {score?.badges?.length ? (
                                    <div className="badges">
                                        {score.badges.map((badge) => (
                                            <span key={badge.key} className={`badge ${badge.tone}`}>{badge.label}</span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="card category-card">
                        <div className="eyebrow">Score breakdown</div>
                        <h3>Where the score comes from</h3>
                        {breakdown.map((category) => (
                            <div className="category" key={category.key}>
                                <div className="category-head">
                                    <span className="category-name">{category.name}</span>
                                    <span className="category-score">{category.score ?? '—'}</span>
                                </div>
                                <div className="bar">
                                    <span style={{ width: `${Math.max(0, Math.min(100, category.score ?? 0))}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="section">
                    <div className="section-title">
                        <h2>Audience performance</h2>
                        <span>Last 30 days</span>
                    </div>
                    <div className="metric-grid">
                        <div className="metric">
                            <div className="metric-label">Average Reach</div>
                            <div className="metric-value">{audience?.avg_reach ? formatStat(audience.avg_reach) : '—'}</div>
                            {audience?.avg_reach_change ? <div className="metric-change">{audience.avg_reach_change}</div> : null}
                        </div>
                        <div className="metric">
                            <div className="metric-label">Engagement Rate</div>
                            <div className="metric-value">{audience ? formatPct(audience.engagement_rate) : '—'}</div>
                            {audience?.engagement_change ? <div className="metric-change">{audience.engagement_change}</div> : null}
                        </div>
                        <div className="metric">
                            <div className="metric-label">Avg Reel Views</div>
                            <div className="metric-value">{audience?.avg_reel_views ? formatStat(audience.avg_reel_views) : '—'}</div>
                            {audience?.avg_reel_views_change ? <div className="metric-change">{audience.avg_reel_views_change}</div> : null}
                        </div>
                        <div className="metric">
                            <div className="metric-label">Non-Follower Reach</div>
                            <div className="metric-value">{formatPct(audience?.non_follower_reach_pct, 0)}</div>
                            {audience?.non_follower_note ? <div className="metric-change">{audience.non_follower_note}</div> : null}
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="section-title">
                        <h2>Engagement quality</h2>
                        <span>Per reached account</span>
                    </div>
                    <div className="metric-grid">
                        <div className="metric">
                            <div className="metric-label">Like Rate</div>
                            <div className="metric-value">{engagement ? formatPct(engagement.like_rate) : '—'}</div>
                        </div>
                        <div className="metric">
                            <div className="metric-label">Comment Rate</div>
                            <div className="metric-value">{engagement ? formatPct(engagement.comment_rate, 2) : '—'}</div>
                        </div>
                        <div className="metric">
                            <div className="metric-label">Save Rate</div>
                            <div className="metric-value">{formatPct(engagement?.save_rate)}</div>
                        </div>
                        <div className="metric">
                            <div className="metric-label">Share Rate</div>
                            <div className="metric-value">{formatPct(engagement?.share_rate, 2)}</div>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="performance-grid">
                        <div className="card performance-card">
                            <div className="section-title">
                        <h2>Top performing content</h2>
                        <span>Recent posts & Reels</span>
                            </div>
                            {topReels.length === 0 ? (
                                <div className="empty-reels">No posts found in the last 90 days.</div>
                            ) : (
                                topReels.map((reel) => (
                                    <a
                                        key={reel.id}
                                        className="reel-row"
                                        href={reel.permalink || undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {reel.thumbnail_url || reel.media_url ? (
                                            <img
                                                className="reel-thumb"
                                                src={reel.thumbnail_url || reel.media_url}
                                                alt=""
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="reel-thumb" />
                                        )}
                                        <div>
                                            <div className="reel-title">{reelTitle(reel.caption)}</div>
                                            <div className="reel-meta">
                                                {formatStat(reel.like_count)} likes · {formatStat(reel.comments_count)} comments
                                                {reel.saved != null ? ` · ${formatStat(reel.saved)} saves` : ''}
                                            </div>
                                        </div>
                                        <div className="reel-views">
                                            <strong>{formatStat(reel.views)}</strong>
                                            <span>views</span>
                                        </div>
                                    </a>
                                ))
                            )}
                        </div>

                        <div className="card performance-card">
                            <div className="eyebrow">Consistency</div>
                            <h2 className="consistency-title">{consistency?.title || 'Reliable performance'}</h2>

                            <div className="consistency-block">
                                <div className="metric-label">Median Reel Views</div>
                                <div className="metric-value">
                                    {consistency?.median_reel_views ? formatStat(consistency.median_reel_views) : '—'}
                                </div>
                                {consistency?.median_note ? <div className="metric-change">{consistency.median_note}</div> : null}
                            </div>

                            <div className="consistency-block">
                                <div className="metric-label">Content above baseline</div>
                                <div className="metric-value">{consistency ? formatPct(consistency.above_baseline_pct, 0) : '—'}</div>
                                {consistency?.baseline_note ? <div className="metric-change">{consistency.baseline_note}</div> : null}
                            </div>

                            <div className="consistency-block">
                                <div className="metric-label">30 Day Growth</div>
                                <div className="metric-value">
                                    {consistency?.growth_30d_pct != null
                                        ? `+${Math.round(consistency.growth_30d_pct)}%`
                                        : '—'}
                                </div>
                                {consistency?.growth_note ? <div className="metric-change">{consistency.growth_note}</div> : null}
                            </div>
                        </div>
                    </div>
                </section>

                </>
                )}

                <div className="score-note">
                    Creator Score is calculated using recent reach, weighted engagement,
                    content performance, audience scale and consistency.
                    Scores are percentile-benchmarked against creators of similar audience size.
                    Missing Insights are excluded rather than treated as zero.
                </div>
            </div>
        </div>
    );
}
