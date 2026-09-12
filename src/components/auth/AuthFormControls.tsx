import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const authInputClassName =
    'h-[49px] w-full rounded-xl border border-[#e8e8ee] bg-white px-3.5 text-[13px] text-[#121318] outline-none transition placeholder:text-[#a0a2aa] focus:border-[#e9408a] focus:shadow-[0_0_0_3px_rgba(233,64,138,0.08)] disabled:cursor-not-allowed disabled:opacity-50';

export const authCtaClassName =
    'flex h-[49px] w-full items-center justify-center rounded-xl bg-[#111318] text-xs font-extrabold text-white transition hover:-translate-y-px hover:bg-[#24252b] disabled:pointer-events-none disabled:opacity-60';

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
                className={cn(authInputClassName, 'pr-11', className)}
            />
            <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                className="absolute right-3 top-[13px] flex h-6 w-6 items-center justify-center text-[#8d9098] transition hover:text-[#121318]"
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
            </button>
        </div>
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
                'flex h-11 items-center justify-center gap-2 rounded-[11px] border border-[#e8e8ee] bg-white text-[11px] font-bold text-[#121318] transition hover:bg-[#fafafd]',
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
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
                fill="#EA4335"
                d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.7H12z"
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
        <div className="my-4 flex items-center gap-3 text-[9px] text-[#a0a2aa]">
            <span className="h-px flex-1 bg-[#ededf1]" />
            {children}
            <span className="h-px flex-1 bg-[#ededf1]" />
        </div>
    );
}
