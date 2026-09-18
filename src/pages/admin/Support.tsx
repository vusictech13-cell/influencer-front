import { useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ChevronLeft, Loader2, Send, X } from 'lucide-react';
import {
    useAdminFaqs,
    useAdminDeleteFaq,
    useAdminSaveFaq,
    useAdminSupportTickets,
    useAdminUpdateTicketStatus,
    useSendSupportMessage,
    useSupportRealtime,
    useSupportTicket,
    type SupportFaq,
    type SupportMessage,
    type SupportTicket,
} from '@/hooks/useSupport';
import { getSupportSocket, joinSupportTicket, sameTicketId } from '@/lib/supportSocket';
import { getApiErrorMessage } from '@/api/axios';

const STATUS_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
] as const;

const FAQ_CATEGORIES = [
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'content', label: 'Content & sound' },
    { key: 'payments', label: 'Payments' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'account', label: 'Profile & account' },
    { key: 'studio', label: 'Reel Studio' },
    { key: 'support', label: 'Support' },
] as const;

export default function AdminSupport() {
    const [tab, setTab] = useState<'inbox' | 'faqs'>('inbox');
    const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]['key']>('all');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [typingLabel, setTypingLabel] = useState<string | null>(null);
    const [mobileFrame, setMobileFrame] = useState<{ top: number; height: number } | null>(null);
    const messagesRef = useRef<HTMLDivElement>(null);
    const mobileMessagesRef = useRef<HTMLDivElement>(null);

    const { data: tickets = [], isLoading, isError, error: loadError, refetch } = useAdminSupportTickets(status);
    const { data: ticket } = useSupportTicket(selectedId);
    const updateStatus = useAdminUpdateTicketStatus();
    const sendMessage = useSendSupportMessage();
    useSupportRealtime();

    const selected = useMemo(
        () => tickets.find((item) => item.id === selectedId) || ticket || null,
        [tickets, selectedId, ticket],
    );

    useEffect(() => {
        if (selectedId || !tickets[0]) return;
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
            setSelectedId(tickets[0].id);
        }
    }, [tickets, selectedId]);

    useEffect(() => {
        const el = mobileChatOpen ? mobileMessagesRef.current : messagesRef.current;
        el?.scrollTo({ top: el.scrollHeight });
    }, [ticket?.messages, typingLabel, mobileChatOpen, mobileFrame?.height]);

    useEffect(() => {
        if (!mobileChatOpen) {
            setMobileFrame(null);
            return;
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const syncViewport = () => {
            const vv = window.visualViewport;
            setMobileFrame({
                top: vv?.offsetTop ?? 0,
                height: Math.round(vv?.height ?? window.innerHeight),
            });
        };

        syncViewport();
        const vv = window.visualViewport;
        vv?.addEventListener('resize', syncViewport);
        vv?.addEventListener('scroll', syncViewport);
        window.addEventListener('resize', syncViewport);
        return () => {
            document.body.style.overflow = previous;
            vv?.removeEventListener('resize', syncViewport);
            vv?.removeEventListener('scroll', syncViewport);
            window.removeEventListener('resize', syncViewport);
        };
    }, [mobileChatOpen]);

    useEffect(() => {
        if (tab !== 'inbox') setMobileChatOpen(false);
    }, [tab]);

    useEffect(() => {
        if (!selectedId) return;
        const socket = getSupportSocket();
        if (!socket) return;

        const leaveTicket = joinSupportTicket(selectedId);

        const onMessage = (payload: { ticket_id: number; message?: SupportMessage }) => {
            if (!sameTicketId(payload.ticket_id, selectedId)) return;
            setTypingLabel(null);
        };

        const onTyping = (payload: {
            ticket_id: number;
            name: string;
            is_typing: boolean;
        }) => {
            if (!sameTicketId(payload.ticket_id, selectedId)) return;
            setTypingLabel(payload.is_typing ? `${payload.name} is typing…` : null);
        };

        socket.on('support:message:new', onMessage);
        socket.on('support:typing', onTyping);

        return () => {
            leaveTicket();
            socket.off('support:message:new', onMessage);
            socket.off('support:typing', onTyping);
        };
    }, [selectedId]);

    function openTicket(id: number) {
        setSelectedId(id);
        setError(null);
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
            setMobileChatOpen(true);
        }
    }

    function closeMobileChat() {
        setMobileChatOpen(false);
        setTypingLabel(null);
        setMessage('');
    }

    function scrollMessagesToEnd() {
        const el = mobileChatOpen ? mobileMessagesRef.current : messagesRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.scrollTo({ top: el.scrollHeight });
        });
    }

    async function handleSend(event: FormEvent) {
        event.preventDefault();
        if (!selectedId || !message.trim()) return;
        setError(null);
        const text = message.trim();
        setMessage('');

        getSupportSocket()?.emit('support:typing', { ticketId: selectedId, is_typing: false });

        try {
            await sendMessage.mutateAsync({ ticketId: selectedId, message: text });
            scrollMessagesToEnd();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to send message'));
        }
    }

    const keyboardOpen = Boolean(
        mobileFrame && typeof window !== 'undefined' && mobileFrame.height < window.innerHeight - 80,
    );

    const mobilePanelStyle = mobileFrame
        ? {
              top: mobileFrame.top,
              height: mobileFrame.height,
              maxHeight: mobileFrame.height,
              bottom: 'auto' as const,
          }
        : undefined;

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className={`flex flex-wrap items-center justify-between gap-3 ${mobileChatOpen ? 'lg:flex hidden' : ''}`}>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Support</h1>
                    <p className="text-sm text-gray-500">Creator tickets and FAQ content</p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setTab('inbox')}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                            tab === 'inbox' ? 'bg-[#0b2744] text-white' : 'border border-gray-200 bg-white text-gray-600'
                        }`}
                    >
                        Inbox
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('faqs')}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                            tab === 'faqs' ? 'bg-[#0b2744] text-white' : 'border border-gray-200 bg-white text-gray-600'
                        }`}
                    >
                        FAQs
                    </button>
                </div>
            </div>

            {tab === 'faqs' ? (
                <AdminFaqManager />
            ) : (
                <div className="grid gap-4 lg:h-[calc(100dvh-11rem)] lg:min-h-[480px] lg:grid-cols-[320px_1fr] lg:overflow-hidden">
                    <aside
                        className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:flex lg:min-h-0 lg:flex-col ${
                            mobileChatOpen ? 'hidden lg:flex' : ''
                        }`}
                    >
                        <div className="flex flex-wrap gap-1 border-b border-gray-100 p-3">
                            {STATUS_FILTERS.map((filter) => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    onClick={() => setStatus(filter.key)}
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                        status === filter.key
                                            ? 'bg-brand-orange text-white'
                                            : 'bg-gray-50 text-gray-500'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-[#00B4EB]" />
                            </div>
                        ) : isError ? (
                            <div className="space-y-2 p-6 text-center">
                                <p className="text-sm text-red-500">
                                    {getApiErrorMessage(loadError, 'Failed to load tickets')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => refetch()}
                                    className="text-xs font-bold text-[#00B4EB]"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : tickets.length === 0 ? (
                            <p className="p-6 text-center text-sm text-gray-400">No tickets</p>
                        ) : (
                            <div className="max-h-[min(70vh,640px)] divide-y divide-gray-50 overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1">
                                {tickets.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => openTicket(item.id)}
                                        className={`block w-full px-4 py-3 text-left ${
                                            selectedId === item.id ? 'bg-[#f4fbff]' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-gray-900">{item.ticket_code}</span>
                                            <span className="text-[10px] font-bold uppercase text-brand-orange">
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate text-sm text-gray-700">{item.subject}</p>
                                        <p className="truncate text-[11px] text-gray-400">
                                            {item.creator?.name || 'Creator'} · {item.topic}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </aside>

                    <section className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:flex lg:h-full">
                        <AdminTicketChat
                            selected={selected}
                            ticket={ticket}
                            typingLabel={typingLabel}
                            error={error}
                            message={message}
                            setMessage={setMessage}
                            onSend={handleSend}
                            sendPending={sendMessage.isPending}
                            updatePending={updateStatus.isPending}
                            onUpdateStatus={(next) => selected && updateStatus.mutate({ ticketId: selected.id, status: next })}
                            messagesRef={messagesRef}
                            keyboardOpen={false}
                            onFocusInput={scrollMessagesToEnd}
                        />
                    </section>
                </div>
            )}

            {mobileChatOpen && selected && (
                <div className="pointer-events-none fixed inset-0 z-50 lg:hidden">
                    <div
                        style={mobilePanelStyle}
                        className="pointer-events-auto fixed inset-x-0 top-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-white"
                    >
                        <div className="flex shrink-0 items-center gap-3 bg-gradient-to-br from-[#0b2744] to-[#00B4EB] px-3 py-3 text-white pt-[max(0.75rem,env(safe-area-inset-top))]">
                            <button
                                type="button"
                                onClick={closeMobileChat}
                                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"
                                aria-label="Back to tickets"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-[15px] font-bold">
                                    {selected.ticket_code} · {selected.subject}
                                </h3>
                                <p className="truncate text-xs text-white/75">
                                    {selected.creator?.name || 'Creator'} · {selected.status.replace('_', ' ')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeMobileChat}
                                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"
                                aria-label="Close chat"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col">
                            <AdminTicketChat
                                selected={selected}
                                ticket={ticket}
                                typingLabel={typingLabel}
                                error={error}
                                message={message}
                                setMessage={setMessage}
                                onSend={handleSend}
                                sendPending={sendMessage.isPending}
                                updatePending={updateStatus.isPending}
                                onUpdateStatus={(next) => updateStatus.mutate({ ticketId: selected.id, status: next })}
                                messagesRef={mobileMessagesRef}
                                keyboardOpen={keyboardOpen}
                                onFocusInput={scrollMessagesToEnd}
                                mobile
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminTicketChat({
    selected,
    ticket,
    typingLabel,
    error,
    message,
    setMessage,
    onSend,
    sendPending,
    updatePending,
    onUpdateStatus,
    messagesRef,
    keyboardOpen,
    onFocusInput,
    mobile = false,
}: {
    selected: SupportTicket | null;
    ticket?: SupportTicket;
    typingLabel: string | null;
    error: string | null;
    message: string;
    setMessage: (value: string) => void;
    onSend: (event: FormEvent) => void;
    sendPending: boolean;
    updatePending: boolean;
    onUpdateStatus: (status: SupportTicket['status']) => void;
    messagesRef: RefObject<HTMLDivElement | null>;
    keyboardOpen: boolean;
    onFocusInput: () => void;
    mobile?: boolean;
}) {
    if (!selected) {
        return (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
                Select a ticket
            </div>
        );
    }

    return (
        <>
            {!mobile && (
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            {selected.ticket_code} · {selected.subject}
                        </h2>
                        <p className="text-xs text-gray-500">
                            {selected.creator?.name} ({selected.creator?.email}) · {selected.topic}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                            Assigned:{' '}
                            <span className="font-semibold text-gray-600">
                                {selected.assigned_admin?.name
                                    || (selected.assigned_admin_id ? `Admin #${selected.assigned_admin_id}` : 'Unassigned')}
                            </span>
                            {' · '}
                            Status:{' '}
                            <span className="font-semibold capitalize text-brand-orange">
                                {selected.status.replace('_', ' ')}
                            </span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(['in_progress', 'resolved', 'closed'] as const).map((next) => (
                            <button
                                key={next}
                                type="button"
                                disabled={updatePending}
                                onClick={() => onUpdateStatus(next)}
                                className="rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-bold capitalize text-gray-700 hover:bg-gray-50"
                            >
                                Mark {next.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {mobile && (
                <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-[#dce8f0] bg-white px-3 py-2">
                    {(['in_progress', 'resolved', 'closed'] as const).map((next) => (
                        <button
                            key={next}
                            type="button"
                            disabled={updatePending}
                            onClick={() => onUpdateStatus(next)}
                            className="shrink-0 rounded-full border border-gray-200 px-3 py-1.5 text-[11px] font-bold capitalize text-gray-700"
                        >
                            Mark {next.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}

            <div
                ref={messagesRef}
                className={`min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] ${
                    mobile ? 'bg-[#f4f8fc]' : 'bg-[#f8fafc]'
                }`}
            >
                <div className={`space-y-2.5 ${mobile ? 'px-4 py-4' : 'px-5 py-4'}`}>
                    {(ticket?.messages || []).map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {typingLabel && <p className="text-[11px] text-gray-400">{typingLabel}</p>}
                </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white">
                {error && <p className={`pt-2 text-xs text-red-500 ${mobile ? 'px-4' : 'px-5'}`}>{error}</p>}

                {selected.status === 'closed' ? (
                    <div
                        className={`bg-[#f8fafc] text-center ${
                            mobile
                                ? `px-4 py-4 ${keyboardOpen ? 'pb-4' : 'pb-[max(1rem,env(safe-area-inset-bottom))]'}`
                                : 'px-5 py-4'
                        }`}
                    >
                        <p className="text-sm font-semibold text-gray-900">This ticket is closed</p>
                        <p className="mt-1 text-xs text-gray-500">
                            Creator messaging is disabled for closed tickets.
                        </p>
                    </div>
                ) : (
                    <form
                        onSubmit={onSend}
                        className={`flex gap-2 ${
                            mobile
                                ? `p-3 ${keyboardOpen ? 'pb-3' : 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'}`
                                : 'p-4'
                        }`}
                    >
                        <input
                            value={message}
                            onChange={(event) => {
                                setMessage(event.target.value);
                                getSupportSocket()?.emit('support:typing', {
                                    ticketId: selected.id,
                                    is_typing: true,
                                });
                            }}
                            onFocus={onFocusInput}
                            placeholder="Reply to creator…"
                            enterKeyHint="send"
                            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
                        />
                        <button
                            type="submit"
                            disabled={sendPending || !message.trim()}
                            className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-orange text-white disabled:opacity-60"
                            aria-label="Send"
                        >
                            {sendPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}

function MessageBubble({ message }: { message: SupportMessage }) {
    const mine = message.sender_role === 'admin';
    const system = message.sender_role === 'system' || message.sender_role === 'bot';
    return (
        <div
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                system
                    ? 'mx-auto bg-gray-100 text-gray-500'
                    : mine
                      ? 'ml-auto bg-brand-orange text-white'
                      : 'border border-gray-100 bg-white text-gray-800'
            }`}
        >
            {!system && (
                <p className={`mb-1 text-[10px] font-bold uppercase ${mine ? 'text-white/80' : 'text-gray-400'}`}>
                    {message.sender?.name || message.sender_role}
                </p>
            )}
            {message.body}
        </div>
    );
}

function AdminFaqManager() {
    const { data: faqs = [], isLoading } = useAdminFaqs();
    const saveFaq = useAdminSaveFaq();
    const deleteFaq = useAdminDeleteFaq();
    const [form, setForm] = useState<Partial<SupportFaq> & { category: string; question: string; answer: string }>({
        category: 'campaigns',
        question: '',
        answer: '',
        sort_order: 0,
        is_active: true,
    });
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        try {
            await saveFaq.mutateAsync(form);
            setForm({
                category: 'campaigns',
                question: '',
                answer: '',
                sort_order: 0,
                is_active: true,
            });
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to save FAQ'));
        }
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Published FAQs</h2>
                {isLoading ? (
                    <Loader2 className="mx-auto my-8 animate-spin text-[#00B4EB]" />
                ) : (
                    <div className="space-y-3">
                        {faqs.map((faq) => (
                            <div key={faq.id} className="rounded-xl border border-gray-100 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                            {faq.category} · #{faq.sort_order} · {faq.is_active ? 'active' : 'hidden'}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900">{faq.question}</p>
                                        <p className="mt-1 text-xs text-gray-500">{faq.answer}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            type="button"
                                            className="text-[11px] font-bold text-[#00B4EB]"
                                            onClick={() => setForm(faq)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[11px] font-bold text-red-500"
                                            onClick={() => deleteFaq.mutate(faq.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={onSubmit} className="h-fit space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{form.id ? 'Edit FAQ' : 'Add FAQ'}</h2>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Category</span>
                    <select
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        required
                    >
                        {FAQ_CATEGORIES.map((category) => (
                            <option key={category.key} value={category.key}>
                                {category.label}
                            </option>
                        ))}
                        {form.category && !FAQ_CATEGORIES.some((category) => category.key === form.category) && (
                            <option value={form.category}>{form.category}</option>
                        )}
                    </select>
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Question</span>
                    <input
                        value={form.question}
                        onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                        placeholder="Enter the question"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        required
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Answer</span>
                    <textarea
                        value={form.answer}
                        onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
                        placeholder="Enter the answer"
                        rows={5}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        required
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Sort order</span>
                    <input
                        type="number"
                        value={form.sort_order ?? 0}
                        onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                        type="checkbox"
                        checked={form.is_active !== false}
                        onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    />
                    Active
                </label>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                    type="submit"
                    disabled={saveFaq.isPending}
                    className="w-full rounded-full bg-brand-orange py-2.5 text-sm font-bold text-white"
                >
                    {saveFaq.isPending ? 'Saving…' : form.id ? 'Update FAQ' : 'Create FAQ'}
                </button>
            </form>
        </div>
    );
}
