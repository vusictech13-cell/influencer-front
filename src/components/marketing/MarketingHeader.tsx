import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    isAuthenticated,
    getStoredUser,
    getRoleDashboardPath,
} from '@/utils/auth';
import Logo from './Logo';

const NAV_LINKS = [
    { label: 'For Creators', href: '/#creators' },
    { label: 'For Brands', href: '/#brands' },
    { label: 'For Music', href: '/#music' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#cta' },
];

export default function MarketingHeader() {
    const authenticated = isAuthenticated();
    const dashboardPath = getRoleDashboardPath(getStoredUser()?.role);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLinkClick = () => setMobileMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 w-full bg-[#00B4EB] text-white">
            <nav className="mx-auto flex min-h-[76px] w-[min(100%-40px,1180px)] items-center justify-between gap-6">
                <Logo className="text-white" />

                <div className="hidden items-center gap-7 text-[0.92rem] font-semibold md:flex">
                    {NAV_LINKS.map((link) => (
                        <a key={link.href} href={link.href} className="opacity-90 hover:opacity-100">
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {authenticated ? (
                        <Link
                            to={dashboardPath}
                            className="hidden rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(255,106,26,0.28)] transition hover:-translate-y-px hover:bg-[#f05a0c] md:inline-flex"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="hidden text-[0.92rem] font-semibold md:inline"
                            >
                                Log In
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 rounded-full bg-brand-orange px-[18px] py-2.5 text-[0.88rem] font-bold text-white shadow-[0_10px_24px_rgba(255,106,26,0.28)] transition hover:-translate-y-px hover:bg-[#f05a0c]"
                            >
                                Sign Up
                                <span aria-hidden="true">→</span>
                            </Link>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((open) => !open)}
                        className="flex size-10 flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-white/75 md:hidden"
                        aria-label="Toggle mobile menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <>
                                <span className="h-0.5 w-[18px] rounded-sm bg-white" />
                                <span className="h-0.5 w-[18px] rounded-sm bg-white" />
                                <span className="h-0.5 w-[18px] rounded-sm bg-white" />
                            </>
                        )}
                    </button>
                </div>
            </nav>

            <div
                className={`${mobileMenuOpen ? 'flex' : 'hidden'} absolute left-0 top-full w-full flex-col gap-1 bg-brand-blue px-6 py-4 md:hidden`}
            >
                {NAV_LINKS.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className="py-3 font-semibold text-white/90 hover:text-white"
                    >
                        {link.label}
                    </a>
                ))}
                <hr className="my-2 border-white/20" />
                {authenticated ? (
                    <Link to={dashboardPath} onClick={handleLinkClick} className="py-3 font-semibold">
                        Go to Dashboard
                    </Link>
                ) : (
                    <Link to="/login" onClick={handleLinkClick} className="py-3 font-semibold">
                        Log In
                    </Link>
                )}
            </div>
        </header>
    );
}
