import { Link } from 'react-router-dom';
import DataDrivenSelection from '../../components/marketing/DataDrivenSelection';
import { cn } from '@/lib/utils';

const WAVEFORM = [4, 10, 16, 8, 14, 6, 12, 18, 8, 14, 4, 10, 16, 6, 12, 8, 18, 10, 4, 14, 8, 16, 6, 10];

const CREATOR_FEATURES = [
    {
        label: 'Brand Collaborations',
        color: '#E0247D',
        icon: 'M16.0004 9V6C16.0004 3.79086 14.2095 2 12.0004 2C9.79123 2 8.00037 3.79086 8.00037 6V9M3.59237 10.352L2.99237 16.752C2.82178 18.5717 2.73648 19.4815 3.03842 20.1843C3.30367 20.8016 3.76849 21.3121 4.35839 21.6338C5.0299 22 5.94374 22 7.77142 22H16.2293C18.057 22 18.9708 22 19.6423 21.6338C20.2322 21.3121 20.6971 20.8016 20.9623 20.1843C21.2643 19.4815 21.179 18.5717 21.0084 16.752L20.4084 10.352C20.2643 8.81535 20.1923 8.04704 19.8467 7.46616C19.5424 6.95458 19.0927 6.54511 18.555 6.28984C17.9444 6 17.1727 6 15.6293 6L8.37142 6C6.82806 6 6.05638 6 5.44579 6.28984C4.90803 6.54511 4.45838 6.95458 4.15403 7.46616C3.80846 8.04704 3.73643 8.81534 3.59237 10.352Z',
    },
    {
        label: 'Music Campaigns',
        color: '#CCA344',
        icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    },
    {
        label: 'Get Discovered',
        color: '#E5A625',
        icon: 'M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 110-8 4 4 0 010 8z',
    },
    {
        label: 'Grow Your Audience',
        color: '#FF3B30',
        icon: 'M4 15h2v6H4zm6-5h2v11h-2zm6-6h2v17h-2z',
    },
];

const wrap = 'mx-auto w-[min(100%-40px,1280px)] max-[560px]:w-[min(100%-24px,1280px)]';
const btn =
    'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-[22px] py-[13px] text-[0.95rem] font-bold transition duration-200';
const btnOrange =
    'bg-brand-orange text-white shadow-[0_10px_24px_rgba(255,106,26,0.28)] hover:-translate-y-px hover:bg-[#f05a0c]';
const btnGhost = 'border-[1.5px] border-white/75 text-white hover:bg-white/10';
const eyebrow = 'mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.18em]';
const heading =
    'font-outfit font-bold leading-[0.96] tracking-[-0.045em]';
const emClass = 'font-jakarta italic font-extrabold text-brand-orange';
const sectionCopy = 'mt-4 mb-7 max-w-[42ch] text-[1.05rem] leading-[1.6] text-brand-gray';
const cardShadow = 'shadow-[0_18px_50px_rgba(11,39,68,0.12)]';

