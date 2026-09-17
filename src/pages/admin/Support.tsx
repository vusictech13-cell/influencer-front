import { useMemo, useState } from 'react';
import { Headphones, Search } from 'lucide-react';
import { SupportChatPanel } from '@/components/support/SupportChatPanel';
import { useAdminSupportInbox, useAdminSupportThread } from '@/hooks/useAdminSupportChat';
import type { SupportThread, SupportThreadStatus } from '@/types/support';
import { resolveAssetUrl } from '@/utils/image';
import { getStoredUser } from '@/utils/auth';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'waiting_on_admin', label: 'Needs reply' },
    { key: 'waiting_on_creator', label: 'Waiting on creator' },
    { key: 'open', label: 'Open' },
    { key: 'closed', label: 'Closed' },
];

function statusLabel(status: SupportThreadStatus) {
    switch (status) {
        case 'waiting_on_admin':
            return 'Needs reply';
        case 'waiting_on_creator':
            return 'Awaiting creator';
        case 'closed':
            return 'Closed';
        default:
            return 'Open';
    }
}

function statusClass(status: SupportThreadStatus) {
    switch (status) {
        case 'waiting_on_admin':
            return 'bg-amber-50 text-amber-700 border-amber-100';
        case 'waiting_on_creator':
            return 'bg-sky-50 text-sky-700 border-sky-100';
        case 'closed':
            return 'bg-gray-50 text-gray-500 border-gray-100';
        default:
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
}

function formatRelative(value: string | null) {
    if (!value) return 'No messages';
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function ThreadRow({
    thread,
    active,
    onClick,
}: {
    thread: SupportThread;
    active: boolean;
    onClick: () => void;
}) {
    const avatar =
        resolveAssetUrl(thread.creator?.profile_image) ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.creator?.name || 'Creator')}&background=121318&color=fff`;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full gap-3 border-b border-[#eef3f7] px-3.5 py-3 text-left transition hover:bg-[#f7fbfd]',
                active && 'bg-[#f0f8fc]',
            )}
        >
            <img src={avatar} alt="" className="h-10 w-10 flex-none rounded-full object-cover" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-bold text-brand-ink">{thread.creator?.name || `Creator #${thread.creator_id}`}</p>
                    <span className="flex-none text-[10px] text-[#9aa0a8]">{formatRelative(thread.last_message_at)}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-[#8a8c94]">
                    {thread.last_message_preview || 'No messages yet'}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={cn('rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide', statusClass(thread.status))}>
                        {statusLabel(thread.status)}
                    </span>
                    {thread.admin_unread_count > 0 && (
                        <span className="rounded-full bg-brand-orange px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {thread.admin_unread_count}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

function AdminChatPane({ threadId, connected }: { threadId: number; connected: boolean }) {
    const user = getStoredUser();
    const { thread, messages, isLoading, peerTyping, sendError, sendMessage, notifyTyping, updateStatus } =
        useAdminSupportThread(threadId, connected);

    return (
        <SupportChatPanel
            title={thread?.creator?.name || 'Creator'}
            subtitle={thread?.creator?.email || (thread ? statusLabel(thread.status) : undefined)}
            headerRight={
                thread ? (
                    <select
                        value={thread.status}
                        onChange={(e) => updateStatus.mutate(e.target.value as SupportThreadStatus)}
                        className="rounded-lg border border-[#dce8f0] bg-white px-2 py-1.5 text-[11px] font-semibold text-brand-ink outline-none"
                    >
                        <option value="open">Open</option>
                        <option value="waiting_on_admin">Needs reply</option>
                        <option value="waiting_on_creator">Waiting on creator</option>
                        <option value="closed">Closed</option>
                    </select>
                ) : null
            }
            messages={messages}
            currentUserId={user?.id != null ? Number(user.id) : undefined}
            ownRole="admin"
            isLoading={isLoading}
            connected={connected}
            peerTyping={peerTyping}
            sendError={sendError}
            emptyHint="Reply to help this creator."
            onSend={sendMessage}
            onTyping={notifyTyping}
        />
    );
}

export default function AdminSupport() {
    const [status, setStatus] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const { threads, isLoading, connected } = useAdminSupportInbox({ status, search });

    const selectedExists = useMemo(
        () => selectedId != null && threads.some((t) => t.id === selectedId),
        [selectedId, threads],
    );

    const activeId = selectedExists ? selectedId : threads[0]?.id ?? null;

    return (
        <div className="flex h-[calc(100dvh-72px-2rem)] flex-col md:h-[calc(100dvh-72px-3.5rem)]">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-[#00B4EB] text-white">
                        <Headphones className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="mb-1 text-[28px] font-extrabold leading-[1.05] tracking-[-1.1px]">Creator Support</h1>
                        <p className="m-0 text-[13px] text-[#777a83]">
                            Live inbox · {connected ? 'realtime connected' : 'connecting…'}
                        </p>
                    </div>
                </div>
                <form
                    className="flex min-w-[240px] flex-1 items-center gap-2 sm:max-w-sm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSearch(searchInput.trim());
                    }}
                >
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa0a8]" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search creators…"
                            className="h-10 w-full rounded-xl border border-[#dce8f0] bg-white pl-9 pr-3 text-[12px] outline-none focus:border-[#00B4EB]/50"
                        />
                    </div>
                </form>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setStatus(item.key)}
                        className={cn(
                            'rounded-full border px-3 py-1.5 text-[11px] font-bold',
                            status === item.key
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-[#dce8f0] bg-white text-[#6f727b]',
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#dce8f0] bg-white">
                    <div className="border-b border-[#dce8f0] px-3.5 py-3 text-[11px] font-extrabold uppercase tracking-[1px] text-[#8b8d95]">
                        Conversations
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {isLoading ? (
                            <p className="p-4 text-[12px] text-[#8a8c94]">Loading…</p>
                        ) : threads.length === 0 ? (
                            <p className="p-4 text-[12px] text-[#8a8c94]">No support threads yet.</p>
                        ) : (
                            threads.map((thread) => (
                                <ThreadRow
                                    key={thread.id}
                                    thread={thread}
                                    active={thread.id === activeId}
                                    onClick={() => setSelectedId(thread.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="min-h-0 min-w-0">
                    {activeId ? (
                        <AdminChatPane threadId={activeId} connected={connected} />
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-[18px] border border-dashed border-[#dce8f0] bg-white text-[13px] text-[#8a8c94]">
                            Select a conversation to reply
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
