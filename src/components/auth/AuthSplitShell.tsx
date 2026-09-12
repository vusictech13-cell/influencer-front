import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/marketing/Logo';

function ModeSwitch({ mode }: { mode: 'login' | 'signup' }) {
    return (
        <div className="flex rounded-full bg-[#eef7fc] p-[3px]">
            <Link
                to="/login"
                className={cn(
                    'rounded-full px-[13px] py-2 text-[11px] font-bold tracking-tight transition-colors',
                    mode === 'login'
                        ? 'bg-white text-brand-ink shadow-[0_1px_4px_rgba(11,39,68,0.08)]'
                        : 'text-brand-gray hover:text-brand-ink',
                )}
            >
                Log in
            </Link>
            <Link
                to="/register"
                className={cn(
                    'rounded-full px-[13px] py-2 text-[11px] font-bold tracking-tight transition-colors',
                    mode === 'signup'
                        ? 'bg-white text-brand-ink shadow-[0_1px_4px_rgba(11,39,68,0.08)]'
                        : 'text-brand-gray hover:text-brand-ink',
                )}
            >
                Sign up
            </Link>
        </div>
    );
}

function AuthVisualPanel() {
    return (
        <section className="relative hidden h-full min-h-0 overflow-hidden bg-brand-blue p-8 text-white lg:block lg:p-[34px]">
            <div className="pointer-events-none absolute -right-[180px] -top-[160px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_65%)]" />
            <div className="pointer-events-none absolute -bottom-[190px] -left-[170px] h-[430px] w-[430px] rounded-full bg-[radial-gradient(circle,rgba(255,106,26,0.38),transparent_65%)]" />

            <Logo className="relative z-[2] text-white" />

            <div className="relative z-[2] mt-12 max-w-[420px] lg:mt-[92px]">
                <p className="mb-3.5 text-[10px] font-extrabold uppercase tracking-[1.5px] text-white/80">
                    The creator platform
                </p>
                <h1 className="mb-[18px] font-outfit text-[37px] font-extrabold leading-[0.98] tracking-[-2px] lg:text-[49px] lg:tracking-[-2.5px]">
                    Turn your creativity into{' '}
                    <em className="font-jakarta italic font-extrabold text-white">opportunities.</em>
                </h1>
                <p className="m-0 max-w-[390px] text-sm leading-relaxed text-white/90">
                    Discover brands, unlock paid collaborations and understand what your creator profile can really earn.
                </p>
            </div>

            <div className="absolute bottom-7 right-[50px] z-[2] h-[385px] w-[390px] origin-bottom-right max-lg:bottom-[-40px] max-lg:right-[-18px] max-lg:scale-[0.72]">
                <div className="absolute inset-[45px_15px_10px_70px] -rotate-[5deg] rounded-[28px] border border-white/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05))] shadow-[0_30px_60px_rgba(11,39,68,0.24)] backdrop-blur-[10px]" />
                <div className="absolute left-0 top-[105px] h-[190px] w-[190px] rounded-full bg-[linear-gradient(145deg,#ffd4b8,#ff6a1a)] opacity-90" />
                <div className="absolute right-[5px] top-5 h-[145px] w-[145px] rounded-full bg-[linear-gradient(145deg,#e9f8ff,#7ad4f3)] opacity-90" />
                <div className="absolute bottom-[18px] right-24 z-[3] h-[235px] w-[170px] rounded-[85px_85px_35px_35px] bg-[linear-gradient(145deg,#123050,#0b2744)] shadow-[0_24px_45px_rgba(11,39,68,0.28)]">
                    <div className="absolute -top-[46px] left-[45px] h-20 w-20 rounded-full bg-[linear-gradient(145deg,#1b4468,#0b2744)]" />
                    <span className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-extrabold tracking-[2px] text-white">
                        TAPNLIKE
                    </span>
                </div>

                <div className="absolute bottom-[75px] left-1.5 z-[4] min-w-[145px] -rotate-3 rounded-[14px] bg-white/95 px-3.5 py-3 text-brand-ink shadow-[0_16px_35px_rgba(11,39,68,0.18)]">
                    <small className="mb-1 block text-[9px] text-brand-gray">Available campaign</small>
                    <strong className="text-[15px] font-bold">₹50,000</strong>
                </div>
                <div className="absolute right-1.5 top-[78px] z-[4] min-w-[145px] rotate-[5deg] rounded-[14px] bg-white/95 px-3.5 py-3 text-brand-ink shadow-[0_16px_35px_rgba(11,39,68,0.18)]">
                    <small className="mb-1 block text-[9px] text-brand-gray">Profile match</small>
                    <strong className="text-[15px] font-bold">94%</strong>
                </div>
                <div className="absolute left-[38px] top-[48px] z-[4] min-w-[145px] rotate-[4deg] rounded-[14px] bg-white/95 px-3.5 py-3 text-brand-ink shadow-[0_16px_35px_rgba(11,39,68,0.18)]">
                    <small className="mb-1 block text-[9px] text-brand-gray">Creators earning</small>
                    <strong className="text-[15px] font-bold">₹2.84L+</strong>
                </div>

                <div className="absolute left-9 top-[310px] z-[5] text-xl text-[#ffe0cc]">✦</div>
                <div className="absolute bottom-[155px] right-10 z-[5] text-xl text-[#ffe0cc]">✦</div>
                <div className="absolute right-40 top-5 z-[5] text-xl text-[#ffe0cc]">•</div>
            </div>
        </section>
    );
}

