import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, ArrowUp, BarChart3, Globe2, Play, Sun, Zap } from 'lucide-react';
import './DataDrivenSelection.css';

const SCORE_TARGET = 98;
const SCORE_RADIUS = 54;
const SCORE_CIRCUMFERENCE = 2 * Math.PI * SCORE_RADIUS;
const SCORE_DURATION = 1800;

const METRICS = [
    {
        label: 'Engagement Rate',
        value: '8.4%',
        tag: 'High',
        tone: 'blue',
        spark: 'spark-orange',
        path: 'M2 32 L18 26 L32 20 L44 24 L58 14 L74 18 L96 6 L116 12 L140 3 L158 7',
        icon: 'bars',
    },
    {
        label: 'Non-Follower Reach',
        value: '62%',
        tag: 'High',
        tone: 'cyan',
        spark: 'spark-blue',
        path: 'M2 28 L18 16 L32 22 L50 10 L66 16 L86 4 L104 12 L122 6 L142 3 L158 8',
        icon: 'globe',
    },
    {
        label: 'Reel Frequency',
        value: '12 / month',
        tag: 'Active',
        tone: 'purple',
        spark: 'spark-purple',
        path: 'M2 30 L18 18 L32 24 L48 12 L62 20 L80 8 L96 16 L114 6 L136 14 L158 3',
        icon: 'play',
    },
    {
        label: 'Audience Authenticity',
        value: '96%',
        tag: 'Real',
        tone: 'sun',
        spark: 'spark-orange',
        path: 'M2 16 L18 26 L34 10 L50 22 L66 8 L82 18 L100 5 L118 14 L140 4 L158 9',
        icon: 'sun',
    },
] as const;

function MetricIcon({ name }: { name: (typeof METRICS)[number]['icon'] }) {
    const icons = {
        bars: BarChart3,
        globe: Globe2,
        play: Play,
        sun: Sun,
    };
    const Icon = icons[name];
    if (name === 'play') {
        return <Icon size={16} fill="currentColor" strokeWidth={0} aria-hidden="true" />;
    }
    return <Icon size={18} strokeWidth={2.2} aria-hidden="true" />;
}

export default function DataDrivenSelection() {
    const sectionRef = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);
    const [score, setScore] = useState(0);
    const [progress, setProgress] = useState(SCORE_CIRCUMFERENCE);
    const [counting, setCounting] = useState(false);

    useEffect(() => {
        const node = sectionRef.current;
        if (!node) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            setVisible(true);
            setScore(SCORE_TARGET);
            setProgress(SCORE_CIRCUMFERENCE * (1 - SCORE_TARGET / 100));
            return;
        }

        let frame = 0;
        let started = false;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || started) return;
                started = true;
                observer.disconnect();
                setVisible(true);
                setCounting(true);

                const start = performance.now();
                const tick = (now: number) => {
                    const t = Math.min((now - start) / SCORE_DURATION, 1);
                    const eased = 1 - Math.pow(1 - t, 3);
                    const nextScore = t === 1 ? SCORE_TARGET : Math.round(eased * SCORE_TARGET);
                    setScore(nextScore);
                    setProgress(SCORE_CIRCUMFERENCE * (1 - eased * (SCORE_TARGET / 100)));
                    if (t < 1) {
                        frame = requestAnimationFrame(tick);
                    } else {
                        setCounting(false);
                    }
                };
                frame = requestAnimationFrame(tick);
            },
            { threshold: 0.32 },
        );

        observer.observe(node);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            className={`dds${visible ? ' is-visible' : ''}${counting ? ' is-counting' : ''}`}
            id="how-it-works"
            aria-labelledby="dds-heading"
        >
            <span id="technology" className="sr-only" />
            <div className="dds-blob dds-blob-a" aria-hidden="true" />
            <div className="dds-blob dds-blob-b" aria-hidden="true" />
            <div className="dds-blob dds-blob-c" aria-hidden="true" />

            <div className="dds-wrap">
                <div className="dds-copy">
                    <p className="dds-eyebrow">
                        <Zap className="dds-bolt" size={16} strokeWidth={2.4} aria-hidden="true" />
                        DATA-DRIVEN SELECTION
                    </p>
                    <h2 id="dds-heading">
                        <span className="dds-kicker">We don’t guess.</span>
                        <br />
                        <em>We calculate.</em>
                    </h2>
                    <p className="dds-lede">
                        Our proprietary technology assigns a dynamic Creator Score based on deep data analysis. We look beyond follower count to analyze real engagement, non-follower reach and audience demographics.
                    </p>
                    <a className="dds-cta" href="#how-it-works">
                        See How It Works <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                    </a>
                </div>

                <div className="dds-visual">
                    <div className="dds-ring" aria-label={`Creator Score ${score} of 100`}>
                        <svg viewBox="0 0 140 140" aria-hidden="true">
                            <circle cx="70" cy="70" r="46" fill="#f7fcff" />
                            <circle cx="70" cy="70" r={SCORE_RADIUS} fill="none" stroke="#e4eef5" strokeWidth="12" />
                            <circle
                                className="dds-ring-progress"
                                cx="70"
                                cy="70"
                                r={SCORE_RADIUS}
                                fill="none"
                                stroke="#00B4EB"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={SCORE_CIRCUMFERENCE}
                                strokeDashoffset={progress}
                            />
                        </svg>
                        <span className="dds-ticks" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                        <div className="dds-ring-value">
                            <strong>{score}</strong>
                            <span>
                                CREATOR
                                <br />
                                SCORE
                            </span>
                        </div>
                    </div>

                    <div className="dds-cards">
                        {METRICS.map((metric, index) => (
                            <article
                                className="dds-card"
                                key={metric.label}
                                style={{ '--dds-delay': `${120 + index * 130}ms` } as CSSProperties}
                            >
                                <span className={`dds-icon ${metric.tone}`}>
                                    <MetricIcon name={metric.icon} />
                                </span>
                                <div className="dds-card-copy">
                                    <span className="dds-card-label">{metric.label}</span>
                                    <strong>{metric.value}</strong>
                                </div>
                                <span className="dds-badge">
                                    <ArrowUp size={12} strokeWidth={2.8} aria-hidden="true" />
                                    {metric.tag}
                                </span>
                                <svg className={`dds-spark ${metric.spark}`} viewBox="0 0 160 36" preserveAspectRatio="none" aria-hidden="true">
                                    <path d={metric.path} pathLength={1} />
                                </svg>
                            </article>
                        ))}
                    </div>

                    <aside className="dds-note" aria-hidden="true">
                        <p>
                            REAL
                            <br />
                            DATA.
                            <br />
                            REAL
                            <br />
                            OPPORTUNITIES.
                        </p>
                        <svg
                            className="dds-arrow"
                            width="78"
                            height="70"
                            viewBox="0 0 78 70"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M76 0
       C75 17 70 29 61 39
       C51 50 35 57 14 63"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />

                            <path
                                d="M14 63
       C17 57 20 52 24 47"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />

                            <path
                                d="M14 63
       C19 63 24 65 28 68"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </aside>
                </div>
            </div>
        </section>
    );
}
