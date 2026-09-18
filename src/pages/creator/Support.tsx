import { useEffect, useMemo, useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Clapperboard,
    Gift,
    HelpCircle,
    Instagram,
    Loader2,
    Mail,
    MessageCircle,
    Music2,
    Settings2,
    UserRound,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SupportChatDrawer from '@/components/support/SupportChatDrawer';
import { COMPANY } from '@/constants/company';
import {
    SUPPORT_TOPICS,
    useMySupportTickets,
    useSupportFaqs,
    type SupportFaq,
    type SupportTicket,
} from '@/hooks/useSupport';

type FaqCategoryMeta = {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;
    accent: string;
    soft: string;
    chip: string;
};

const FAQ_CATEGORY_META: Record<string, FaqCategoryMeta> = {
    campaigns: {
        key: 'campaigns',
        label: 'Campaigns',
        description: 'Gifts, applications & status',
        icon: Gift,
        accent: 'text-brand-orange',
        soft: 'bg-[#fff3eb]',
        chip: 'border-brand-orange/20 bg-[#fff3eb] text-brand-orange',
    },
    content: {
        key: 'content',
        label: 'Content & sound',
        description: 'Reel submit & verification',
        icon: Music2,
        accent: 'text-[#0b2744]',
        soft: 'bg-[#eef4fa]',
        chip: 'border-[#0b2744]/15 bg-[#eef4fa] text-[#0b2744]',
    },
    payments: {
        key: 'payments',
        label: 'Payments',
        description: 'Wallet, 48h hold & payouts',
        icon: Wallet,
        accent: 'text-emerald-600',
        soft: 'bg-emerald-50',
        chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    instagram: {
        key: 'instagram',
        label: 'Instagram',
        description: 'Connect, sync & Professional',
        icon: Instagram,
        accent: 'text-[#00B4EB]',
        soft: 'bg-[#eaf8fd]',
        chip: 'border-[#00B4EB]/25 bg-[#eaf8fd] text-[#078db8]',
    },
    account: {
        key: 'account',
        label: 'Profile & account',
        description: 'Profile, rates & access',
        icon: UserRound,
        accent: 'text-[#2563eb]',
        soft: 'bg-[#eff6ff]',
        chip: 'border-blue-200 bg-[#eff6ff] text-[#1d4ed8]',
    },
    studio: {
        key: 'studio',
        label: 'Reel Studio',
        description: 'Publish, schedule & Meta',
        icon: Clapperboard,
        accent: 'text-[#c2410c]',
        soft: 'bg-orange-50',
        chip: 'border-orange-200 bg-orange-50 text-[#c2410c]',
    },
    support: {
        key: 'support',
        label: 'Support',
        description: 'Chat, tickets & admin help',
        icon: HelpCircle,
        accent: 'text-[#123050]',
        soft: 'bg-[#f4f8fc]',
        chip: 'border-[#dce8f0] bg-[#f4f8fc] text-[#123050]',
    },
};

const FALLBACK_CATEGORY: FaqCategoryMeta = {
    key: 'other',
    label: 'General',
    description: 'Other common questions',
    icon: Settings2,
    accent: 'text-[#5b6d82]',
    soft: 'bg-[#f4f8fc]',
    chip: 'border-[#dce8f0] bg-[#f4f8fc] text-[#5b6d82]',
};

function statusClass(status: SupportTicket['status']) {
    if (status === 'closed') {
        return 'bg-gray-100 text-gray-600';
    }
    if (status === 'open' || status === 'in_progress') {
        return 'bg-[#fff3eb] text-brand-orange';
    }
    return 'bg-emerald-50 text-emerald-600';
}

function statusLabel(status: SupportTicket['status']) {
    return status.replace('_', ' ');
}

function getCategoryMeta(category: string): FaqCategoryMeta {
    return FAQ_CATEGORY_META[category] || { ...FALLBACK_CATEGORY, key: category, label: category };
}

export default function CreatorSupport() {
    const { data: faqs = [], isLoading: faqsLoading } = useSupportFaqs();
    const { data: tickets = [], isLoading: ticketsLoading, refetch } = useMySupportTickets();
    const [openFaqId, setOpenFaqId] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [chatOpen, setChatOpen] = useState(false);
    const [initialTopic, setInitialTopic] = useState<string | null>(null);
    const [openAdminDirect, setOpenAdminDirect] = useState(false);
    const [activeTicketId, setActiveTicketId] = useState<number | null>(null);

    const faqGroups = useMemo(() => {
        const map = new Map<string, SupportFaq[]>();
        for (const faq of faqs) {
            const list = map.get(faq.category) || [];
            list.push(faq);
            map.set(faq.category, list);
        }
        return map;
    }, [faqs]);

    const categories = useMemo(() => Array.from(faqGroups.keys()), [faqGroups]);

    useEffect(() => {
        if (activeCategory !== 'all' && !faqGroups.has(activeCategory) && categories[0]) {
            setActiveCategory('all');
        }
    }, [activeCategory, categories, faqGroups]);

    const visibleGroups = useMemo(() => {
        if (activeCategory === 'all') return Array.from(faqGroups.entries());
        const items = faqGroups.get(activeCategory);
        return items ? [[activeCategory, items] as [string, SupportFaq[]]] : [];
    }, [activeCategory, faqGroups]);

    function openChat(options?: { topic?: string; admin?: boolean; ticketId?: number }) {
        setInitialTopic(options?.topic || null);
        setOpenAdminDirect(Boolean(options?.admin));
        setActiveTicketId(options?.ticketId || null);
        setChatOpen(true);
    }

    function closeChat() {
        setChatOpen(false);
        setActiveTicketId(null);
        refetch();
    }

    return (
        <div className="relative mx-auto max-w-[1180px] space-y-6 pb-24">
            <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0b2744] via-[#123050] to-[#00B4EB] px-7 py-10 text-white shadow-[0_18px_45px_rgba(11,39,68,0.2)]">
                <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10" />
                <h1 className="relative text-3xl font-extrabold tracking-tight sm:text-[38px]">
                    How can we help, Creator?
                </h1>
                <p className="relative mt-2 max-w-xl text-sm text-white/80 sm:text-base">
                    Get quick answers from FAQs or start a conversation with TapnLike support.
                </p>
                <div className="relative mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => openChat()}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0b2744] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f4f8fc]"
                    >
                        <MessageCircle size={16} />
                        Start a chat
                    </button>
                    <button
                        type="button"
                        onClick={() => document.getElementById('admin-help')?.scrollIntoView({ behavior: 'smooth' })}
                        className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                    >
                        <Mail size={16} />
                        Contact admin
                    </button>
                </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <section className="rounded-[20px] border border-[#dce8f0] bg-white p-5 shadow-[0_12px_35px_rgba(28,25,60,0.05)]">
                    <h2 className="text-lg font-extrabold text-brand-ink">Choose a topic</h2>
                    <p className="mt-1 text-[13px] text-[#73788b]">
                        Select what you need help with and our support bot will guide you.
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {SUPPORT_TOPICS.map((topic) => (
                            <button
                                key={topic.key}
                                type="button"
                                onClick={() => openChat({ topic: topic.key })}
                                className="flex items-center gap-3 rounded-[15px] border border-[#dce8f0] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#ffd2b8] hover:bg-[#fffaf7]"
                            >
                                <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[13px] bg-[#fff3eb] text-lg">
                                    {topic.icon}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <b className="block text-sm text-brand-ink">{topic.title}</b>
                                    <small className="mt-0.5 block text-[11px] text-[#73788b]">{topic.subtitle}</small>
                                </span>
                                <ChevronRight size={16} className="text-[#9a9dac]" />
                            </button>
                        ))}
                    </div>
                </section>

                <section className="rounded-[20px] border border-[#dce8f0] bg-white p-5 shadow-[0_12px_35px_rgba(28,25,60,0.05)]">
                    <h2 className="text-lg font-extrabold text-brand-ink">My support requests</h2>
                    <p className="mt-1 text-[13px] text-[#73788b]">Track your recent conversations with support.</p>

                    {ticketsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-[#00B4EB]" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[#8a8c94]">No support requests yet.</p>
                    ) : (
                        <div className="mt-2 divide-y divide-[#e9eaf1]">
                            {tickets.slice(0, 6).map((ticket) => (
                                <button
                                    key={ticket.id}
                                    type="button"
                                    onClick={() => openChat({ ticketId: ticket.id })}
                                    className="flex w-full items-center justify-between gap-3 py-3.5 text-left transition hover:bg-[#f8fbfd]"
                                >
                                    <div>
                                        <b className="text-sm text-brand-ink">{ticket.ticket_code}</b>
                                        <div className="text-xs text-[#73788b]">{ticket.subject}</div>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusClass(ticket.status)}`}>
                                        {statusLabel(ticket.status)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section className="overflow-hidden rounded-[24px] border border-[#dce8f0] bg-white shadow-[0_12px_35px_rgba(28,25,60,0.05)]">
                <div className="border-b border-[#e9eaf1] bg-gradient-to-r from-[#f8fbfe] to-white px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff3eb] text-brand-orange">
                                    <HelpCircle size={16} />
                                </span>
                                <h2 className="text-lg font-extrabold text-brand-ink">Frequently asked questions</h2>
                            </div>
                            <p className="text-[13px] text-[#73788b]">Browse by category, then expand a question.</p>
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa3af]">
                            {faqs.length} answers
                        </p>
                    </div>

                    {!faqsLoading && categories.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                            <button
                                type="button"
                                onClick={() => setActiveCategory('all')}
                                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                                    activeCategory === 'all'
                                        ? 'border-[#0b2744] bg-[#0b2744] text-white'
                                        : 'border-[#dce8f0] bg-white text-[#5b6d82] hover:border-[#00B4EB]/40'
                                }`}
                            >
                                All
                            </button>
                            {categories.map((category) => {
                                const meta = getCategoryMeta(category);
                                const Icon = meta.icon;
                                const active = activeCategory === category;
                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => setActiveCategory(category)}
                                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                                            active
                                                ? 'border-[#0b2744] bg-[#0b2744] text-white'
                                                : `${meta.chip} hover:brightness-[0.98]`
                                        }`}
                                    >
                                        <Icon size={13} />
                                        {meta.label}
                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-white/70'}`}>
                                            {faqGroups.get(category)?.length || 0}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-5 sm:p-6">
                    {faqsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-[#00B4EB]" />
                        </div>
                    ) : faqs.length === 0 ? (
                        <p className="py-6 text-sm text-[#8a8c94]">FAQs will appear here once published.</p>
                    ) : (
                        <div className="space-y-5">
                            {visibleGroups.map(([category, items]) => {
                                const meta = getCategoryMeta(category);
                                const Icon = meta.icon;
                                return (
                                    <div key={category} className="overflow-hidden rounded-[18px] border border-[#e6edf4]">
                                        <div className={`flex items-center gap-3 border-b border-[#eef2f6] px-4 py-3.5 ${meta.soft}`}>
                                            <span className={`grid h-10 w-10 place-items-center rounded-[12px] bg-white shadow-sm ${meta.accent}`}>
                                                <Icon size={18} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-extrabold text-brand-ink">{meta.label}</h3>
                                                <p className="text-[11px] text-[#7a8796]">{meta.description}</p>
                                            </div>
                                            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7a8796]">
                                                {items.length} Qs
                                            </span>
                                        </div>

                                        <div className="divide-y divide-[#eef2f6] bg-white">
                                            {items.map((faq) => {
                                                const open = openFaqId === faq.id;
                                                return (
                                                    <div key={faq.id} className="px-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenFaqId(open ? null : faq.id)}
                                                            className="flex w-full items-start gap-3 py-4 text-left"
                                                        >
                                                            <span className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full ${meta.soft} ${meta.accent}`}>
                                                                <ChevronDown
                                                                    size={14}
                                                                    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                                                                />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-sm font-semibold text-brand-ink">
                                                                    {faq.question}
                                                                </span>
                                                                <div
                                                                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                                                        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                                                    }`}
                                                                >
                                                                    <div className="overflow-hidden">
                                                                        <p className="pt-2 text-[13px] leading-relaxed text-[#73788b]">
                                                                            {faq.answer}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section
                id="admin-help"
                className="flex flex-col items-start justify-between gap-4 rounded-[20px] border border-[#dce8f0] bg-gradient-to-br from-white to-[#f4fbff] p-6 sm:flex-row sm:items-center"
            >
                <div>
                    <h3 className="text-[17px] font-bold text-brand-ink">Need help with something else?</h3>
                    <p className="mt-1 text-[13px] text-[#73788b]">
                        Send your message directly to the TapnLike admin team, or email{' '}
                        <a className="font-semibold text-brand-orange" href={`mailto:${COMPANY.supportEmail}`}>
                            {COMPANY.supportEmail}
                        </a>
                        .
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => openChat({ admin: true })}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0b2744] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123050]"
                >
                    <Mail size={16} />
                    Message admin
                </button>
            </section>

            <p className="text-center text-xs text-[#9699a7]">
                {COMPANY.productName} Creator Support · We’re here to help you grow.
            </p>

            {!chatOpen && (
                <button
                    type="button"
                    onClick={() => openChat()}
                    aria-label="Open support chat"
                    className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange text-white animate-fab-pulse transition-all duration-300 hover:scale-105 hover:bg-[#f05a0c] sm:bottom-6 sm:right-6"
                >
                    <MessageCircle size={22} />
                </button>
            )}

            <SupportChatDrawer
                open={chatOpen}
                onClose={closeChat}
                initialTopic={initialTopic}
                openAdminDirect={openAdminDirect}
                activeTicketId={activeTicketId}
                onTicketCreated={() => refetch()}
            />
        </div>
    );
}
