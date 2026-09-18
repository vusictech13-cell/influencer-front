import { useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ChevronLeft, Loader2, Send, X } from 'lucide-react';
import {
    useAdminFaqs,
    useAdminDeleteFaq,
    useAdminSaveFaq,
    useAdminBotNodes,
    useAdminDeleteBotNode,
    useAdminSaveBotNode,
    useAdminSupportTickets,
    useAdminUpdateTicketStatus,
    useSendSupportMessage,
    useSupportRealtime,
    useSupportTicket,
    type SupportBotAction,
    type SupportBotNode,
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

const FIELD_CLASS =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#00B4EB]';

type FieldSelectOption = { value: string; label: string };

function FieldSelect({
    value,
    onChange,
    options,
    placeholder = 'Select…',
}: {
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    options: FieldSelectOption[];
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const selected = options.find((option) => String(option.value) === String(value ?? ''));

    useEffect(() => {
        function onDocumentClick(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        }
        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', onDocumentClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocumentClick);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    return (
        <div className="relative w-full" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`${FIELD_CLASS} flex items-center justify-between gap-2 pr-3 text-left`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selected?.label || placeholder}
                </span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                >
                    <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
            {open && (
                <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                >
                    {options.map((option) => {
                        const isActive = String(option.value) === String(value ?? '');
                        return (
                            <li key={option.value || '__empty'}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full px-3 py-2 text-left text-sm hover:bg-[#f4fbff] ${
                                        isActive ? 'bg-[#f4fbff] font-semibold text-[#0b2744]' : 'text-gray-800'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function AdminSupport() {
    const [tab, setTab] = useState<'inbox' | 'faqs' | 'bot'>('inbox');
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
                    <p className="text-sm text-gray-500">Creator tickets, FAQ content, and chat bot tree</p>
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
                    <button
                        type="button"
                        onClick={() => setTab('bot')}
                        className={`rounded-full px-4 py-2 text-xs font-bold ${
                            tab === 'bot' ? 'bg-[#0b2744] text-white' : 'border border-gray-200 bg-white text-gray-600'
                        }`}
                    >
                        Bot
                    </button>
                </div>
            </div>

            {tab === 'faqs' ? (
                <AdminFaqManager />
            ) : tab === 'bot' ? (
                <AdminBotManager />
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

function TicketStatusActions({
    status,
    updatePending,
    onUpdateStatus,
    compact = false,
}: {
    status: SupportTicket['status'];
    updatePending: boolean;
    onUpdateStatus: (status: SupportTicket['status']) => void;
    compact?: boolean;
}) {
    const [confirmClose, setConfirmClose] = useState(false);
    const isClosed = status === 'closed';
    const actions = [
        { key: 'in_progress' as const, label: 'Mark in progress' },
        { key: 'resolved' as const, label: 'Mark resolved' },
        { key: 'closed' as const, label: 'Mark closed' },
    ];

    useEffect(() => {
        setConfirmClose(false);
    }, [status]);

    useEffect(() => {
        if (!confirmClose) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !updatePending) setConfirmClose(false);
        };
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [confirmClose, updatePending]);

    function handleClick(next: SupportTicket['status']) {
        if (isClosed || updatePending || next === status) return;
        if (next === 'closed') {
            setConfirmClose(true);
            return;
        }
        setConfirmClose(false);
        onUpdateStatus(next);
    }

    return (
        <div className={compact ? 'flex flex-col gap-2' : 'flex flex-col items-end gap-2'}>
            <div className={`flex flex-wrap gap-2 ${compact ? '' : 'justify-end'}`}>
                {actions.map((action) => {
                    const selected = status === action.key;
                    const disabled = updatePending || isClosed || selected;
                    return (
                        <button
                            key={action.key}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleClick(action.key)}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition ${
                                selected
                                    ? action.key === 'closed'
                                        ? 'bg-gray-800 text-white'
                                        : action.key === 'resolved'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-[#00B4EB] text-white'
                                    : isClosed
                                      ? 'cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-300'
                                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                            } ${compact ? 'shrink-0' : ''} disabled:opacity-70`}
                        >
                            {selected ? action.label.replace(/^Mark /, '') : action.label}
                        </button>
                    );
                })}
            </div>

            {confirmClose && !isClosed && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="close-ticket-title"
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-[#0b2744]/45 backdrop-blur-[2px]"
                        aria-label="Dismiss"
                        onClick={() => !updatePending && setConfirmClose(false)}
                    />
                    <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_24px_60px_rgba(11,39,68,0.28)]">
                        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-red-50 text-lg text-red-600">
                            !
                        </div>
                        <h3 id="close-ticket-title" className="text-center text-base font-semibold text-gray-900">
                            Close this ticket?
                        </h3>
                        <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
                            This permanently locks the conversation. Messaging and status changes will be disabled
                            for both admin and creator.
                        </p>
                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                disabled={updatePending}
                                onClick={() => setConfirmClose(false)}
                                className="flex-1 rounded-full border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={updatePending}
                                onClick={() => {
                                    setConfirmClose(false);
                                    onUpdateStatus('closed');
                                }}
                                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {updatePending ? 'Closing…' : 'Yes, close ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isClosed && (
                <p className="text-[10px] font-medium text-gray-400">
                    Closed tickets are locked — status can’t be changed.
                </p>
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
        return <AdminInboxEmptyState />;
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
                    <TicketStatusActions
                        status={selected.status}
                        updatePending={updatePending}
                        onUpdateStatus={onUpdateStatus}
                    />
                </div>
            )}

            {mobile && (
                <div className="shrink-0 border-b border-[#dce8f0] bg-white px-3 py-2">
                    <TicketStatusActions
                        status={selected.status}
                        updatePending={updatePending}
                        onUpdateStatus={onUpdateStatus}
                        compact
                    />
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
                            Messaging is disabled and status can no longer be changed.
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

function AdminInboxEmptyState() {
    return (
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-10 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,235,0.08),transparent_65%)]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#00B4EB]/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[#0b2744]/5 blur-2xl" />

            <div className="relative mb-6">
                <svg
                    width="220"
                    height="160"
                    viewBox="0 0 220 160"
                    fill="none"
                    className="mx-auto drop-shadow-sm"
                    aria-hidden
                >
                    <rect x="28" y="24" width="164" height="112" rx="18" fill="#f4f8fc" stroke="#dce8f0" />
                    <rect x="40" y="38" width="88" height="22" rx="11" fill="#ffffff" stroke="#cfe4f0">
                        <animate attributeName="opacity" values="0.55;1;0.55" dur="2.8s" repeatCount="indefinite" />
                    </rect>
                    <rect x="92" y="70" width="88" height="22" rx="11" fill="#0b2744">
                        <animate attributeName="x" values="96;92;96" dur="3.2s" repeatCount="indefinite" />
                    </rect>
                    <rect x="40" y="102" width="64" height="18" rx="9" fill="#00B4EB" opacity="0.85">
                        <animate attributeName="width" values="56;64;56" dur="2.4s" repeatCount="indefinite" />
                    </rect>
                    <circle cx="176" cy="48" r="7" fill="#ff6a1a">
                        <animate attributeName="r" values="6;8;6" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <path
                        d="M176 48v18"
                        stroke="#ff6a1a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.35"
                    >
                        <animate attributeName="opacity" values="0.15;0.5;0.15" dur="1.8s" repeatCount="indefinite" />
                    </path>
                </svg>
                <div className="absolute -right-2 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0b2744] to-[#00B4EB] text-sm text-white shadow-md">
                    ✦
                </div>
            </div>

            <h2 className="relative text-lg font-semibold text-[#0b2744]">Your support desk is ready</h2>
            <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                Pick a creator ticket from the list to open the live chat, assign yourself, and update status.
            </p>

            <div className="relative mt-6 grid w-full max-w-md gap-2 sm:grid-cols-3">
                {[
                    { title: 'Reply live', detail: 'Message creators in real time' },
                    { title: 'Track status', detail: 'Open → in progress → resolved' },
                    { title: 'Stay assigned', detail: 'Own tickets as you join' },
                ].map((item) => (
                    <div
                        key={item.title}
                        className="rounded-xl border border-[#dce8f0] bg-white/80 px-3 py-3 text-left shadow-sm backdrop-blur"
                    >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#00B4EB]">{item.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
                    </div>
                ))}
            </div>

            <p className="relative mt-5 text-[11px] font-medium text-gray-400">
                ← Select any ticket on the left to begin
            </p>
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
                    <FieldSelect
                        value={form.category}
                        onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                        options={[
                            ...FAQ_CATEGORIES.map((category) => ({
                                value: category.key,
                                label: category.label,
                            })),
                            ...(form.category && !FAQ_CATEGORIES.some((category) => category.key === form.category)
                                ? [{ value: form.category, label: form.category }]
                                : []),
                        ]}
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Question</span>
                    <input
                        value={form.question}
                        onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                        placeholder="Enter the question"
                        className={FIELD_CLASS}
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
                        className={FIELD_CLASS}
                        required
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Sort order</span>
                    <input
                        type="number"
                        value={form.sort_order ?? 0}
                        onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                        className={FIELD_CLASS}
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

const BOT_ACTIONS: { key: SupportBotAction; label: string }[] = [
    { key: 'show_children', label: 'Show children (branch)' },
    { key: 'answer', label: 'Answer (leaf)' },
    { key: 'escalate', label: 'Escalate to admin' },
];

const EMPTY_BOT_FORM: Partial<SupportBotNode> & {
    label: string;
    action: SupportBotAction;
    keywordsText: string;
} = {
    parent_id: null,
    label: '',
    reply: '',
    action: 'answer',
    keywordsText: '',
    sort_order: 0,
    is_active: true,
};

function AdminBotManager() {
    const { data: nodes = [], isLoading } = useAdminBotNodes();
    const saveNode = useAdminSaveBotNode();
    const deleteNode = useAdminDeleteBotNode();
    const [form, setForm] = useState(EMPTY_BOT_FORM);
    const [error, setError] = useState<string | null>(null);
    const [filterParent, setFilterParent] = useState<'all' | 'root' | number>('all');

    const roots = useMemo(() => nodes.filter((node) => node.parent_id == null), [nodes]);

    const visibleNodes = useMemo(() => {
        if (filterParent === 'all') return nodes;
        if (filterParent === 'root') return nodes.filter((node) => node.parent_id == null);

        const ids = new Set<number>([filterParent]);
        let grew = true;
        while (grew) {
            grew = false;
            for (const node of nodes) {
                if (node.parent_id != null && ids.has(node.parent_id) && !ids.has(node.id)) {
                    ids.add(node.id);
                    grew = true;
                }
            }
        }
        return nodes.filter((node) => ids.has(node.id));
    }, [nodes, filterParent]);

    const grouped = useMemo(() => {
        const byParent = new Map<number | 'root', SupportBotNode[]>();
        for (const node of visibleNodes) {
            const key = node.parent_id == null ? 'root' : node.parent_id;
            const list = byParent.get(key) || [];
            list.push(node);
            byParent.set(key, list);
        }
        return byParent;
    }, [visibleNodes]);

    function startEdit(node: SupportBotNode) {
        setForm({
            ...node,
            keywordsText: (node.keywords || []).join(', '),
            reply: node.reply || '',
        });
        setError(null);
    }

    function startChild(parentId: number) {
        setForm({
            ...EMPTY_BOT_FORM,
            parent_id: parentId,
            action: 'answer',
        });
        setError(null);
    }

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        try {
            await saveNode.mutateAsync({
                id: form.id,
                parent_id: form.parent_id ?? null,
                label: form.label,
                reply: form.reply || null,
                action: form.action,
                keywords: form.keywordsText
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                sort_order: form.sort_order ?? 0,
                is_active: form.is_active !== false,
            });
            setForm(EMPTY_BOT_FORM);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to save bot node'));
        }
    }

    function renderNodeCard(node: SupportBotNode, depth = 0) {
        const children = grouped.get(node.id) || [];
        return (
            <div key={node.id} className={depth > 0 ? 'ml-4 border-l border-gray-100 pl-3' : ''}>
                <div className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                #{node.id}
                                {node.parent ? ` · under ${node.parent.label}` : ' · root'}
                                {' · '}
                                {node.action}
                                {' · #'}
                                {node.sort_order}
                                {' · '}
                                {node.is_active ? 'active' : 'hidden'}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{node.label}</p>
                            {node.reply && (
                                <p className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">{node.reply}</p>
                            )}
                            {node.keywords?.length > 0 && (
                                <p className="mt-1 text-[11px] text-gray-400">
                                    Keywords: {node.keywords.join(', ')}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <button
                                type="button"
                                className="text-[11px] font-bold text-[#00B4EB]"
                                onClick={() => startEdit(node)}
                            >
                                Edit
                            </button>
                            {node.action === 'show_children' && (
                                <button
                                    type="button"
                                    className="text-[11px] font-bold text-emerald-600"
                                    onClick={() => startChild(node.id)}
                                >
                                    + Child
                                </button>
                            )}
                            <button
                                type="button"
                                className="text-[11px] font-bold text-red-500"
                                onClick={() => {
                                    if (window.confirm(`Delete “${node.label}” and its children?`)) {
                                        deleteNode.mutate(node.id);
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
                {children.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {children.map((child) => renderNodeCard(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    }

    const rootList =
        filterParent === 'all' || filterParent === 'root'
            ? roots.filter((node) => visibleNodes.some((item) => item.id === node.id))
            : nodes.filter((node) => node.id === filterParent);

    return (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">Chat bot tree</h2>
                    <div className="w-auto min-w-[180px]">
                        <FieldSelect
                            value={filterParent === 'all' || filterParent === 'root' ? filterParent : String(filterParent)}
                            onChange={(value) => {
                                if (value === 'all' || value === 'root') setFilterParent(value);
                                else setFilterParent(Number(value));
                            }}
                            options={[
                                { value: 'all', label: 'All nodes' },
                                { value: 'root', label: 'Root topics only' },
                                ...roots.map((node) => ({
                                    value: String(node.id),
                                    label: `Branch: ${node.label}`,
                                })),
                            ]}
                        />
                    </div>
                </div>
                {isLoading ? (
                    <Loader2 className="mx-auto my-8 animate-spin text-[#00B4EB]" />
                ) : rootList.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">No bot nodes yet.</p>
                ) : (
                    <div className="space-y-3">
                        {rootList.map((node) => renderNodeCard(node))}
                    </div>
                )}
            </div>

            <form onSubmit={onSubmit} className="h-fit space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">
                    {form.id ? `Edit node #${form.id}` : 'Add bot node'}
                </h2>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Parent</span>
                    <FieldSelect
                        value={form.parent_id ?? ''}
                        onChange={(value) =>
                            setForm((prev) => ({
                                ...prev,
                                parent_id: value ? Number(value) : null,
                            }))
                        }
                        options={[
                            { value: '', label: 'Root (main topics)' },
                            ...nodes
                                .filter((node) => node.id !== form.id)
                                .map((node) => ({
                                    value: String(node.id),
                                    label:
                                        node.parent_id == null
                                            ? node.label
                                            : `${node.parent?.label || '…'} → ${node.label}`,
                                })),
                        ]}
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Button label</span>
                    <input
                        value={form.label}
                        onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="Shown on the chat button"
                        className={FIELD_CLASS}
                        required
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Bot reply</span>
                    <textarea
                        value={form.reply || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, reply: e.target.value }))}
                        placeholder="Message shown when this option is selected"
                        rows={4}
                        className={FIELD_CLASS}
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Action</span>
                    <FieldSelect
                        value={form.action}
                        onChange={(value) =>
                            setForm((prev) => ({ ...prev, action: value as SupportBotAction }))
                        }
                        options={BOT_ACTIONS.map((action) => ({
                            value: action.key,
                            label: action.label,
                        }))}
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Keywords (comma-separated)</span>
                    <input
                        value={form.keywordsText}
                        onChange={(e) => setForm((prev) => ({ ...prev, keywordsText: e.target.value }))}
                        placeholder="payment, pending, 48h"
                        className={FIELD_CLASS}
                    />
                </label>
                <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Sort order</span>
                    <input
                        type="number"
                        value={form.sort_order ?? 0}
                        onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                        className={FIELD_CLASS}
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
                <div className="flex gap-2">
                    {form.id ? (
                        <button
                            type="button"
                            onClick={() => setForm(EMPTY_BOT_FORM)}
                            className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-bold text-gray-600"
                        >
                            Cancel
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        disabled={saveNode.isPending}
                        className="flex-1 rounded-full bg-brand-orange py-2.5 text-sm font-bold text-white"
                    >
                        {saveNode.isPending ? 'Saving…' : form.id ? 'Update node' : 'Create node'}
                    </button>
                </div>
            </form>
        </div>
    );
}