export default function Home() {
    return (
        <div className="text-brand-ink">
            <section className="relative overflow-visible bg-brand-blue text-white">
                <div className="pointer-events-none relative h-auto w-full overflow-hidden min-[520px]:h-[460px] min-[1100px]:static min-[1100px]:h-full min-[1100px]:w-[min(72vw,980px)]">
                    <p className="pointer-events-none absolute right-[13%] top-[24px] z-[2] hidden rotate-[337deg] text-right font-handwriting text-[1.95rem] font-bold leading-[0.95] min-[820px]:block">
                        Good People
                        <br />
                        Brighter
                        <br />
                        Tomorrows
                        <span className="mt-1 block text-[1.45rem]">☺</span>
                    </p>
                    <img
                        className="relative right-auto mx-auto h-[400px] w-auto max-w-none select-none object-contain object-right-bottom min-[560px]:absolute min-[560px]:bottom-0 min-[560px]:right-1/2 min-[560px]:mx-0 min-[560px]:h-full min-[560px]:translate-x-1/2 min-[1100px]:right-[13%] min-[1100px]:h-[108%] min-[1100px]:translate-x-0"
                        src="/images/hero-creator.png?v=1"
                        alt="Creator in an orange hoodie taking a selfie and making a peace sign"
                    />
                    <aside className="pointer-events-auto absolute right-[10%] top-[33%] z-[3] hidden min-w-[142px] items-center gap-2.5 overflow-hidden rounded-2xl border border-white/55 bg-white/[0.22] px-[13px] py-[11px] text-brand-ink shadow-[0_14px_32px_rgba(11,39,68,0.14),inset_0_1px_1px_rgba(255,255,255,0.65),inset_0_-1px_1px_rgba(255,255,255,0.12)] backdrop-blur-[16px] backdrop-saturate-[1.6] rotate-[344deg] min-[820px]:flex">
                        <div className="flex h-[34px] items-end gap-[3px]" aria-hidden="true">
                            <span className="h-[14px] w-[7px] rounded-t-[3px] bg-gradient-to-b from-[#ff8a3d] to-brand-orange" />
                            <span className="h-[22px] w-[7px] rounded-t-[3px] bg-gradient-to-b from-[#ff8a3d] to-brand-orange" />
                            <span className="h-8 w-[7px] rounded-t-[3px] bg-gradient-to-b from-[#ff8a3d] to-brand-orange" />
                        </div>
                        <ul className="m-0 list-none p-0 text-[0.78rem] font-bold leading-[1.35]">
                            <li>Ideas</li>
                            <li>Collabs</li>
                            <li className="text-brand-orange">Real Growth</li>
                        </ul>
                    </aside>
                </div>

                <div className={cn(wrap, 'relative z-[1] grid min-h-0 grid-cols-1 min-[1100px]:min-h-[560px] min-[1100px]:grid-cols-[minmax(0,520px)_1fr] pt-4')}>
                    <div className="relative z-[2] flex min-h-0 flex-col justify-between py-2 pb-5 min-[1100px]:min-h-[500px] min-[1100px]:pb-[78px]">
                        <div className="max-w-[34rem]">
                            <p className={cn(eyebrow, 'mb-3')}>The Creator Platform</p>
                            <h1 className={cn(heading, 'mb-4 text-[2.6rem] leading-[1.05] min-[820px]:text-[clamp(3rem,5.2vw,4.55rem)] min-[820px]:leading-[1.02]')}>
                                Turn Your
                                <br />
                                Creativity Into
                                <br />
                                <em className={cn(emClass, 'inline-block leading-[1.1] pb-1')}>Opportunities.</em>
                            </h1>
                            <p className="mb-[26px] max-w-[38ch] text-[1.02rem] leading-[1.55] text-white/[0.94]">
                                TapnLike connects creators, music artists and brands to turn ideas into real opportunities.
                            </p>
                            <div className="mb-0 flex flex-wrap gap-3">
                                <Link className={cn(btn, btnOrange)} to="/register">
                                    Get Started <span aria-hidden="true">→</span>
                                </Link>
                                <a className={cn(btn, btnGhost)} href="#how-it-works">
                                    <span className="grid size-[22px] place-items-center rounded-full border-[1.5px] border-current" aria-hidden="true">
                                        <svg className="ml-px" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
                                    </span>
                                    Watch Video
                                </a>
                            </div>
                        </div>
                        <dl className="flex items-stretch">
                            <div className="mr-[18px] border-r border-white/[0.32] pr-[18px] min-[820px]:mr-7 min-[820px]:pr-7">
                                <dt className="font-outfit text-[1.7rem] font-extrabold leading-none tracking-[-0.03em]">10K+</dt>
                                <dd className="mt-1.5 text-[0.82rem] opacity-85">Creators</dd>
                            </div>
                            <div className="mr-[18px] border-r border-white/[0.32] pr-[18px] min-[820px]:mr-7 min-[820px]:pr-7">
                                <dt className="font-outfit text-[1.7rem] font-extrabold leading-none tracking-[-0.03em]">500+</dt>
                                <dd className="mt-1.5 text-[0.82rem] opacity-85">Brands</dd>
                            </div>
                            <div>
                                <dt className="font-outfit text-[1.7rem] font-extrabold leading-none tracking-[-0.03em]">1M+</dt>
                                <dd className="mt-1.5 text-[0.82rem] opacity-85">Opportunities</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div className={wrap}>
                    <div className="relative z-[5] flex translate-y-[28%] flex-wrap items-center gap-7 rounded-[28px] bg-white px-8 py-[18px] text-brand-ink shadow-[0_16px_40px_rgba(11,39,68,0.1)] min-[1100px]:translate-y-1/2 min-[1100px]:flex-nowrap min-[1100px]:rounded-full" id="brands">
                        <p className="w-full min-w-0 text-center text-[0.64rem] font-extrabold uppercase leading-[1.3] tracking-[0.12em] text-brand-gray min-[560px]:w-auto min-[560px]:min-w-[118px] min-[560px]:text-left">
                            Trusted by
                            <br />
                            leading brands &amp; artists
                        </p>
                        <div className="flex flex-1 flex-wrap items-center justify-center gap-[18px] min-[560px]:flex-nowrap min-[560px]:justify-between" aria-label="Brand logos">
                            <span className="inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap font-outfit text-[1.05rem] font-extrabold tracking-[-0.03em] text-[#191414]">
                                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                                    <circle cx="12" cy="12" r="12" fill="#1DB954" />
                                    <path fill="#fff" d="M16.8 16.3c-.2.4-.7.5-1 .2-2.8-1.7-6.3-2.1-10.4-1.1-.5.1-.9-.2-1-.6-.1-.5.2-.9.6-1 4.5-1 8.4-.6 11.6 1.3.4.2.5.7.2 1.2zm1.4-3.1c-.3.4-.8.6-1.2.3-3.2-2-8-2.5-11.7-1.4-.5.1-1.1-.1-1.3-.6-.2-.5.1-1.1.6-1.3 4.3-1.3 9.6-.7 13.3 1.6.4.2.5.8.3 1.4zm.1-3.2C14.4 8 8.2 7.8 5.1 8.8c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 3.6-1.1 10.4-.9 15.4 1.8.6.3.7 1.1.4 1.6-.3.6-1 .8-1.6.5z" />
                                </svg>
                                Spotify
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap font-outfit text-[0.95rem] font-extrabold tracking-[0.08em] text-[#e23744]">
                                ZOMATO
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap font-outfit text-[1.4rem] font-extrabold tracking-[-0.06em]">
                                boAt
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap text-[0.95rem] font-extrabold tracking-[-0.03em] text-[#111]">
                                <svg viewBox="0 0 28 18" width="28" height="18" aria-hidden="true">
                                    <path fill="#DB0A40" d="M4 14c2-6 5-10 8-12-4 4-6 9-6 12H4zm12-12c3 2 6 6 8 12h-2c0-3-2-8-6-12z" />
                                    <path fill="#FFCC00" d="M10 16h8l-1.2-2H11.2z" />
                                </svg>
                                Red Bull
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap font-outfit text-[0.92rem] font-extrabold tracking-[0.18em]">
                                NYKAA
                            </span>
                        </div>
                        <p className="w-full min-w-0 text-center text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-gray min-[560px]:w-auto min-[560px]:min-w-[90px] min-[560px]:text-right">
                            and many more.
                        </p>
                    </div>
                </div>
            </section>

            <section
                className="relative bg-[radial-gradient(700px_380px_at_78%_18%,rgba(0,180,235,0.16),transparent_70%),linear-gradient(180deg,#f4fbff_0%,#eef7fc_100%)] py-10"
                id="creators"
            >
                <div className={cn(wrap, 'grid grid-cols-1 items-center gap-10 min-[1100px]:grid-cols-[0.85fr_1.15fr]')}>
                    <div>
                        <p className={cn(eyebrow, 'text-[#808080c7]')}>For Creators</p>
                        <h2 className={cn(heading, 'mb-4 text-[2.6rem] leading-[1.05] min-[820px]:text-[clamp(3rem,5.2vw,4.55rem)] min-[820px]:leading-[1.02]')}>
                            Turn your creativity into <em className={emClass}>opportunities.</em>
                        </h2>
                        <p className={sectionCopy}>
                            Get discovered, collaborate with top brands and artists, and do what you love — on your terms.
                        </p>
                        <Link className={cn(btn, btnOrange)} to="/register">
                            Join as a Creator <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    <div className="relative top-[50px] grid min-h-0 justify-items-center min-[1100px]:block min-[1100px]:min-h-[430px]">
                        <figure className="mx-auto w-[min(100%,400px)] overflow-hidden rounded-[28px] bg-white shadow-[0_22px_50px_rgba(11,39,68,0.14)] min-[1100px]:ml-auto min-[1100px]:mr-[88px]">
                            <img
                                className="block h-[370px] w-full object-cover"
                                src="/images/creator-portrait.png"
                                alt="Smiling creator with curly hair and sunglasses"
                            />
                        </figure>
                        <div className={cn('mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-[0.85rem] font-bold min-[1100px]:absolute min-[1100px]:left-[12%] min-[1100px]:top-[22px] min-[1100px]:mt-0', cardShadow)}>
                            <span className="grid size-7 place-items-center rounded-full bg-[#ffe3ea] text-[#ff3d6e]">♥</span>
                            Do What You Love
                        </div>
                        <ul className={cn('mx-auto mt-4 w-[min(100%,320px)] list-none rounded-[22px] bg-white p-2.5 min-[1100px]:absolute min-[1100px]:right-[-118px] min-[1100px]:top-[26px] min-[1100px]:mx-0 min-[1100px]:mt-0 min-[1100px]:w-[236px]', cardShadow)}>
                            {CREATOR_FEATURES.map((item) => (
                                <li key={item.label} className="flex items-center gap-2.5 rounded-[14px] p-2.5 text-[0.9rem] font-bold">
                                    <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#eef7ff] text-[#0094d4]">
                                        <svg viewBox="0 0 24 24" width="16" height="16" style={{ color: item.color }}>
                                            <path fill="currentColor" d={item.icon} />
                                        </svg>
                                    </span>
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-right font-handwriting text-[20px] font-bold uppercase leading-[1.05] min-[1100px]:absolute min-[1100px]:bottom-[60px] min-[1100px]:right-[-30px] min-[1100px]:mt-0 min-[1100px]:rotate-[337deg]">
                            More
                            <br />
                            creative
                            <br />
                            days
                            <br />
                            ahead :)
                        </p>
                    </div>
                </div>
            </section>

            <section className="relative bg-brand-blue py-2.5" id="music">
                <div className={cn(wrap, 'grid grid-cols-1 items-center gap-8 min-[1100px]:grid-cols-[1.1fr_0.9fr]')}>
                    <div className="relative grid min-h-0 justify-items-center min-[1100px]:block min-[1100px]:min-h-[540px]">
                        <p className="mt-4 font-handwriting text-2xl font-bold uppercase leading-[1.55] tracking-[0.2em] text-white min-[1100px]:absolute min-[1100px]:bottom-[200px] min-[1100px]:left-[-100px] min-[1100px]:mt-0 min-[1100px]:rotate-[353deg]">
                            Real
                            <br />
                            Creators
                            <br />
                            Real Reels
                            <br />
                            Real Reach
                        </p>
                        <div className="mx-auto w-[min(290px,68%)] -rotate-[9deg] min-[1100px]:ml-[-180px] min-[1100px]:mr-0">
                            <div className="rounded-[32px] bg-[#1a1d24] p-2.5 shadow-[0_30px_60px_rgba(11,39,68,0.28)]">
                                <div className="relative aspect-[3/4.15] overflow-hidden rounded-[22px] bg-black">
                                    <img
                                        className="block size-full object-cover"
                                        src="/images/concert-performer.png"
                                        alt="Singer performing on stage in purple concert lighting"
                                    />
                                    <div className="absolute inset-x-3.5 bottom-4 text-white">
                                        <div>
                                            <strong className="block font-outfit text-[1.35rem]">2.4M</strong>
                                            <span className="block text-[0.82rem]">Midnight Drive</span>
                                            <small className="block text-[0.82rem] opacity-80">Ananya</small>
                                        </div>
                                        <div className="mt-2.5 flex items-center gap-2 rounded-full bg-black/35 px-2.5 py-1.5 backdrop-blur-sm">
                                            <span className="grid size-[22px] place-items-center rounded-full bg-white text-[#111]">
                                                <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
                                            </span>
                                            <div className="flex h-[18px] flex-1 items-center gap-0.5" aria-hidden="true">
                                                {WAVEFORM.map((h, i) => (
                                                    <span key={i} className="w-0.5 rounded-sm bg-white" style={{ height: `${h}px` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <figure className={cn('m-0 mt-4 rounded-[4px] bg-white px-2 pb-[22px] pt-2 min-[1100px]:absolute min-[1100px]:right-[10%] min-[1100px]:top-7 min-[1100px]:mt-0 min-[1100px]:rotate-[10deg] mr-[40px]', cardShadow)}>
                            <img
                                className="block size-32 object-cover"
                                src="/images/guitarist.png"
                                alt="Musician playing an acoustic guitar"
                            />
                        </figure>
                        <figure className={cn('m-0 mt-4 rounded-[4px] bg-white px-2 pb-[22px] pt-2 min-[1100px]:absolute min-[1100px]:bottom-12 min-[1100px]:right-[18%] min-[1100px]:mt-0 min-[1100px]:-rotate-[7deg]', cardShadow)}>
                            <img
                                className="block size-32 object-cover"
                                src="/images/concert-crowd.png"
                                alt="Concert crowd with hands raised under warm stage lights"
                            />
                        </figure>
                    </div>

                    {/* <div>
                        <p className={cn(eyebrow, 'text-white')}>For Music Labels &amp; Artists</p>
                        <h2 className={cn(heading, 'mb-4 text-[2.6rem] leading-[1.05] min-[820px]:text-[2.6rem] text-white')}>
                            Get creators making 
                            <br />
                            reels on your song. 
                            <br />
                            <em className={emClass}>Day 1.</em>
                        </h2>
                        <p className="mt-4 mb-7 max-w-[42ch] text-[1.05rem] leading-[1.6] text-white/[0.94]">
                            Launch your track with a wave of authentic creator content. TapnLike helps you find the right creators, briefing, tracking and real-time results — all in one place.
                        </p>
                        <Link className={cn(btn, btnOrange)} to="/register">
                            Promote Your Music <span aria-hidden="true">→</span>
                        </Link>
                    </div> */}
                    <div className="p-8 md:p-12 text-white">
                        <p className={cn(eyebrow, 'text-white/90 text-[0.85rem] tracking-[0.15em] uppercase font-bold mb-3')}>
                            FOR MUSIC LABELS &amp; ARTISTS
                        </p>
                        <h2 className={cn(heading, 'mb-6 text-[2.75rem] md:text-[3.25rem] font-black leading-[1.05] tracking-tight text-white')}>
                            Get creators making
                            <br />
                            reels on your song.
                            <br />
                            <span className="text-[#FF6026] not-italic">Day 1.</span>
                        </h2>
                        <p className="mt-4 mb-8 max-w-[48ch] text-[1.05rem] leading-[1.45] text-white/90 font-normal">
                            Launch your track with a wave of authentic creator content. TapnLike helps you find the right creators, briefing, tracking and real-time results — all in one place.
                        </p>
                        <Link
                            className={cn(
                                btn,
                                'inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6026] hover:bg-[#e0521f] text-white font-semibold text-[1.05rem] rounded-full transition-colors shadow-md'
                            )}
                            to="/register"
                        >
                            Promote Your Music <span aria-hidden="true" className="text-xl leading-none">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            <DataDrivenSelection />

            <section className="bg-brand-blue py-2 text-white" id="cta">
                <div className={cn(wrap, 'flex flex-col items-center justify-between gap-8 text-center min-[1280px]:flex-row min-[1280px]:text-left')}>
                    <div>
                        <p className={cn(eyebrow, 'opacity-90')}>Ready to build together?</p>
                        <h2 className={cn(heading, 'max-w-[24ch] text-[clamp(2.3rem,4vw,3.35rem)]')}>
                            Good People Brighter 
                            <span className='font-bold text-brand-orange'>Tomorrows.</span>
                        </h2>
                    </div>
                    <div className="flex flex-col items-center gap-2.5 min-[1100px]:flex-row min-[1100px]:text-left">
                        <p className="m-0 text-[0.95rem] opacity-90">
                            Creators. Artists. Brands.
                            <br />
                            Let’s turn ideas into real opportunities.
                        </p>
                        <Link className={cn(btn, btnOrange)} to="/register">
                            Get Started Today <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