export function TrustPills({ items, className }: { items: string[]; className?: string }) {
    const icons = [Shield, Check];
    return (
        <div className={cn('mb-[22px] flex flex-wrap gap-2', className)}>
            {items.map((item, index) => {
                const Icon = icons[index] ?? Shield;
                return (
                    <div
                        key={item}
                        className="flex items-center gap-1.5 rounded-full border border-[#dce8f0] bg-[#f4fbff] px-2.5 py-[7px] text-[9px] font-bold text-brand-gray"
                    >
                        <Icon className="h-3 w-3 text-brand-blue" strokeWidth={1.7} />
                        {item}
                    </div>
                );
            })}
        </div>
    );
}

export function AuthFieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
    return (
        <label htmlFor={htmlFor} className="mb-2 block text-[11px] font-bold text-brand-ink">
            {children}
        </label>
    );
}

export function AuthSplitShell({
    mode,
    children,
}: {
    mode: 'login' | 'signup';
    children: ReactNode;
}) {
    return (
        <div className="flex h-svh items-center justify-center overflow-hidden bg-brand-lightbg p-0 font-jakarta text-brand-ink sm:p-6">
            <div className="grid h-svh w-full max-w-[1180px] overflow-hidden bg-white sm:h-[min(720px,calc(100svh-3rem))] sm:rounded-[28px] sm:border sm:border-[#dce8f0] sm:shadow-[0_28px_80px_rgba(11,39,68,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
                <AuthVisualPanel />

                <section className="flex h-full min-h-0 items-start justify-center overflow-y-auto bg-white px-5 py-6 sm:items-center sm:px-10 sm:py-8 lg:px-[68px]">
                    <div className="w-full max-w-[430px] pt-1.5 sm:pt-0">
                        <div className="mb-4 flex justify-end sm:mb-6">
                            <ModeSwitch mode={mode} />
                        </div>
                        {children}
                        <div className="mt-4 space-y-2 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-brand-gray">
                                <Link to="/privacy-policy" className="transition-colors hover:text-brand-ink">
                                    Privacy Policy
                                </Link>
                                <span>·</span>
                                <Link to="/terms-of-service" className="transition-colors hover:text-brand-ink">
                                    Terms of Service
                                </Link>
                                <span>·</span>
                                <Link to="/data-deletion" className="transition-colors hover:text-brand-ink">
                                    Data Deletion
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
