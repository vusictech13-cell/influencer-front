import { Link } from 'react-router-dom';
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Instagram,
    Search,
    Shield,
    Sparkles,
    Target,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { COMPANY } from '@/constants/company';

const STEPS = [
    {
        step: '01',
        title: 'Creators Join',
        description:
            'Creators create their profile and connect their Instagram account with authorization.',
        icon: Instagram,
    },
    {
        step: '02',
        title: 'We Analyze',
        description:
            'MeloTap analyzes authorized creator and content metrics to build a detailed creator profile.',
        icon: BarChart3,
    },
    {
        step: '03',
        title: 'Brands Discover',
        description:
            'Brands and labels search and filter creators based on relevant audience, content and performance characteristics.',
        icon: Search,
    },
    {
        step: '04',
        title: 'Collaborate & Grow',
        description:
            'Brands select creators for campaigns designed to increase reach, engagement and content visibility.',
        icon: TrendingUp,
    },
];

const ANALYTICS_FEATURES = [
    'Profile & account metrics',
    'Reels engagement (likes, comments, views)',
    'Content performance summaries',
    'Engagement rate & influencer scoring',
    'Reels performance distribution',
    'Posting activity patterns',
    'Creator classification (Vusic Rank)',
    'Campaign suitability signals',
];

const WHY_CARDS = [
    {
        title: 'Data-Driven Discovery',
        description: 'Find creators using meaningful performance and content signals.',
        icon: Target,
    },
    {
        title: 'Creator Intelligence',
        description: 'Understand creator profiles beyond follower count.',
        icon: Sparkles,
    },
    {
        title: 'Campaign Matching',
        description: 'Identify creators based on campaign requirements.',
        icon: CheckCircle2,
    },
    {
        title: 'Built for Brands & Labels',
        description: 'One platform for influencer discovery and collaboration.',
        icon: Users,
    },
];

export default function Home() {
    return (
        <>
            {/* Hero */}
            <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
                <div className="container py-20 md:py-28">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                          hello this kundan .{' '}
                            <span className="text-primary">Create Content That Reaches Further.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            MeloTap is an influencer marketing platform that helps brands and music labels
                            discover, evaluate and collaborate with Instagram creators using data-driven
                            creator insights.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <Button asChild size="lg" className="w-full sm:w-auto">
                                <Link to="/login">
                                    Find Influencers
                                    <ArrowRight className="ml-1" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                                <Link to="/register">Join as Creator</Link>
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground pt-2">
                            Powered by <span className="font-semibold text-foreground">{COMPANY.legalName}</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* What is MeloTap */}
            <section className="py-16 md:py-20">
                <div className="container max-w-3xl text-center space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight">What is MeloTap?</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">MeloTap is a technology platform connecting brands, music labels and creators.</strong>
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                        Brands and labels can discover relevant Instagram creators, evaluate creator performance
                        and find influencers suited to their campaign objectives. Creators can onboard their
                        Instagram accounts and share authorized account and content information to build their
                        creator profile.
                    </p>
                </div>
            </section>

            {/* Data flow diagram */}
            <section className="py-12 bg-muted/30 border-y">
                <div className="container max-w-4xl">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 text-center">
                        {[
                            { label: 'Instagram Creator', sub: 'authorizes account' },
                            { label: 'MeloTap', sub: 'analyzes permitted data' },
                            { label: 'Creator Intelligence', sub: 'profile & classification' },
                            { label: 'Brand / Label', sub: 'discovers creators' },
                            { label: 'Campaign', sub: 'collaboration' },
                        ].map((item, i, arr) => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className="bg-white border rounded-xl px-4 py-3 flex flex-col justify-center items-center shadow-sm w-[150px] h-[100px]">
                                    <p className="font-semibold text-sm">{item.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                                </div>
                                {i < arr.length - 1 && (
                                    <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-16 md:py-20 scroll-mt-16">
                <div className="container">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
                        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                            From creator authorization to brand collaboration in four simple steps.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
                        {STEPS.map((step) => (
                            <Card key={step.step} className="relative">
                                <CardContent className="pt-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-bold text-primary/20">{step.step}</span>
                                        <step.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-lg">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Creator Analytics */}
            <section className="py-16 md:py-20 bg-muted/30">
                <div className="container">
                    <div className="max-w-3xl mx-auto text-center mb-10">
                        <h2 className="text-3xl font-bold tracking-tight">
                            Data That Helps Brands Find the Right Creator
                        </h2>
                        <p className="text-muted-foreground mt-3 leading-relaxed">
                            When creators authorize their Instagram account, MeloTap uses permitted platform
                            data to build creator profiles and help brands make informed collaboration decisions.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                        {ANALYTICS_FEATURES.map((feature) => (
                            <div
                                key={feature}
                                className="flex items-start gap-2 bg-white border rounded-lg p-3 text-sm"
                            >
                                <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* For Brands */}
            <section id="for-brands" className="py-16 md:py-20 scroll-mt-16">
                <div className="container max-w-3xl text-center space-y-5">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Discover Creators That Fit Your Campaign
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Stop choosing influencers based only on follower count. MeloTap helps brands and music
                        labels discover and evaluate creators using creator and content insights, making it
                        easier to identify influencers relevant to their campaign objectives.
                    </p>
                    <Button asChild size="lg">
                        <Link to="/login">
                            Explore Creators
                            <ArrowRight className="ml-1" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* For Creators */}
            <section id="for-creators" className="py-16 md:py-20 bg-primary/5 scroll-mt-16">
                <div className="container max-w-3xl text-center space-y-5">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Turn Your Influence Into Opportunities
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Build your creator profile, connect your Instagram account and showcase your content
                        and performance to brands and labels looking for creators to collaborate with.
                    </p>
                    <Button asChild size="lg">
                        <Link to="/register">
                            Join MeloTap
                            <ArrowRight className="ml-1" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Why MeloTap */}
            <section className="py-16 md:py-20">
                <div className="container">
                    <h2 className="text-3xl font-bold tracking-tight text-center mb-10">Why MeloTap?</h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
                        {WHY_CARDS.map((card) => (
                            <Card key={card.title}>
                                <CardContent className="pt-6 space-y-3">
                                    <card.icon className="h-6 w-6 text-primary" />
                                    <h3 className="font-semibold">{card.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {card.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Privacy / Data */}
            <section className="py-16 md:py-20 bg-muted/30 border-t">
                <div className="container max-w-3xl text-center space-y-5">
                    <Shield className="h-10 w-10 text-primary mx-auto" />
                    <h2 className="text-3xl font-bold tracking-tight">Your Data, Your Authorization</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        MeloTap only accesses information that creators authorize through the applicable
                        platform permissions. We use authorized data to provide creator discovery, analytics
                        and campaign matching features. We do not sell Instagram Platform Data to third parties.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
                        <Link to="/privacy-policy" className="text-primary hover:underline">
                            Privacy Policy
                        </Link>
                        <span className="text-muted-foreground">|</span>
                        <Link to="/terms-of-service" className="text-primary hover:underline">
                            Terms of Service
                        </Link>
                        <span className="text-muted-foreground">|</span>
                        <Link to="/data-deletion" className="text-primary hover:underline">
                            Data Deletion
                        </Link>
                    </div>
                </div>
            </section>

            {/* About teaser */}
            <section className="py-16 md:py-20">
                <div className="container max-w-3xl text-center space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight">About MeloTap</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        {COMPANY.description}
                    </p>
                    <Button asChild variant="outline">
                        <Link to="/about">Learn more about {COMPANY.legalName}</Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
