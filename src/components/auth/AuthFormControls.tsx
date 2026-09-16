import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const authInputClassName =
    'h-11 w-full rounded-[14px] border border-[#e3eaf0] bg-white px-3.5 text-[13px] text-brand-ink outline-none transition placeholder:text-[#b0b7c0] focus:border-brand-orange focus:shadow-[0_0_0_3px_rgba(255,106,26,0.12)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[52px] sm:rounded-[16px] sm:px-4 sm:text-[14px]';

export const authCtaClassName =
    'flex h-11 w-full items-center justify-center rounded-full bg-brand-orange text-[13px] font-extrabold text-white shadow-[0_12px_28px_rgba(255,106,26,0.32)] transition hover:-translate-y-px hover:bg-[#f05a0c] disabled:pointer-events-none disabled:opacity-60 sm:h-[52px] sm:text-[14px]';

export function AuthPasswordInput({
    id,
    className,
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                {...props}
                type={visible ? 'text' : 'password'}
                className={cn(authInputClassName, 'pr-12', className)}
            />
            <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                className="absolute right-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#8d9098] transition hover:text-[#121318]"
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

export function AuthCheckbox({
    children,
    className,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
    return (
        <label className={cn('flex cursor-pointer items-center gap-2 text-[13px] text-[#7b8089]', className)}>
            <input type="checkbox" className="peer sr-only" {...props} />
            <span className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border-[1.5px] border-[#cfd4dc] bg-white transition peer-checked:border-brand-orange peer-checked:bg-brand-orange peer-checked:[&>svg]:opacity-100">
                <Check className="h-3 w-3 text-white opacity-0" strokeWidth={3} />
            </span>
            {children}
        </label>
    );
}

export function AuthSocialButton({
    children,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
    return (
        <button
            type="button"
            className={cn(
                'flex h-11 items-center justify-center gap-2.5 rounded-[14px] border border-[#e6e6ec] bg-white text-[13px] font-bold text-[#121318] shadow-[0_1px_2px_rgba(11,39,68,0.04)] transition hover:bg-[#fafafd] sm:h-[52px] sm:rounded-[16px] sm:text-[14px]',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

export function AppleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.5zM14.7 6.4c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
        </svg>
    );
}

export function AuthDivider({ children }: { children: ReactNode }) {
    return (
        <div className="my-3 flex items-center gap-3 text-[11px] text-[#b0b4bc] sm:my-5 sm:text-[12px]">
            <span className="h-px flex-1 bg-[#ececf1]" />
            {children}
            <span className="h-px flex-1 bg-[#ececf1]" />
        </div>
    );
}
