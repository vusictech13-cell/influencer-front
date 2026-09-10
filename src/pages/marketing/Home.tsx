import { Link } from 'react-router-dom';
import DataDrivenSelection from '../../components/marketing/DataDrivenSelection';
import './landing.css';

const WAVEFORM = [4, 10, 16, 8, 14, 6, 12, 18, 8, 14, 4, 10, 16, 6, 12, 8, 18, 10, 4, 14, 8, 16, 6, 10];

const CREATOR_FEATURES = [
    {
        label: 'Brand Collaborations',
        icon: 'M20 7h-4V5l-2-2h-4L8 5v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-8 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm4-9H8V5h8v2z',
    },
    {
        label: 'Music Campaigns',
        icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    },
    {
        label: 'Get Discovered',
        icon: 'M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 110-8 4 4 0 010 8z',
    },
    {
        label: 'Grow Your Audience',
        icon: 'M16 6l2.3 2.3-4.9 4.9-4-4L2 16.2 3.4 17.6 9.4 11.6l4 4 6.3-6.3L22 12V6z',
    },
];

export default function Home() {
    return (
        <div className="tl-home">
            <section className="hero">
                <div className="hero-visual" aria-hidden="false">
                    <p className="handwrite hero-handwrite">
                        Good People
                        <br />
                        Brighter
                        <br />
                        Tomorrows
                        <span className="smiley">☺</span>
                    </p>
                    <img
                        className="hero-photo"
                        src="/images/hero-creator.png?v=1"
                        alt="Creator in an orange hoodie taking a selfie and making a peace sign"
                    />
                    <aside className="growth-card">
                        <div className="mini-bars" aria-hidden="true">
                            <span /><span /><span />
                        </div>
                        <ul>
                            <li>Ideas</li>
                            <li>Collabs</li>
                            <li>Real Growth</li>
                        </ul>
                    </aside>
                </div>

                <div className="tl-wrap hero-grid">
                    <div className="hero-copy">
                        <div className="hero-copy-top">
                        <p className="eyebrow">The Creator Platform</p>
                        <h1>
                            Turn Your
                            <br />
                            Creativity Into
                            <br />
                            <em>Opportunities.</em>
                        </h1>
                        <p className="lede">
                            TapnLike connects creators, music artists and brands to turn ideas into real opportunities.
                        </p>
                        <div className="hero-cta">
                            <Link className="btn btn-orange" to="/register">
                                Get Started <span aria-hidden="true">→</span>
                            </Link>
                            <a className="btn btn-ghost" href="#how-it-works">
                                <span className="play-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
                                </span>
                                Watch Video
                            </a>
                        </div>
                        </div>
                        <dl className="stats">
                            <div>
                                <dt>10K+</dt>
                                <dd>Creators</dd>
                            </div>
                            <div>
                                <dt>500+</dt>
                                <dd>Brands</dd>
                            </div>
                            <div>
                                <dt>1M+</dt>
                                <dd>Opportunities</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div className="tl-wrap">
                    <div className="trust-bar" id="brands">
                        <p>
                            Trusted by
                            <br />
                            leading brands &amp; artists
                        </p>
                        <div className="trust-logos" aria-label="Brand logos">
                            <span className="brand-logo spotify">
                                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                                    <circle cx="12" cy="12" r="12" fill="#1DB954" />
                                    <path fill="#fff" d="M16.8 16.3c-.2.4-.7.5-1 .2-2.8-1.7-6.3-2.1-10.4-1.1-.5.1-.9-.2-1-.6-.1-.5.2-.9.6-1 4.5-1 8.4-.6 11.6 1.3.4.2.5.7.2 1.2zm1.4-3.1c-.3.4-.8.6-1.2.3-3.2-2-8-2.5-11.7-1.4-.5.1-1.1-.1-1.3-.6-.2-.5.1-1.1.6-1.3 4.3-1.3 9.6-.7 13.3 1.6.4.2.5.8.3 1.4zm.1-3.2C14.4 8 8.2 7.8 5.1 8.8c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 3.6-1.1 10.4-.9 15.4 1.8.6.3.7 1.1.4 1.6-.3.6-1 .8-1.6.5z" />
                                </svg>
                                Spotify
                            </span>
                            <span className="brand-logo zomato">ZOMATO</span>
                            <span className="brand-logo boat">boAt</span>
                            <span className="brand-logo redbull">
                                <svg viewBox="0 0 28 18" width="28" height="18" aria-hidden="true">
                                    <path fill="#DB0A40" d="M4 14c2-6 5-10 8-12-4 4-6 9-6 12H4zm12-12c3 2 6 6 8 12h-2c0-3-2-8-6-12z" />
                                    <path fill="#FFCC00" d="M10 16h8l-1.2-2H11.2z" />
                                </svg>
                                Red Bull
                            </span>
                            <span className="brand-logo nykaa">NYKAA</span>
                        </div>
                        <p className="trust-more">and many more.</p>
                    </div>
                </div>
            </section>

            <section className="section creators" id="creators">
                <div className="tl-wrap creators-grid">
                    <div className="section-copy">
                        <p className="eyebrow dark">For Creators</p>
                        <h2>
                            Turn your creativity into <em>opportunities.</em>
                        </h2>
                        <p>
                            Get discovered, collaborate with top brands and artists, and do what you love — on your terms.
                        </p>
                        <Link className="btn btn-orange" to="/register">
                            Join as a Creator <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    <div className="creator-visual">
                        <figure className="photo-card">
                            <img src="/images/creator-portrait.png" alt="Smiling creator with curly hair and sunglasses" />
                        </figure>
                        <div className="chip chip-love">
                            <span className="chip-icon heart">♥</span>
                            Do What You Love
                        </div>
                        <ul className="feature-stack">
                            {CREATOR_FEATURES.map((item) => (
                                <li key={item.label}>
                                    <span className="icon-box">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d={item.icon} />
                                        </svg>
                                    </span>
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                        <p className="handwrite days-ahead">
                            More creative
                            <br />
                            days ahead :)
                        </p>
                    </div>
                </div>
            </section>

            <section className="section music" id="music">
                <div className="tl-wrap music-grid">
                    <div className="music-visual">
                        <p className="vertical-label">
                            Real Creators
                            <br />
                            Real Reels
                            <br />
                            Real Reach
                        </p>
                        <div className="tablet">
                            <div className="tablet-bezel">
                                <div className="tablet-screen">
                                    <img src="/images/concert-performer.png" alt="Singer performing on stage in purple concert lighting" />
                                    <div className="reel-ui">
                                        <div className="reel-meta">
                                            <strong>2.4M</strong>
                                            <span>Midnight Drive</span>
                                            <small>Ananya</small>
                                        </div>
                                        <div className="reel-player">
                                            <span className="reel-play">
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
                        <figure className="polaroid polaroid-a">
                            <img src="/images/guitarist.png" alt="Musician playing an acoustic guitar" />
                        </figure>
                        <figure className="polaroid polaroid-b">
                            <img src="/images/concert-crowd.png" alt="Concert crowd with hands raised under warm stage lights" />
                        </figure>
                    </div>

                    <div className="section-copy">
                        <p className="eyebrow dark">For Music Labels &amp; Artists</p>
                        <h2>
                            Get creators making reels on your song. <em>Day 1.</em>
                        </h2>
                        <p>
                            Launch your track with a wave of authentic creator content. TapnLike helps you find the right creators, briefing, tracking and real-time results — all in one place.
                        </p>
                        <Link className="btn btn-orange" to="/register">
                            Promote Your Music <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            <DataDrivenSelection />

            <section className="cta" id="cta">
                <div className="tl-wrap cta-inner">
                    <div>
                        <p className="eyebrow">Ready to build together?</p>
                        <h2>Good People Brighter Tomorrows.</h2>
                    </div>
                    <div className="cta-side">
                        <p>
                            Creators. Artists. Brands.
                            <br />
                            Let’s turn ideas into real opportunities.
                        </p>
                        <Link className="btn btn-orange" to="/register">
                            Get Started Today <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
