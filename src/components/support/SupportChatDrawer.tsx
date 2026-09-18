import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import {
    BOT_ANSWERS,
    BOT_RESPONSES,
    useCreateSupportTicket,
    useSendSupportMessage,
    useSupportTicket,
    type SupportMessage,
    type SupportTicket,
} from '@/hooks/useSupport';
import { getSupportSocket } from '@/lib/supportSocket';
import { getApiErrorMessage } from '@/api/axios';

type ChatMode = 'bot' | 'awaiting_admin' | 'human';

type LocalMsg = {
    id: string;
    role: 'bot' | 'user' | 'system' | 'admin' | 'creator';
    body: string;
};

const MAIN_CHOICES = [
    'Campaigns & collaborations',
    'Payments & earnings',
    'Instagram / social account',
    'Profile & creator account',
    'Content & deliverables',
    'Technical issue',
    'Something else / contact admin',
];

const REQUEST_ADMIN = 'Request admin support';
const CLOSE_MS = 240;

type Props = {
    open: boolean;
    onClose: () => void;
    initialTopic?: string | null;
    openAdminDirect?: boolean;
    activeTicketId?: number | null;
    onTicketCreated?: (ticket: SupportTicket) => void;
};

export default function SupportChatDrawer({
    open,
    onClose,
    initialTopic = null,
    openAdminDirect = false,
    activeTicketId = null,
    onTicketCreated,
}: Props) {
    const [mounted, setMounted] = useState(open);
    const [visible, setVisible] = useState(open);
    const [mode, setMode] = useState<ChatMode>('bot');
    const [messages, setMessages] = useState<LocalMsg[]>([
        { id: 'welcome', role: 'bot', body: "Hi! I'm TapnLike Support. What can I help you with today?" },
    ]);
    const [choices, setChoices] = useState<string[]>(MAIN_CHOICES);
    const [input, setInput] = useState('');
    const [ticketId, setTicketId] = useState<number | null>(activeTicketId);
    const [escalationTopic, setEscalationTopic] = useState('General support');
    const [error, setError] = useState<string | null>(null);
    const [typingLabel, setTypingLabel] = useState<string | null>(null);
    const messagesRef = useRef<HTMLDivElement>(null);
    const bootstrapped = useRef(false);

    const createTicket = useCreateSupportTicket();
    const sendMessage = useSendSupportMessage();
    const { data: ticket, refetch: refetchTicket } = useSupportTicket(ticketId);

    const ticketStatus = ticket?.status;
    const isTicketClosed = ticketStatus === 'closed';
    const showInput = (mode === 'awaiting_admin' || mode === 'human') && !isTicketClosed;

    useEffect(() => {
        if (open) {
            setMounted(true);
            const id = requestAnimationFrame(() => setVisible(true));
            const previous = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                cancelAnimationFrame(id);
                document.body.style.overflow = previous;
            };
        }

        setVisible(false);
        const timer = window.setTimeout(() => setMounted(false), CLOSE_MS);
        return () => window.clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        if (!open) {
            bootstrapped.current = false;
            return;
        }

        if (activeTicketId) {
            setTicketId(activeTicketId);
            setMode('human');
            setChoices([]);
            return;
        }

        if (bootstrapped.current) return;
        bootstrapped.current = true;

        setMode('bot');
        setTicketId(null);
        setError(null);
        setInput('');
        setEscalationTopic(initialTopic || 'General support');
        setMessages([
            { id: 'welcome', role: 'bot', body: "Hi! I'm TapnLike Support. What can I help you with today?" },
        ]);
        setChoices(MAIN_CHOICES);

        if (openAdminDirect) {
            setTimeout(() => beginAdminRequest(initialTopic || 'Admin support'), 120);
        } else if (initialTopic) {
            setTimeout(() => choose(initialTopic), 120);
        }
    }, [open, activeTicketId, initialTopic, openAdminDirect]);

    useEffect(() => {
        if (!ticket?.messages?.length || mode !== 'human') return;
        setMessages(
            ticket.messages.map((msg) => ({
                id: String(msg.id),
                role: mapRole(msg),
                body: msg.body,
            })),
        );
    }, [ticket, mode]);

    useEffect(() => {
        messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, typingLabel, showInput, isTicketClosed]);

    useEffect(() => {
        if (!open || !ticketId) return;

        const socket = getSupportSocket();
        if (!socket) return;

        socket.emit('support:join', { ticketId });

        const onMessage = (payload: { ticket_id: number; message: SupportMessage }) => {
            if (payload.ticket_id !== ticketId) return;
            setMessages((prev) => {
                if (prev.some((m) => m.id === String(payload.message.id))) return prev;
                return [
                    ...prev,
                    {
                        id: String(payload.message.id),
                        role: mapRole(payload.message),
                        body: payload.message.body,
                    },
                ];
            });
            setTypingLabel(null);
            refetchTicket();
        };

        const onTyping = (payload: {
            ticket_id: number;
            name: string;
            role: string;
            is_typing: boolean;
        }) => {
            if (payload.ticket_id !== ticketId) return;
            if (ticketStatus === 'closed') {
                setTypingLabel(null);
                return;
            }
            setTypingLabel(payload.is_typing ? `${payload.name} is typing…` : null);
        };

        const onStatus = (payload: {
            ticket_id: number;
            status?: SupportTicket['status'];
            assigned_admin_id?: number | null;
        }) => {
            if (payload.ticket_id !== ticketId) return;
            refetchTicket();
            if (payload.status === 'closed') {
                setTypingLabel(null);
                setInput('');
            }
        };

        socket.on('support:message:new', onMessage);
        socket.on('support:typing', onTyping);
        socket.on('support:status', onStatus);

        return () => {
            socket.emit('support:leave', { ticketId });
            socket.off('support:message:new', onMessage);
            socket.off('support:typing', onTyping);
            socket.off('support:status', onStatus);
        };
    }, [open, ticketId, refetchTicket, ticketStatus]);

    function addLocal(role: LocalMsg['role'], body: string) {
        setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, role, body }]);
    }

    function beginAdminRequest(topic: string) {
        setEscalationTopic(topic || 'General support');
        setMode('awaiting_admin');
        setChoices([]);
        addLocal(
            'bot',
            'Please describe your issue below. When you send it, we’ll create a support ticket and notify the admin team.',
        );
    }

    function choose(topic: string) {
        addLocal('user', topic);

        if (topic === 'Something else / contact admin' || topic === REQUEST_ADMIN) {
            beginAdminRequest(topic === REQUEST_ADMIN ? escalationTopic : 'Something else');
            return;
        }

        if (topic === 'Back to main topics') {
            setMode('bot');
            addLocal('bot', 'What else can I help with?');
            setChoices(MAIN_CHOICES);
            return;
        }

        const tree = BOT_RESPONSES[topic];
        if (tree) {
            setEscalationTopic(topic);
            addLocal('bot', tree.text);
            setChoices([...tree.choices.filter((c) => c !== 'Something else'), REQUEST_ADMIN, 'Back to main topics']);
            return;
        }

        const answer = BOT_ANSWERS[topic];
        if (answer) {
            setEscalationTopic(topic);
            addLocal('bot', answer);
            setChoices([REQUEST_ADMIN, 'Back to main topics']);
            return;
        }

        setEscalationTopic(topic);
        addLocal('bot', 'Thanks. I’ve recorded that selection.');
        setChoices([REQUEST_ADMIN, 'Back to main topics']);
    }

    async function createAdminTicket(message: string) {
        setError(null);
        try {
            const created = await createTicket.mutateAsync({
                topic: escalationTopic,
                subject: escalationTopic,
                message,
            });
            setTicketId(created.id);
            setMode('human');
            setChoices([]);
            onTicketCreated?.(created);

            if (created.messages?.length) {
                setMessages(
                    created.messages.map((msg) => ({
                        id: String(msg.id),
                        role: mapRole(msg),
                        body: msg.body,
                    })),
                );
            } else {
                addLocal('system', `Support request ${created.ticket_code} created. An admin will reply here.`);
            }
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not create support request'));
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const text = input.trim();
        if (!text || !showInput || isTicketClosed) return;
        setInput('');
        setError(null);

        if (mode === 'awaiting_admin') {
            addLocal('user', text);
            await createAdminTicket(text);
            return;
        }

        if (mode === 'human' && ticketId) {
            try {
                const result = await sendMessage.mutateAsync({ ticketId, message: text });
                setMessages((prev) => {
                    if (prev.some((m) => m.id === String(result.message.id))) return prev;
                    return [
                        ...prev,
                        {
                            id: String(result.message.id),
                            role: mapRole(result.message),
                            body: result.message.body,
                        },
                    ];
                });
                getSupportSocket()?.emit('support:typing', { ticketId, is_typing: false });
            } catch (err) {
                setError(getApiErrorMessage(err, 'Failed to send message'));
            }
        }
    }

    function onInputChange(value: string) {
        if (isTicketClosed) return;
        setInput(value);
        if (mode === 'human' && ticketId) {
            getSupportSocket()?.emit('support:typing', { ticketId, is_typing: true });
        }
    }

    if (!mounted) return null;

    return (
        <div
            className={`pointer-events-none fixed inset-0 z-50 sm:flex sm:items-stretch sm:justify-end sm:p-4 ${
                visible ? 'animate-support-overlay-in' : 'animate-support-overlay-out'
            }`}
        >
            <div
                className={`pointer-events-auto fixed inset-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-[0_25px_80px_rgba(11,39,68,0.28)] sm:static sm:inset-auto sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-[min(430px,calc(100vw-2rem))] sm:rounded-[24px] ${
                    visible ? 'animate-support-panel-in' : 'animate-support-panel-out'
                }`}
            >
                <div className="flex shrink-0 items-center gap-3 bg-gradient-to-br from-[#0b2744] to-[#00B4EB] px-4 py-3.5 text-white sm:px-5 sm:py-4 pt-[max(0.875rem,env(safe-area-inset-top))]">
                    <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-white/15 text-lg">✦</div>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-bold">
                            {mode === 'human' ? 'TapnLike Admin Support' : 'TapnLike Support'}
                        </h3>
                        <p className="text-xs text-white/75">
                            {ticket?.ticket_code
                                ? `${ticket.ticket_code} · ${ticket.status.replace('_', ' ')}`
                                : mode === 'awaiting_admin'
                                  ? 'Describe your issue to create a ticket'
                                  : 'Usually replies instantly'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
                        aria-label="Close chat"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div
                    ref={messagesRef}
                    className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain bg-[#f4f8fc] px-4 py-4"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`max-w-[84%] rounded-[15px] px-3 py-2.5 text-[13px] leading-relaxed ${
                                msg.role === 'user' || msg.role === 'creator'
                                    ? 'ml-auto rounded-tr-[5px] bg-brand-orange text-white'
                                    : msg.role === 'system'
                                      ? 'mx-auto bg-[#e8f4fa] text-[#3d5a73]'
                                      : 'rounded-tl-[5px] border border-[#dce8f0] bg-white text-brand-ink'
                            }`}
                        >
                            {msg.body}
                        </div>
                    ))}
                    {typingLabel && !isTicketClosed && (
                        <p className="text-[11px] text-[#7a8796]">{typingLabel}</p>
                    )}
                </div>

                {mode === 'bot' && choices.length > 0 && (
                    <div className="grid max-h-[40vh] shrink-0 gap-2 overflow-y-auto border-t border-[#dce8f0] bg-white p-3 sm:max-h-56">
                        {choices.map((choice) => (
                            <button
                                key={choice}
                                type="button"
                                onClick={() => {
                                    if (choice === REQUEST_ADMIN) {
                                        addLocal('user', choice);
                                        beginAdminRequest(escalationTopic);
                                        return;
                                    }
                                    choose(choice);
                                }}
                                className="rounded-[11px] border border-[#cfe4f0] bg-[#f4fbff] px-3 py-2.5 text-left text-[12px] font-semibold text-[#0b2744] hover:border-brand-orange/40"
                            >
                                {choice}
                            </button>
                        ))}
                    </div>
                )}

                {error && <p className="shrink-0 px-4 pb-1 text-xs text-red-500">{error}</p>}

                {isTicketClosed ? (
                    <div className="shrink-0 border-t border-[#dce8f0] bg-[#f8fafc] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
                        <p className="text-sm font-bold text-[#0b2744]">This ticket is closed</p>
                        <p className="mt-1 text-[12px] text-[#7a8796]">
                            Messaging is disabled. Start a new support request if you still need help.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 rounded-full bg-[#0b2744] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#123050]"
                        >
                            Back to support
                        </button>
                    </div>
                ) : showInput ? (
                    <form
                        onSubmit={handleSubmit}
                        className="flex shrink-0 gap-2 border-t border-[#dce8f0] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                    >
                        <input
                            value={input}
                            onChange={(event) => onInputChange(event.target.value)}
                            placeholder={
                                mode === 'awaiting_admin'
                                    ? 'Describe your issue for admin…'
                                    : 'Type your message…'
                            }
                            className="min-w-0 flex-1 rounded-[11px] border border-[#dce8f0] px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={createTicket.isPending || sendMessage.isPending || !input.trim()}
                            className="grid h-11 w-11 flex-none place-items-center rounded-[11px] bg-brand-orange text-white disabled:opacity-60"
                            aria-label="Send"
                        >
                            {createTicket.isPending || sendMessage.isPending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                        </button>
                    </form>
                ) : null}
            </div>
        </div>
    );
}

function mapRole(msg: SupportMessage): LocalMsg['role'] {
    if (msg.sender_role === 'system' || msg.sender_role === 'bot') return 'system';
    if (msg.sender_role === 'admin') return 'admin';
    if (msg.sender_role === 'creator') return 'creator';
    return 'bot';
}
