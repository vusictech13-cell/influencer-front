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
           <section className="container mx-auto px-6 pt-8 pb-16 lg:pt-12 lg:pb-24 relative overflow-hidden lg:overflow-visible">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Text Content */}
                    <div className="max-w-xl relative z-10 mx-auto text-center lg:text-left lg:mx-0">
                        <p className="text-xs font-semibold tracking-widest text-brand-gray uppercase mb-4 lg:mb-6 flex items-center justify-center lg:justify-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            CALLING ALL CREATORS
                        </p>

                        <h1 className="font-heading font-bold text-5xl sm:text-6xl leading-[1.1] mb-6">
                            Create content.
                            <br />
                            <span className="text-brand-yellow">
                                Earn what you're
                                <br className="hidden sm:block" />
                                worth.
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
                            Join TapnLike to connect with top brands and music labels.
                            Land exclusive campaigns, monetize your influence, and get
                            paid for what you do best.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to="/register"
                                className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-medium px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(255,215,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,215,0,0.23)] hover:-translate-y-0.5"
                            >
                                Start Earning Today

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </Link>

                            <a
                                href="#how-it-works"
                                className="bg-white border-2 border-gray-200 hover:border-gray-300 text-brand-dark font-medium px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all"
                            >
                                How It Works
                            </a>
                        </div>
                    </div>


                    {/* Right Image Collage */}
                    <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] w-full mt-10 lg:mt-0">

                        {/* Background Blob */}
                        <div className="absolute top-0 lg:top-10 right-0 lg:right-10 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-brand-yellow/20 blob-shape-1 z-0 animate-float-slow"></div>

                        {/* Handwritten Note */}
                        <div className="absolute -top-4 left-4 lg:left-10 font-handwriting text-xl lg:text-2xl handwritten-text text-gray-800 z-20 leading-tight animate-float-medium">
                            GET PAID
                            <br />
                            TO BE
                            <br />
                            YOU
                            <br />
                            ♡
                        </div>

                        {/* Decorative Lines */}
                        <svg
                            className="absolute top-10 lg:-top-10 right-10 lg:right-32 w-12 h-12 lg:w-16 lg:h-16 text-brand-yellow animate-float-fast"
                            viewBox="0 0 100 100"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                x="20"
                                y="0"
                                width="8"
                                height="40"
                                rx="4"
                                transform="rotate(30 20 0)"
                            />
                            <rect
                                x="60"
                                y="10"
                                width="8"
                                height="30"
                                rx="4"
                                transform="rotate(-15 60 10)"
                            />
                        </svg>

                        {/* Main Image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:top-12 lg:-translate-y-0 w-48 h-56 sm:w-60 sm:h-72 lg:w-72 lg:h-80 bg-gray-200 rounded-3xl overflow-hidden z-10 transform -rotate-6 shadow-xl border-4 border-white transition-transform hover:rotate-0 duration-300">
                            <img 
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop" 
                                alt="Main Creator" 
                                className="w-full h-full object-cover" 
                            />
                        </div>

                        {/* Top Right Image */}
                        <div className="absolute top-4 lg:-top-4 right-0 lg:right-4 w-36 h-40 sm:w-48 sm:h-56 lg:w-56 lg:h-64 bg-gray-300 rounded-3xl overflow-hidden z-0 transform rotate-6 shadow-lg border-4 border-white transition-transform hover:rotate-12 duration-300">
                            <img 
                                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop" 
                                alt="Top Right Creator" 
                                className="w-full h-full object-cover" 
                            />
                        </div>

                        {/* Bottom Right Image */}
                        <div className="absolute bottom-8 lg:bottom-16 right-4 lg:right-12 w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 bg-gray-200 rounded-3xl overflow-hidden z-20 transform -rotate-3 shadow-xl border-4 border-white transition-transform hover:-rotate-12 duration-300">
                            <img 
                                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop" 
                                alt="Bottom Right Creator" 
                                className="w-full h-full object-cover" 
                            />
                        </div>

                        {/* Floating Stats */}
                        <div className="absolute bottom-16 sm:bottom-20 lg:bottom-40 left-0 sm:left-4 lg:left-auto lg:-right-8 bg-white p-3 lg:p-4 rounded-2xl shadow-xl z-30 flex items-center gap-3 lg:gap-4 animate-float-medium transform lg:rotate-0 scale-90 sm:scale-100">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-end gap-1">
                                <div className="w-2 h-3 lg:w-2.5 lg:h-4 bg-brand-orange rounded-sm"></div>
                                <div className="w-2 h-5 lg:w-2.5 lg:h-7 bg-brand-orange rounded-sm"></div>
                                <div className="w-2 h-8 lg:w-2.5 lg:h-10 bg-brand-orange rounded-sm"></div>
                            </div>

                            <div>
                                <p className="text-xs lg:text-sm font-semibold leading-tight">
                                    Brand Deals
                                </p>
                                <p className="text-xs lg:text-sm font-semibold leading-tight">
                                    Music Promos
                                </p>
                                <p className="text-xs lg:text-sm font-semibold leading-tight">
                                    Steady Payouts
                                </p>
                            </div>
                        </div>

                        {/* Bottom Handwritten */}
                        <div className="absolute -bottom-4 lg:bottom-0 right-4 lg:right-10 font-handwriting text-xl lg:text-2xl handwritten-text-right text-gray-800 z-20 leading-tight animate-float-slow">
                            CREATE
                            <br />
                            COLLABORATE
                            <br />
                            CASH OUT

                            <svg
                                className="w-16 h-2 lg:w-20 lg:h-2 mt-1 text-brand-yellow"
                                viewBox="0 0 100 10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                            >
                                <path d="M5 5 Q 50 10 95 2" />
                            </svg>
                        </div>
                    </div>
                </div>
            </section>
            <section className="border-y border-gray-100 py-10">
                <div className="container mx-auto px-6">
                    <p className="text-[10px] font-semibold tracking-widest text-brand-gray uppercase mb-8 text-center sm:text-left">
                        TRUSTED BY FORWARD-THINKING ARTISTS & BRANDS
                    </p>

                    <div className="flex flex-wrap justify-center sm:justify-between items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="h-8 flex items-center justify-center text-sm font-bold tracking-widest text-gray-800">
                            UNIVERSAL
                        </div>

                        <div className="h-8 flex items-center justify-center text-sm font-bold text-gray-800">
                            <span className="text-xl mr-1">W</span>
                            WARNER MUSIC GROUP
                        </div>

                        <div className="h-8 flex items-center justify-center text-sm font-bold text-gray-800">
                            SONY MUSIC
                        </div>

                        <div className="h-8 flex items-center justify-center text-sm font-bold text-gray-800">
                            <span className="text-green-500 mr-1">●</span>
                            Spotify
                        </div>

                        <div className="h-8 flex items-center justify-center text-xl font-bold tracking-tighter text-blue-800">
                            SAMSUNG
                        </div>

                        <div className="h-8 flex items-center justify-center text-lg font-bold text-red-600">
                            ZOMATO
                        </div>

                        <div className="h-10 flex items-center justify-center text-sm font-bold text-red-700">
                            Red Bull
                        </div>
                    </div>
                </div>
            </section>
            <section
                id="creators"
                className="bg-brand-lightbg py-16 lg:py-24 relative overflow-hidden"
            >
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                        {/* Text */}
                        <div className="max-w-xl order-1 relative z-10 mx-auto text-center lg:text-left lg:mx-0">
                            <p className="text-xs font-semibold tracking-widest text-brand-gray uppercase mb-4">
                                FOR CREATORS
                            </p>

                            <h2 className="font-heading font-bold text-4xl sm:text-5xl leading-tight mb-6">
                                Turn your
                                <br className="hidden sm:block" />
                                creativity into
                                <br />
                                <span className="text-brand-orange">
                                    opportunities.
                                </span>
                            </h2>

                            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                                Get discovered, collaborate with top brands and artists,
                                and do what you love — on your terms.
                            </p>

                            <Link
                                to="/register"
                                className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-medium px-8 py-3.5 rounded-full inline-flex items-center justify-center gap-2 transition-all shadow-md"
                            >
                                Join as a Creator

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </Link>
                        </div>


                        {/* Creator Visual */}
                        <div className="relative h-[400px] sm:h-[500px] order-2 mt-8 lg:mt-0 w-full max-w-lg mx-auto">

                            <div className="absolute inset-4 lg:inset-0 bg-brand-yellow rounded-[40px] transform rotate-3 scale-95 origin-center"></div>

                            <div className="absolute inset-4 lg:inset-0 bg-gray-200 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white transform -rotate-2 transition-transform hover:rotate-0 duration-300">
                                <img 
                                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop" 
                                    alt="Creator Visual" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>

                            {/* Floating Left */}
                            <div className="absolute top-12 left-0 sm:-left-8 lg:-left-12 bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-20 animate-float-medium scale-90 sm:scale-100">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500"
                                >
                                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                </svg>

                                <div className="leading-tight">
                                    <span className="block text-[10px] sm:text-xs font-semibold">
                                        Do
                                    </span>
                                    <span className="block text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                                        What You Love
                                    </span>
                                </div>
                            </div>

                            {/* Floating Right */}
                            <div className="absolute top-20 right-0 sm:-right-8 lg:-right-16 bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-xl z-20 flex flex-col gap-2 sm:gap-3 scale-90 sm:scale-100 animate-float-slow">

                                <div className="flex items-center gap-2 sm:gap-3 bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-sm">
                                    <span className="text-orange-400 text-base sm:text-lg">🛍️</span>
                                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                        Brand Collaborations
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-sm">
                                    <span className="text-pink-500 text-base sm:text-lg">🎵</span>
                                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                        Music Campaigns
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-sm">
                                    <span className="text-purple-500 text-base sm:text-lg">👤</span>
                                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                        Get Discovered
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-sm">
                                    <div className="flex items-end gap-0.5">
                                        <div className="w-1 sm:w-1.5 h-1.5 sm:h-2 bg-red-400 rounded-sm"></div>
                                        <div className="w-1 sm:w-1.5 h-2.5 sm:h-3 bg-red-400 rounded-sm"></div>
                                        <div className="w-1 sm:w-1.5 h-3.5 sm:h-4 bg-red-400 rounded-sm"></div>
                                    </div>

                                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                                        Grow Your Audience
                                    </span>
                                </div>
                            </div>

                            {/* Handwritten */}
                            <div className="absolute -bottom-6 sm:-bottom-8 right-0 sm:right-4 lg:right-0 font-handwriting text-xl sm:text-2xl handwritten-text-right text-gray-800 z-20 leading-tight animate-float-medium">
                                MORE
                                <br />
                                CREATIVE
                                <br />
                                DAYS
                                <br />
                                AHEAD :)
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section
                id="music"
                className="bg-brand-pinkbg py-16 lg:py-24 relative overflow-hidden"
            >
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                        {/* Visual */}
                        <div className="relative h-[450px] sm:h-[550px] lg:h-[600px] order-2 lg:order-1 mt-8 lg:mt-0 w-full max-w-lg mx-auto">

                            <div className="absolute top-1/4 lg:top-1/2 left-2 sm:-left-4 lg:-left-12 -translate-y-1/2 font-handwriting text-xl sm:text-2xl handwritten-text text-gray-800 z-30 leading-tight animate-float-medium">
                                REAL
                                <br />
                                CREATORS
                                <br />
                                REAL REELS
                                <br />
                                REAL REACH
                            </div>

                            {/* Phone */}
                            <div className="absolute left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-8 bottom-0 w-[240px] sm:w-[260px] lg:w-[280px] h-[450px] sm:h-[480px] lg:h-[520px] bg-gray-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl z-20 border-[6px] sm:border-8 border-gray-800 overflow-hidden transform -rotate-3 lg:-rotate-6 transition-transform hover:rotate-0 duration-300">

                                <div className="w-full h-full flex flex-col justify-end p-3 sm:p-4 text-white relative">

                                    <img 
                                        src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop" 
                                        alt="Video playing mockup" 
                                        className="absolute inset-0 w-full h-full object-cover opacity-80" 
                                    />

                                    <div className="relative z-10 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                                            <img 
                                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" 
                                                alt="Arjun Profile" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>

                                        <div>
                                            <p className="font-semibold text-sm drop-shadow-md">
                                                Midnight Drive
                                            </p>
                                            <p className="text-xs opacity-80 drop-shadow-md">
                                                Arjun
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 relative z-10">
                                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-gray-900">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                className="w-3 h-3"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>

                                        <div className="flex-1 h-8 flex items-center gap-0.5 overflow-hidden opacity-80">
                                            {[3, 5, 8, 4, 6, 2, 7, 4, 6, 3, 5, 2, 4, 6].map(
                                                (height, index) => (
                                                    <div
                                                        key={index}
                                                        className="w-1 bg-white rounded-full"
                                                        style={{ height: `${height * 4}px` }}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Video 1 */}
                            <div className="absolute top-4 lg:top-12 right-0 sm:right-8 lg:right-12 w-32 h-44 sm:w-36 sm:h-52 lg:w-40 lg:h-56 bg-gray-200 rounded-2xl shadow-xl z-10 border-4 border-white transform rotate-6 overflow-hidden animate-float-slow">
                                <img 
                                    src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400&auto=format&fit=crop" 
                                    alt="Video 1" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-black/50 text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-1">
                                    ▶ 2.4M
                                </div>
                            </div>

                            {/* Video 2 */}
                            <div className="absolute top-1/2 -translate-y-1/2 right-0 lg:right-4 w-28 h-36 sm:w-32 sm:h-44 lg:w-36 lg:h-48 bg-gray-300 rounded-2xl shadow-xl z-10 border-4 border-white transform -rotate-3 overflow-hidden animate-float-medium">
                                <img 
                                    src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop" 
                                    alt="Video 2" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-black/50 text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-1">
                                    ▶ 1.1M
                                </div>
                            </div>

                            {/* Video 3 */}
                            <div className="absolute bottom-12 lg:bottom-16 right-4 sm:right-12 lg:right-20 w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gray-200 rounded-2xl shadow-xl z-10 border-4 border-white transform rotate-3 overflow-hidden animate-float-fast">
                                <img 
                                    src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop" 
                                    alt="Video 3" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-black/50 text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-1">
                                    ▶ 925K
                                </div>
                            </div>
                        </div>


                        {/* Text */}
                        <div className="max-w-xl relative z-10 order-1 lg:order-2 mx-auto text-center lg:text-left lg:mx-0">

                            <p className="text-xs font-semibold tracking-widest text-brand-gray uppercase mb-4">
                                FOR MUSIC LABELS & ARTISTS
                            </p>

                            <h2 className="font-heading font-bold text-4xl sm:text-5xl leading-tight mb-6">
                                Get creators making reels on your song.{' '}
                                <span className="text-brand-orange">
                                    Day 1.
                                </span>
                            </h2>

                            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                                Launch your track with a wave of authentic creator
                                content. TapnLike helps you find the right creators,
                                briefing, tracking and real-time results — all in one
                                place.
                            </p>

                            <Link
                                to="/register"
                                className="bg-brand-orange hover:bg-orange-500 text-white font-medium px-8 py-3.5 rounded-full inline-flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(255,127,80,0.39)]"
                            >
                                Promote Your Music

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            {/* =========================================================
                FOR BRANDS
            ========================================================= */}
            <section
                id="brands"
                className="bg-white py-16 lg:py-24 relative overflow-hidden"
            >
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                        {/* Text */}
                        <div className="max-w-xl order-1 relative z-10 mx-auto text-center lg:text-left lg:mx-0">

                            <p className="text-xs font-semibold tracking-widest text-brand-gray uppercase mb-4">
                                FOR BRANDS
                            </p>

                            <h2 className="font-heading font-bold text-4xl sm:text-5xl leading-tight mb-6">
                                Real creators
                                <br />
                                for{' '}
                                <span className="text-brand-yellow">
                                    real results.
                                </span>
                            </h2>

                            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                                Work with authentic creators who bring your brand to
                                life. From product showcases to cultural moments,
                                create campaigns that actually connect.
                            </p>

                            <Link
                                to="/register"
                                className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-medium px-8 py-3.5 rounded-full inline-flex items-center justify-center gap-2 transition-all shadow-md"
                            >
                                Work with Creators

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </Link>
                        </div>


                        {/* Brand Visual */}
                        <div className="relative h-[400px] sm:h-[450px] lg:h-[500px] order-2 mt-8 lg:mt-0 w-full max-w-lg mx-auto">

                            <div className="absolute inset-0 bg-brand-yellow/30 blob-shape-2 transform -rotate-12 scale-110 origin-center z-0 animate-float-slow"></div>

                            <div className="absolute left-4 right-4 sm:left-auto sm:right-0 top-1/2 -translate-y-1/2 w-auto sm:w-4/5 h-[90%] sm:h-4/5 bg-gray-200 rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl z-10 border-4 border-white transition-transform hover:scale-[1.02] duration-300">
                                <img 
                                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop" 
                                    alt="Brand Creator Image" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>

                            {/* Stats */}
                            <div className="absolute top-4 sm:top-12 right-0 sm:-right-4 lg:right-0 bg-white p-4 sm:p-5 rounded-2xl shadow-xl z-20 w-48 sm:w-56 scale-90 sm:scale-100 animate-float-medium">

                                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">
                                    Campaign Reach
                                </p>

                                <p className="text-2xl sm:text-3xl font-heading font-bold mb-2">
                                    12.5M
                                </p>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-semibold text-green-500 flex items-center gap-1">
                                        ↗ +248%
                                    </span>

                                    <div className="flex items-end gap-1 sm:gap-1.5 h-6 sm:h-8">
                                        <div className="w-1.5 sm:w-2 h-2 sm:h-3 bg-orange-200 rounded-sm"></div>
                                        <div className="w-1.5 sm:w-2 h-3.5 sm:h-5 bg-orange-300 rounded-sm"></div>
                                        <div className="w-1.5 sm:w-2 h-2.5 sm:h-4 bg-orange-400 rounded-sm"></div>
                                        <div className="w-1.5 sm:w-2 h-5 sm:h-8 bg-orange-500 rounded-sm"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Handwritten */}
                            <div className="absolute -bottom-4 right-4 sm:right-8 lg:right-12 font-handwriting text-xl sm:text-2xl handwritten-text-right text-gray-800 z-20 leading-tight animate-float-slow">
                                GOOD
                                <br />
                                IDEAS
                                <br />
                                LOOK EVEN
                                <br />
                                BETTER
                                <br />
                                IN REAL LIFE
                                <br />
                                :)
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* =========================================================
                HOW IT WORKS / COMPARISON
            ========================================================= */}
            <section
                id="how-it-works"
                className="bg-gray-50 py-20 lg:py-28"
            >
                <div className="container mx-auto px-6">

                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
                            Stop managing spreadsheets.
                            <br className="hidden sm:block" />
                            Start managing{' '}
                            <span className="text-brand-orange">
                                growth
                            </span>
                            .
                        </h2>

                        <p className="text-gray-600 text-lg">
                            The traditional way of influencer marketing is broken.
                            We built a better way.
                        </p>
                    </div>


                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">

                        {/* Traditional */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">

                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                    <span className="text-xl">!</span>
                                </div>

                                <h3 className="font-heading font-bold text-xl text-gray-400">
                                    The Traditional Agency
                                </h3>
                            </div>

                            <ul className="space-y-5 text-gray-500 flex-1">

                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✕</span>
                                    <span>
                                        Limited pool of 50-100 "go-to" creators
                                        shared via Excel.
                                    </span>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✕</span>
                                    <span>
                                        Chaotic communication through endless
                                        WhatsApp groups.
                                    </span>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✕</span>
                                    <span>
                                        Manual tracking of deliverables, leading
                                        to missed posts.
                                    </span>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✕</span>
                                    <span>
                                        "Insights" are just screenshots of vanity
                                        metrics delivered weeks late.
                                    </span>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✕</span>
                                    <span>
                                        Opaque pricing and high agency markups.
                                    </span>
                                </li>

                            </ul>
                        </div>


                        {/* TapnLike */}
                        <div className="bg-brand-dark rounded-3xl p-8 shadow-xl text-white flex flex-col h-full transform md:-translate-y-4">

                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-700">
                                <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-dark">
                                    <span className="text-xl">⚡</span>
                                </div>

                                <h3 className="font-heading font-bold text-xl text-white">
                                    The TapnLike Platform
                                </h3>
                            </div>

                            <ul className="space-y-5 text-gray-300 flex-1">

                                <li className="flex items-start gap-3">
                                    <span className="text-brand-yellow mt-1">✓</span>
                                    <span className="text-white">
                                        Access to thousands of vetted creators
                                        across all niches.
                                    </span>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-brand-yellow mt-1">✓</span>
                                    <span className="text-white">
                                        Centralized briefing, approvals, and
                                        communication.
                                    </span>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-brand-yellow mt-1">✓</span>
                                    <span className="text-white">
                                        Automated link tracking and content
                                        verification.
                                    </span>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-brand-yellow mt-1">✓</span>
                                    <span className="text-white">
                                        Real-time dashboard with deep audience
                                        insights.
                                    </span>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-brand-yellow mt-1">✓</span>
                                    <span className="text-white">
                                        Transparent pricing — maximize your
                                        working media budget.
                                    </span>
                                </li>

                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            {/* =========================================================
                TECHNOLOGY
            ========================================================= */}
            <section
                id="technology"
                className="py-20 lg:py-28 relative overflow-hidden">
                {/* Background Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] z-0"
                    style={{
                        backgroundImage:
                            'radial-gradient(#111827 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Data Visual */}
                        <div className="relative h-[400px] sm:h-[500px] w-full max-w-lg mx-auto lg:mx-0 order-2 lg:order-1">

                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-gray-50 rounded-[2rem] border border-gray-200 shadow-inner overflow-hidden flex items-center justify-center">

                                {/* Center Score */}
                                <div className="relative z-20 w-24 h-24 bg-brand-dark rounded-full flex flex-col items-center justify-center text-white shadow-2xl border-4 border-white animate-float-slow">
                                    <span className="text-2xl font-bold font-heading">
                                        98
                                    </span>
                                    <span className="text-[10px] font-semibold tracking-wider text-brand-yellow">
                                        SCORE
                                    </span>
                                </div>


                                {/* Connecting Lines */}
                                <svg
                                    className="absolute inset-0 w-full h-full z-10"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                >
                                    <line
                                        x1="50"
                                        y1="50"
                                        x2="20"
                                        y2="20"
                                        stroke="currentColor"
                                        strokeWidth="0.5"
                                        className="text-gray-300"
                                    />

                                    <line
                                        x1="50"
                                        y1="50"
                                        x2="80"
                                        y2="25"
                                        stroke="currentColor"
                                        strokeWidth="0.5"
                                        className="text-gray-300"
                                    />

                                    <line
                                        x1="50"
                                        y1="50"
                                        x2="15"
                                        y2="70"
                                        stroke="currentColor"
                                        strokeWidth="0.5"
                                        className="text-gray-300"
                                    />

                                    <line
                                        x1="50"
                                        y1="50"
                                        x2="75"
                                        y2="80"
                                        stroke="currentColor"
                                        strokeWidth="0.5"
                                        className="text-gray-300"
                                    />
                                </svg>


                                {/* Data Nodes */}
                                <div className="absolute top-[15%] left-[10%] bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100 z-20 text-xs font-semibold animate-float-medium flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Engagement Rate
                                </div>

                                <div className="absolute top-[20%] right-[10%] bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100 z-20 text-xs font-semibold animate-float-fast flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Non-Follower Reach
                                </div>

                                <div
                                    className="absolute bottom-[25%] left-[5%] bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100 z-20 text-xs font-semibold animate-float-slow flex items-center gap-2"
                                    style={{ animationDelay: '1s' }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    Reel Frequency
                                </div>

                                <div
                                    className="absolute bottom-[15%] right-[15%] bg-white px-3 py-2 rounded-lg shadow-md border border-gray-100 z-20 text-xs font-semibold animate-float-medium flex items-center gap-2"
                                    style={{ animationDelay: '0.5s' }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                                    Audience Authenticity
                                </div>

                                {/* Scan Effect */}
                                <div
                                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow/50 to-transparent opacity-50 z-30 animate-scan"
                                />
                            </div>
                        </div>


                        {/* Technology Text */}
                        <div className="max-w-xl order-1 lg:order-2">

                            <p className="text-xs font-semibold tracking-widest text-brand-gray uppercase mb-4 flex items-center gap-2">
                                <span className="text-brand-yellow text-base">
                                    ⚡
                                </span>
                                DATA-DRIVEN SELECTION
                            </p>

                            <h2 className="font-heading font-bold text-4xl sm:text-5xl leading-tight mb-6">
                                We don't guess.
                                <br />
                                We calculate.
                            </h2>

                            <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed">
                                Say goodbye to vanity metrics. Our proprietary
                                technology assigns a dynamic{' '}
                                <strong>Creator Score</strong> based on deep data
                                analysis.
                            </p>

                            <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                                We look beyond follower count to analyze reel
                                quantity, true engagement rates, non-follower
                                reach percentages, and audience demographics.
                            </p>

                            <div className="bg-brand-lightbg border border-yellow-100 rounded-2xl p-5 mb-8 border-l-4 border-l-brand-yellow">
                                <p className="font-semibold text-brand-dark mb-1">
                                    The Result?
                                </p>

                                <p className="text-sm text-gray-600">
                                    You get the maximum possible result for minimal
                                    spend by partnering with creators who actually
                                    drive impact, not just impressions.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
}
