import { Link } from 'react-router-dom';
import Logo from './Logo';

const FOOTER_LINKS = [
    { label: 'For Creators', href: '/#creators' },
    { label: 'For Brands', href: '/#brands' },
    { label: 'For Music', href: '/#music' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#cta' },
];

const LEGAL_LINKS = [
    { label: 'About', to: '/about' },
    { label: 'Privacy', to: '/privacy-policy' },
    { label: 'Terms', to: '/terms-of-service' },
];

export default function MarketingFooter() {
    return (
        <footer className="bg-brand-navy py-7 text-white">
            <div className="mx-auto flex w-[min(100%-40px,1180px)] flex-col items-center justify-between gap-5 lg:flex-row">
                <Logo className="text-white" />

                <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.88rem] font-semibold opacity-90" aria-label="Footer">
                    {FOOTER_LINKS.map((link) => (
                        <a key={link.href} href={link.href} className="hover:opacity-100">
                            {link.label}
                        </a>
                    ))}
                    {LEGAL_LINKS.map((link) => (
                        <Link key={link.to} to={link.to} className="hover:opacity-100">
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3.5" aria-label="Social links">
                    <a href="#" aria-label="Instagram" className="opacity-85 hover:opacity-100">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3zm-5 3.5A4.5 4.5 0 1112 16.5 4.5 4.5 0 0112 7.5zm0 2A2.5 2.5 0 1014.5 12 2.5 2.5 0 0012 9.5zM17.5 6a1 1 0 11-1 1 1 1 0 011-1z" /></svg>
                    </a>
                    <a href="#" aria-label="YouTube" className="opacity-85 hover:opacity-100">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.4 3.3-6.4 3.3z" /></svg>
                    </a>
                    <a href="#" aria-label="TikTok" className="opacity-85 hover:opacity-100">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14.5 3c.4 2.6 1.8 4.2 4.5 4.5v3.1c-1.5 0-2.9-.5-4.2-1.3v6.6c0 3.4-2.7 6.1-6.2 6.1S2.4 19.3 2.4 15.9s2.7-6.1 6.2-6.1c.3 0 .7 0 1 .1v3.3c-.3-.1-.7-.2-1-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V3h3z" /></svg>
                    </a>
                    <a href="#" aria-label="LinkedIn" className="opacity-85 hover:opacity-100">
                        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6.5 9H3.7v11h2.8V9zM5.1 3.6A1.7 1.7 0 103 5.3a1.7 1.7 0 002.1-1.7zM20.3 20h-2.8v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H10.8V9h2.7v1.5h.1c.4-.7 1.3-1.8 2.8-1.8 3 0 3.6 2 3.6 4.5V20z" /></svg>
                    </a>
                </div>

                <p className="text-center text-[0.72rem] font-extrabold uppercase tracking-[0.08em] opacity-85 lg:text-right">
                    Good People
                    <br />
                    Brighter Tomorrows
                </p>
            </div>
        </footer>
    );
}
