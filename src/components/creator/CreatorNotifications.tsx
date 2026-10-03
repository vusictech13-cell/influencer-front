import { useEffect, useRef, useState } from 'react';
import { Bell, Gift, MessageCircle, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationPath, useNotifications, type AppNotification } from '@/hooks/useNotifications';

function timeLabel(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function iconFor(type: string): LucideIcon {
    if (type === 'campaign_created') return Gift;
    if (type === 'payout_released') return Wallet;
    return MessageCircle;
}

export default function CreatorNotifications() {
    const navigate = useNavigate();
    const { items, isLoading, unreadCount, markRead, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    async function openItem(item: AppNotification) {
        setOpen(false);
        if (!item.read) {
            try {
                await markRead.mutateAsync(item.id);
            } catch {
                // Navigation still proceeds; the row stays unread until the next fetch.
            }
        }
        const path = notificationPath(item);
        if (path) navigate(path);
    }

    const badge = unreadCount > 9 ? '9+' : String(unreadCount);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                className="relative grid h-[37px] w-[37px] place-items-center rounded-[10px] border border-[#dce8f0] bg-white text-[#6f727b]"
                onClick={() => setOpen((value) => !value)}
                aria-label="Notifications"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-orange px-1 text-[9px] font-bold leading-none text-white">
                        {badge}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-[min(340px,80vw)] overflow-hidden rounded-2xl border border-[#dce8f0] bg-white shadow-[0_16px_40px_rgba(20,20,40,0.12)]">
                    <div className="flex items-center justify-between gap-3 border-b border-[#eef2f6] px-4 py-3">
                        <strong className="text-xs text-brand-ink">Notifications</strong>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => markAllRead.mutate()}
                                className="text-[10px] font-bold text-brand-orange"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                        {isLoading ? (
                            <p className="px-4 py-4 text-xs text-[#8a8c94]">Loading notifications…</p>
                        ) : items.length === 0 ? (
                            <p className="px-4 py-4 text-xs text-[#8a8c94]">No notifications yet.</p>
                        ) : (
                            items.map((item) => {
                                const Icon = iconFor(item.type);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => openItem(item)}
                                        className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#f4fbff] ${item.read ? '' : 'bg-[#fff8f4]'}`}
                                    >
                                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fff3eb] text-brand-orange">
                                            <Icon size={15} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-start justify-between gap-2">
                                                <strong className="block text-xs text-brand-ink">{item.title}</strong>
                                                {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-orange" />}
                                            </span>
                                            <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-[#8a8c94]">{item.body}</span>
                                            <span className="mt-1 block text-[10px] font-semibold text-[#a0a2aa]">{timeLabel(item.created_at)}</span>
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
