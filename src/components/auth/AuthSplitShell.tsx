import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

function ModeSwitch({ mode }: { mode: 'login' | 'signup' }) {
    return (
        <div className="flex rounded-full bg-[#eaf4fb] p-[4px]">
            <Link
                to="/login"
                className={cn(
                    'rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-tight transition-colors sm:px-[18px] sm:py-2 sm:text-[12px]',
                    mode === 'login'
                        ? 'bg-white text-brand-ink shadow-[0_1px_6px_rgba(11,39,68,0.10)]'
                        : 'text-[#7a8896] hover:text-brand-ink',
                )}
            >
                Log in
            </Link>
            <Link
                to="/register"
                className={cn(
                    'rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-tight transition-colors sm:px-[18px] sm:py-2 sm:text-[12px]',
                    mode === 'signup'
                        ? 'bg-white text-brand-ink shadow-[0_1px_6px_rgba(11,39,68,0.10)]'
                        : 'text-[#7a8896] hover:text-brand-ink',
                )}
            >
                Sign up
            </Link>
        </div>
    );
}

function SignupVisual() {
    return (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[min(58%,760px)] overflow-hidden lg:block">
            <div className="absolute right-[-36px] top-[40px] h-[470px] w-[470px] rounded-full bg-[#e7f4fc]" />

            {/* Decorations are positioned against the photo box so they stay on the head. */}
            <div className="absolute bottom-[-60px] right-0 aspect-[864/1052] h-[min(94vh,860px)]">
                <div
                    className="absolute left-[34%] top-[5%] z-20 flex origin-bottom -rotate-[50deg] items-end gap-[15px]"
                    aria-hidden="true"
                >
                    <span className="absolute top-[16px] left-[20px] h-[20px] w-[5px] rounded-full bg-brand-orange rotate-[-23deg]" />
                    <span className="absolute top-[10px] left-[35px] mb-0.5 h-[25px] w-[5px] rounded-full bg-brand-orange rotate-[12deg]" />
                    <span className="absolute top-[5px] left-[52px] h-[35px] ml-2 w-[5.5px] rounded-full bg-brand-orange rotate-[60deg]" />
                </div>

                <p className="absolute right-[10%] top-[-3.5%] z-20 origin-top-right rotate-[-24deg] font-handwriting text-[2rem] font-bold leading-[0.9] text-brand-ink">
                    Good 
                    <br />
                    Ideas
                    <br />
                    Better
                    <br />
                    Together
                    <span className="mt-1.5 block text-[1.7rem] leading-none text-brand-orange">
                        :)
                        {/* <span className="ml-auto mt-1 block h-[3px] w-12 rounded-full bg-brand-orange" /> */}
                    </span>
                </p>

                <img
                    src="/images/auth-signup-creator.png"
                    alt=""
                    className="absolute inset-0 z-10 h-full w-full select-none object-contain object-right-bottom"
                />
            </div>
        </div>
    );
}

export function TrustPills({ items, className }: { items: string[]; className?: string }) {
    const icons = [Shield, Check];
    return (
        <div className={cn('mb-3 flex flex-wrap gap-2 sm:mb-5', className)}>
            {items.map((item, index) => {
                const Icon = icons[index] ?? Shield;
                return (
                    <div
                        key={item}
                        className="flex items-center gap-1.5 rounded-full border border-[#dce8f0] bg-[#b9d8e242] px-3 py-[7px] text-[12px] font-semibold text-brand-gray"
                    >
                        <Icon className="h-3.5 w-3.5 text-brand-blue" strokeWidth={2} />
                        {item}
                    </div>
                );
            })}
        </div>
    );
}

export function AuthFieldLabel({
    children,
    htmlFor,
    className,
}: {
    children: ReactNode;
    htmlFor?: string;
    className?: string;
}) {
    return (
        <label htmlFor={htmlFor} className={cn('mb-1 block text-[12px] font-bold text-brand-ink sm:mb-2 sm:text-[13px]', className)}>
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
    const isSignup = mode === 'signup';

    return (
        <div className={cn(
            'relative h-svh overflow-hidden bg-white font-jakarta text-brand-ink sm:h-auto sm:min-h-svh sm:overflow-x-hidden',
            isSignup && 'max-lg:h-auto max-lg:min-h-svh max-lg:overflow-y-auto',
        )}>
            {isSignup ? <SignupVisual /> : null}

            <div className="relative z-10 mx-auto flex h-full min-h-0 w-full min-w-0 max-w-[1120px] flex-col px-4 pb-3 sm:min-h-svh sm:px-10 sm:pb-8 lg:px-14">
                <div className="flex shrink-0 justify-end pb-1 pt-3 sm:pb-2 sm:pt-4 lg:pt-6">
                    <ModeSwitch mode={mode} />
                </div>

                <div className={cn(
                    'flex min-h-0 min-w-0 flex-1 flex-col items-center justify-start overflow-hidden pt-2 sm:justify-center sm:overflow-visible sm:pt-0',
                    isSignup && 'max-lg:overflow-visible',
                )}>
                    <div className={cn('w-full min-w-0', isSignup ? 'max-w-[500px]' : 'max-w-[460px]')}>
                        {children}
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[#9aa3ad] sm:mt-6 sm:gap-x-4 sm:text-[12px]">
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
            </div>
        </div>
    );
}
