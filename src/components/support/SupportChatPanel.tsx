import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, SendHorizontal } from 'lucide-react';
import type { SupportMessage } from '@/types/support';
import { cn } from '@/lib/utils';

type SupportChatPanelProps = {
    title: string;
    subtitle?: string;
    headerRight?: ReactNode;
    messages: SupportMessage[];
    currentUserId?: number;
    /** Messages from this role appear on the right (own bubbles) */
    ownRole: 'creator' | 'admin';
    isLoading?: boolean;
    connected?: boolean;
    peerTyping?: boolean;
    sendError?: string | null;
    emptyHint?: string;
    onSend: (body: string) => Promise<unknown>;
    onTyping?: (isTyping: boolean) => void;
};

function formatTime(value: string) {
    try {
        return new Date(value).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

export function SupportChatPanel({
    title,
    subtitle,
    headerRight,
    messages,
    currentUserId,
    ownRole,
    isLoading,
    connected,
    peerTyping,
    sendError,
    emptyHint = 'No messages yet. Say hello.',
    onSend,
    onTyping,
}: SupportChatPanelProps) {
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, peerTyping]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const body = draft.trim();
        if (!body || sending) return;
        setSending(true);
        try {
            await onSend(body);
            setDraft('');
            onTyping?.(false);
        } catch {
            // error surfaced via sendError
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#dce8f0] bg-white">
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#dce8f0] px-4 py-3.5">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="truncate text-[15px] font-extrabold tracking-tight text-brand-ink">{title}</h2>
                        <span
                            className={cn(
                                'h-2 w-2 rounded-full',
                                connected ? 'bg-emerald-500' : 'bg-amber-400',
                            )}
                            title={connected ? 'Live' : 'Reconnecting'}
                        />
                    </div>
                    {subtitle && <p className="m-0 truncate text-[11px] text-[#8a8c94]">{subtitle}</p>}
                </div>
                {headerRight}
            </div>

            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f7fbfd_0%,#ffffff_48%)] px-4 py-4">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center text-[#8a8c94]">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <p className="text-[13px] font-semibold text-brand-ink">Start the conversation</p>
                        <p className="mt-1 text-[12px] text-[#8a8c94]">{emptyHint}</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn =
                            message.sender_role === ownRole ||
                            (currentUserId != null && message.sender_id === currentUserId);
                        return (
                            <div
                                key={message.id}
                                className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                            >
                                <div
                                    className={cn(
                                        'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
                                        isOwn
                                            ? 'rounded-br-md bg-brand-orange text-white'
                                            : 'rounded-bl-md border border-[#e4eef5] bg-white text-brand-ink',
                                    )}
                                >
                                    {!isOwn && message.sender?.name && (
                                        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.8px] text-[#8a8c94]">
                                            {message.sender.name}
                                        </div>
                                    )}
                                    <p className="m-0 whitespace-pre-wrap break-words">{message.body}</p>
                                    <div
                                        className={cn(
                                            'mt-1 text-right text-[10px]',
                                            isOwn ? 'text-white/75' : 'text-[#9aa0a8]',
                                        )}
                                    >
                                        {formatTime(message.created_at)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {peerTyping && (
                    <div className="text-[11px] font-medium text-[#8a8c94]">Typing…</div>
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-[#dce8f0] bg-white p-3">
                {sendError && (
                    <p className="mb-2 text-[11px] text-[#b4232c]">{sendError}</p>
                )}
                <div className="flex items-end gap-2">
                    <textarea
                        value={draft}
                        onChange={(e) => {
                            setDraft(e.target.value);
                            onTyping?.(e.target.value.trim().length > 0);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                void handleSubmit(e);
                            }
                        }}
                        rows={1}
                        placeholder="Type a message…"
                        className="max-h-28 min-h-[44px] flex-1 resize-none rounded-[12px] border border-[#dce8f0] bg-[#f8fbfd] px-3.5 py-3 text-[13px] outline-none ring-brand-orange/30 placeholder:text-[#9aa0a8] focus:border-brand-orange/40 focus:ring-2"
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim() || sending}
                        className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-brand-orange text-white shadow-[0_8px_18px_rgba(255,106,26,0.22)] disabled:opacity-50"
                        aria-label="Send message"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
