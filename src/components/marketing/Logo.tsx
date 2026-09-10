import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
    return (
        <Link
            to="/"
            className={cn(
                'inline-flex items-center gap-1.5 font-outfit text-[1.35rem] font-extrabold tracking-tight',
                className,
            )}
            aria-label="TapnLike home"
        >
            <svg viewBox="0 0 20 20" className="size-[18px] text-brand-orange" aria-hidden="true">
                <path
                    fill="currentColor"
                    d="M10 0l2.4 7.6L20 10l-7.6 2.4L10 20l-2.4-7.6L0 10l7.6-2.4z"
                />
            </svg>
            tapnlike
        </Link>
    );
}
