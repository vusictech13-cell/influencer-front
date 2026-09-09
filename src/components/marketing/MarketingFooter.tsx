import { Link } from 'react-router-dom';
import { COMPANY } from '@/constants/company';

const FOOTER_LINKS = {
    product: [
        { label: 'About', to: '/about' },
        { label: 'For Brands', to: '/#for-brands' },
        { label: 'For Creators', to: '/#for-creators' },
        { label: 'How It Works', to: '/#how-it-works' },
    ],
    legal: [
        { label: 'Privacy Policy', to: '/privacy-policy' },
        { label: 'Terms of Service', to: '/terms-of-service' },
        { label: 'Data Deletion', to: '/data-deletion' },
        { label: 'Contact', to: '/about#contact' },
    ],
};

export default function MarketingFooter() {
    return (
       <>
            {/* =========================================================
                FINAL CTA
            ========================================================= */}
            <section
                id="join"
                className="py-20 relative overflow-hidden"
            >

                <div className="absolute inset-0 bg-brand-dark"></div>

                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage:
                            'radial-gradient(#FFD700 2px, transparent 2px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-yellow rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-orange rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>


                <div className="container mx-auto px-6 relative z-10 text-center">

                    <h2 className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl text-white mb-6">
                        Ready to tap into
                        <br className="hidden sm:block" />
                        your potential?
                    </h2>

                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Join thousands of creators and brands already growing on
                        TapnLike.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

                        <div className="relative w-full sm:w-auto">

                            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full z-10 shadow-lg animate-bounce">
                                Limited Time
                            </div>

                            <Link
                                to="/register"
                                className="w-full sm:w-auto bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-semibold text-lg px-10 py-4 rounded-full inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105"
                            >
                                Join for Free

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </Link>
                        </div>

                        <p className="text-gray-400 text-sm mt-4 sm:mt-0 sm:ml-4">
                            No credit card required.
                        </p>
                    </div>
                </div>
            </section>
       </>
    );
}
