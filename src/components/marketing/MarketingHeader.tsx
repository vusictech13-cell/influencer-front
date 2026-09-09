import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    isAuthenticated,
    getStoredUser,
    getRoleDashboardPath,
} from '@/utils/auth';

export default function MarketingHeader() {
    const authenticated = isAuthenticated();
    const dashboardPath = getRoleDashboardPath(getStoredUser()?.role);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLinkClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-md border-b border-gray-100/50 transition-all">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center relative z-20">

                {/* ================= LOGO ================= */}
                <Link
                    to="/"
                    onClick={handleLinkClick}
                    className="flex items-center gap-2 shrink-0"
                >
                    <span className="font-heading font-bold text-2xl tracking-tight text-brand-dark">
                        tapnlike
                    </span>

                    <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                </Link>


                {/* ================= DESKTOP NAVIGATION ================= */}
                <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-800">

                    <a
                        href="#creators"
                        className="hover:text-brand-orange transition-colors"
                    >
                        For Creators
                    </a>

                    <a
                        href="#music"
                        className="hover:text-brand-orange transition-colors"
                    >
                        For Music
                    </a>

                    <a
                        href="#brands"
                        className="hover:text-brand-orange transition-colors"
                    >
                        For Brands
                    </a>

                    <a
                        href="#how-it-works"
                        className="hover:text-brand-orange transition-colors"
                    >
                        How it Works
                    </a>

                    <a
                        href="#technology"
                        className="hover:text-brand-orange transition-colors"
                    >
                        Technology
                    </a>

                </div>


                {/* ================= DESKTOP ACTIONS ================= */}
                <div className="hidden md:flex items-center gap-4">

                    {authenticated ? (
                        <Button
                            asChild
                            size="sm"
                            className="rounded-full"
                        >
                            <Link to={dashboardPath}>
                                Go to Dashboard
                            </Link>
                        </Button>
                    ) : (
                        <>
                            {/* Login */}
                            <Link
                                to="/login"
                                className="font-medium text-sm text-brand-dark hover:text-brand-orange transition-colors"
                            >
                                Log In
                            </Link>

                            {/* Sign Up */}
                            <Link
                                to="/register"
                                className="
                                    bg-brand-yellow
                                    hover:bg-yellow-400
                                    text-brand-dark
                                    font-medium
                                    px-6
                                    py-2.5
                                    rounded-full
                                    flex
                                    items-center
                                    gap-2
                                    transition-all
                                    duration-300
                                    hover:shadow-lg
                                    hover:-translate-y-0.5
                                "
                            >
                                <span>Sign Up</span>

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
                        </>
                    )}

                </div>


                {/* ================= MOBILE MENU BUTTON ================= */}
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="
                        md:hidden
                        p-2
                        text-gray-600
                        hover:text-brand-dark
                        focus:outline-none
                        rounded-lg
                        transition-colors
                    "
                    aria-label="Toggle mobile menu"
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? (
                        /* Close Icon */
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    ) : (
                        /* Hamburger Icon */
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                            />
                        </svg>
                    )}
                </button>

            </nav>


            {/* ================= MOBILE MENU ================= */}
            <div
                className={`
                    ${mobileMenuOpen ? 'flex' : 'hidden'}
                    md:hidden
                    absolute
                    top-full
                    left-0
                    w-full
                    bg-white
                    border-b
                    border-gray-100
                    shadow-xl
                    py-4
                    px-6
                    flex-col
                    gap-1
                    z-10
                `}
            >

                <a
                    href="#creators"
                    onClick={handleLinkClick}
                    className="mobile-link text-gray-800 font-medium py-3 hover:text-brand-orange transition-colors"
                >
                    For Creators
                </a>

                <a
                    href="#music"
                    onClick={handleLinkClick}
                    className="mobile-link text-gray-800 font-medium py-3 hover:text-brand-orange transition-colors"
                >
                    For Music
                </a>

                <a
                    href="#brands"
                    onClick={handleLinkClick}
                    className="mobile-link text-gray-800 font-medium py-3 hover:text-brand-orange transition-colors"
                >
                    For Brands
                </a>

                <a
                    href="#how-it-works"
                    onClick={handleLinkClick}
                    className="mobile-link text-gray-800 font-medium py-3 hover:text-brand-orange transition-colors"
                >
                    How it Works
                </a>

                <a
                    href="#technology"
                    onClick={handleLinkClick}
                    className="mobile-link text-gray-800 font-medium py-3 hover:text-brand-orange transition-colors"
                >
                    Technology
                </a>


                {/* Divider */}
                <hr className="border-gray-100 my-2" />


                {/* ================= MOBILE AUTH ================= */}
                {authenticated ? (
                    <Link
                        to={dashboardPath}
                        onClick={handleLinkClick}
                        className="
                            text-gray-800
                            font-medium
                            py-3
                            hover:text-brand-orange
                            transition-colors
                        "
                    >
                        Go to Dashboard
                    </Link>
                ) : (
                    <>
                        <Link
                            to="/login"
                            onClick={handleLinkClick}
                            className="
                                text-gray-800
                                font-medium
                                py-3
                                hover:text-brand-orange
                                transition-colors
                            "
                        >
                            Log In
                        </Link>

                        <Link
                            to="/register"
                            onClick={handleLinkClick}
                            className="
                                bg-brand-yellow
                                hover:bg-yellow-400
                                text-brand-dark
                                font-medium
                                px-6
                                py-3
                                rounded-full
                                flex
                                items-center
                                justify-center
                                gap-2
                                transition-all
                                duration-300
                                mt-1
                            "
                        >
                            Sign Up

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
                    </>
                )}

            </div>
        </header>
    );
}