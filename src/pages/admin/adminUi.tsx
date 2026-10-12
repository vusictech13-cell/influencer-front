import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

export function formatWhen(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function TabGroup({ children }: { children: ReactNode }) {
    return (
        <div className="inline-flex max-w-full flex-wrap rounded-full border border-[#e7e7ed] bg-white p-1" role="tablist">
            {children}
        </div>
    );
}

export function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                active ? 'bg-brand-ink text-white' : 'text-brand-gray hover:text-brand-ink'
            }`}
        >
            {children}
        </button>
    );
}

export function PageHeader({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h2 className="font-outfit text-2xl font-extrabold tracking-[-0.03em] text-brand-ink">{title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-brand-gray">{description}</p>
            </div>
            {action}
        </div>
    );
}

export function StatusPill({ status, label }: { status: string; label?: string }) {
    const active = status === 'active' || status === 'success';
    const danger = status === 'suspended' || status === 'failed' || status === 'revoked';
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                active
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                    : danger
                        ? 'border-red-100 bg-red-50 text-red-500'
                        : 'border-gray-100 bg-gray-50 text-gray-500'
            }`}
        >
            {label || status}
        </span>
    );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
            {children}
        </div>
    );
}

export function Notice({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'muted' }) {
    return (
        <p className={`rounded-xl px-3 py-2.5 text-sm ${tone === 'error' ? 'bg-red-50 text-red-600' : 'text-brand-gray'}`}>
            {children}
        </p>
    );
}

export function LoadingRow() {
    return (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading
        </div>
    );
}

export function Modal({
    title,
    children,
    onClose,
}: {
    title: string;
    children: ReactNode;
    onClose: () => void;
}) {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-[80] flex min-h-dvh w-full items-center justify-center bg-[#0b2744]/45 p-4" role="dialog" aria-modal="true">
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e7e7ed] bg-white p-5 shadow-[0_24px_60px_rgba(11,39,68,0.28)]">
                <h3 className="text-base font-bold text-brand-ink">{title}</h3>
                <div className="mt-4">{children}</div>
            </div>
        </div>,
        document.body,
    );
}

export const fieldClass =
    'h-11 w-full rounded-xl border border-[#dce8f0] bg-white px-3 text-sm outline-none focus:border-[#ff6a1a]';

export const primaryButtonClass =
    'inline-flex h-11 items-center justify-center rounded-xl bg-brand-orange px-4 text-sm font-bold text-white disabled:opacity-50';
