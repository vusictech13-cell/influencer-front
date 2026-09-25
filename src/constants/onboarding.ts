import type { LucideIcon } from 'lucide-react';
import {
    Camera,
    Drama,
    Ellipsis,
    Handshake,
    Link2,
    Music,
    Package,
    Radio,
    Sparkles,
    Star,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';

export const ONBOARDING_FLOW = [
    { step: 1, label: 'Welcome' },
    { step: 2, label: 'Content' },
    { step: 3, label: 'Instagram' },
    { step: 4, label: 'Preferences' },
    { step: 5, label: 'Your profile' },
] as const;

export const CREATOR_TYPES: { id: string; title: string; desc: string; icon: LucideIcon }[] = [
    { id: 'influencer', title: 'Influencer', desc: 'I create original content', icon: Star },
    { id: 'artist', title: 'Artist / Musician', desc: 'Singer, rapper, musician', icon: Music },
    { id: 'music_page', title: 'Music Page / Media', desc: 'Music-focused content & community', icon: Radio },
    { id: 'model', title: 'Model / Actor', desc: 'Visual & performance creator', icon: Camera },
    { id: 'dancer', title: 'Dancer / Performer', desc: 'Dance & performance content', icon: Drama },
    { id: 'agency', title: 'Agency / Talent Manager', desc: 'Manages creators or artists', icon: Users },
    { id: 'other', title: 'Other', desc: 'Something else', icon: Ellipsis },
];

export const CONTENT_CATEGORIES = [
    'Fashion',
    'Beauty',
    'Music',
    'Lifestyle',
    'Travel',
    'Fitness',
    'Food',
    'Comedy',
    'Gaming',
    'Tech',
    'Finance',
    'Education',
    'Entertainment',
    'Sports',
    'Devotional',
    'Dance Reels',
    'Singing',
    'Lip-Sync',
    'Acting',
    'Music Reviews',
    'Cover Songs',
    'Music Reactions',
    'Song Recommendations',
    'Music News',
    'Artist Interviews',
    'Trending Songs',
    'Music Challenges',
    'Music Comedy',
    'Music Education',
    'Behind the Music',
    'Concerts & Live Music',
];

export const OPPORTUNITIES: { id: string; title: string; desc: string; icon: LucideIcon }[] = [
    { id: 'paid', title: 'Paid collaborations', desc: 'Get paid to create content for brands.', icon: Wallet },
    { id: 'product', title: 'Product campaigns', desc: 'Receive products, experiences & exclusive access.', icon: Package },
    { id: 'affiliate', title: 'Affiliate campaigns', desc: 'Earn whenever your audience converts.', icon: Link2 },
    { id: 'partnerships', title: 'Long-term partnerships', desc: 'Build ongoing relationships with brands you love.', icon: Handshake },
];

export const BRAND_INTERESTS = [
    'Music',
    'Entertainment',
    'Fashion',
    'Beauty',
    'Lifestyle',
    'Technology',
    'Food',
    'Travel',
    'Events',
    'Automotive',
    'Finance',
];

export const EARNING_GOALS: { id: string; title: string; desc: string; icon: LucideIcon }[] = [
    { id: 'max_earn', title: 'Maximum earning potential', desc: 'Prioritize higher-value campaigns', icon: TrendingUp },
    { id: 'more_ops', title: 'More opportunities', desc: 'Prioritize campaign volume', icon: Sparkles },
];

export function creatorTypeLabel(id?: string, custom?: string) {
    if (id === 'other' && custom?.trim()) return custom.trim();
    return CREATOR_TYPES.find((item) => item.id === id)?.title || 'Creator';
}
