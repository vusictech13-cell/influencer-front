import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Building2, CalendarDays, ChevronDown, CreditCard, Download, HandCoins, Megaphone, Users, Wallet } from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { downloadReport, useAdminReport, type ReportFormat, type ReportRange } from '@/hooks/useAdminOps';
import { LoadingRow, Notice } from './adminUi';

const CARDS = [
    { key: 'creators', label: 'Creators', kind: 'creators', icon: Users, iconClass: 'border-sky-100 bg-sky-50 text-sky-600' },
    { key: 'brands', label: 'Brands', kind: 'brands', icon: Building2, iconClass: 'border-purple-100 bg-purple-50 text-purple-600' },
    { key: 'campaigns', label: 'Campaigns', kind: 'campaigns', icon: Megaphone, iconClass: 'border-amber-100 bg-amber-50 text-amber-600' },
    { key: 'payments', label: 'Payments', kind: 'payments', icon: CreditCard, iconClass: 'border-emerald-100 bg-emerald-50 text-emerald-600' },
    { key: 'payouts', label: 'Payouts', kind: 'payouts', icon: HandCoins, iconClass: 'border-indigo-100 bg-indigo-50 text-indigo-600' },
    { key: 'wallets', label: 'Wallets', kind: 'wallets', icon: Wallet, iconClass: 'border-teal-100 bg-teal-50 text-teal-600' },
] as const;

const FORMATS: { value: ReportFormat; label: string }[] = [
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'csv', label: 'CSV (.csv)' },
    { value: 'pdf', label: 'PDF (.pdf)' },
];

type RangeKey = 'all' | 'today' | '7d' | '30d' | 'month' | 'custom';

const PRESETS: { key: RangeKey; label: string }[] = [
    { key: 'all', label: 'All time' },
    { key: 'today', label: 'Today' },
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: 'month', label: 'This month' },
    { key: 'custom', label: 'Custom range' },
];

export default function AdminReports() {
    const me = useAdminMe();
    const canExport = adminCan(me.data, 'REPORT_EXPORT');
    const [rangeKey, setRangeKey] = useState<RangeKey>('all');
    const [menuKey, setMenuKey] = useState<RangeKey>('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [applied, setApplied] = useState<ReportRange>({});
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterError, setFilterError] = useState('');
    const [format, setFormat] = useState<ReportFormat>('xlsx');
    const [formatOpen, setFormatOpen] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState('');
    const filterRef = useRef<HTMLDivElement>(null);
    const formatRef = useRef<HTMLDivElement>(null);
    const report = useAdminReport(applied);
    const data = report.data;

    useEffect(() => {
        if (!filterOpen && !formatOpen) return;
        const onPointer = (event: MouseEvent) => {
            if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
            if (!formatRef.current?.contains(event.target as Node)) setFormatOpen(false);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setFilterOpen(false);
                setFormatOpen(false);
            }
        };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [filterOpen, formatOpen]);

    const applyPreset = (key: RangeKey) => {
        setFilterError('');
        if (key === 'custom') {
            setMenuKey('custom');
            return;
        }
        setMenuKey(key);
        setRangeKey(key);
        setApplied(boundsFor(key, '', ''));
        setFilterOpen(false);
    };

    const applyCustom = () => {
        if (!customFrom && !customTo) {
            setFilterError('Choose a start date, an end date, or both.');
            return;
        }
        if (customFrom && customTo && customFrom > customTo) {
            setFilterError('Start date must be on or before the end date.');
            return;
        }
        setFilterError('');
        setMenuKey('custom');
        setRangeKey('custom');
        setApplied(boundsFor('custom', customFrom, customTo));
        setFilterOpen(false);
    };

    const download = async (kind: string) => {
        setError('');
        setBusy(kind);
        try {
            await downloadReport(kind, applied, format);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not download that report.'));
        } finally {
            setBusy('');
        }
    };

    return (
        <div className="space-y-6 font-jakarta text-slate-900">
            <div className="flex flex-col justify-between gap-4 pb-2 sm:flex-row sm:items-center">
                <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Reports</h1>
                    <p className="max-w-3xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                        Totals across the platform. Downloads include names and emails.
                    </p>
                </div>
                <div ref={filterRef} className="relative self-start sm:self-center">
                    <button
                        type="button"
                        onClick={() => {
                            setMenuKey(rangeKey);
                            setFilterOpen((open) => !open);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {rangeLabel(rangeKey, customFrom, customTo)}
                    </button>
                    {filterOpen && (
                        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => applyPreset(preset.key)}
                                    className={`flex w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                                        menuKey === preset.key ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            {menuKey === 'custom' && (
                                <div className="mt-2 space-y-2 border-t border-slate-100 px-2 pb-1 pt-3">
                                    <label className="block text-[11px] font-bold text-slate-500">From
                                        <input type="date" value={customFrom} max={customTo || undefined} onChange={(event) => setCustomFrom(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-800" />
                                    </label>
                                    <label className="block text-[11px] font-bold text-slate-500">To
                                        <input type="date" value={customTo} min={customFrom || undefined} onChange={(event) => setCustomTo(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-800" />
                                    </label>
                                    {filterError && <p className="text-[11px] font-semibold text-red-500">{filterError}</p>}
                                    <button type="button" onClick={applyCustom} className="h-9 w-full rounded-lg bg-slate-900 text-xs font-bold text-white">Apply</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {error && <Notice>{error}</Notice>}
            {report.isError && <Notice>{getApiErrorMessage(report.error, 'Could not load reports.')}</Notice>}

            {report.isLoading && !data ? <LoadingRow /> : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                    {CARDS.map((card) => {
                        const Icon = card.icon;
                        const value = data?.[card.key] ?? 0;
                        return (
                            <div key={card.key} className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06)]">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{card.label}</span>
                                    <div className={`grid h-9 w-9 place-items-center rounded-xl border ${card.iconClass}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black tracking-tight text-slate-900">{value}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {canExport && (
                <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                                <Download className="h-4 w-4 text-sky-600" /> Download data reports
                            </h2>
                            <p className="mt-0.5 text-xs font-medium text-slate-400">
                                Choose a file format. Downloads use the dates selected above.
                            </p>
                        </div>
                        <div ref={formatRef} className="relative self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setFormatOpen((open) => !open)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50 p-1.5"
                            >
                                <span className="pl-2 text-xs font-bold text-slate-500">Format</span>
                                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800">
                                    {FORMATS.find((item) => item.value === format)?.label}
                                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${formatOpen ? 'rotate-180' : ''}`} />
                                </span>
                            </button>
                            {formatOpen && (
                                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                                    {FORMATS.map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => {
                                                setFormat(item.value);
                                                setFormatOpen(false);
                                            }}
                                            className={`flex w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${
                                                format === item.value ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {CARDS.map((card) => {
                            const count = data?.[card.key] ?? 0;
                            return (
                                <button
                                    key={card.kind}
                                    type="button"
                                    disabled={busy === card.kind || report.isLoading}
                                    onClick={() => download(card.kind)}
                                    className="group flex flex-col justify-between space-y-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/80 disabled:opacity-50"
                                >
                                    <span className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 group-hover:text-sky-700">{card.label}</span>
                                        <ArrowDown className="h-3 w-3 text-slate-400 transition group-hover:translate-y-0.5 group-hover:text-sky-600" />
                                    </span>
                                    <span className="space-y-0.5">
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {busy === card.kind ? 'Preparing...' : recordsLabel(count)}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            {format === 'xlsx' ? '.XLSX' : format === 'pdf' ? '.PDF' : '.CSV'}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function boundsFor(key: RangeKey, customFrom: string, customTo: string): ReportRange {
    const now = new Date();
    const start = (date: Date) => {
        const value = new Date(date);
        value.setHours(0, 0, 0, 0);
        return value.toISOString();
    };
    const end = (date: Date) => {
        const value = new Date(date);
        value.setHours(23, 59, 59, 999);
        return value.toISOString();
    };
    if (key === 'all') return {};
    if (key === 'today') return { from: start(now), to: end(now) };
    if (key === '7d' || key === '30d') {
        const from = new Date(now);
        from.setDate(from.getDate() - (key === '7d' ? 6 : 29));
        return { from: start(from), to: end(now) };
    }
    if (key === 'month') return { from: start(new Date(now.getFullYear(), now.getMonth(), 1)), to: end(now) };
    const range: ReportRange = {};
    if (customFrom) range.from = start(new Date(`${customFrom}T00:00:00`));
    if (customTo) range.to = end(new Date(`${customTo}T00:00:00`));
    return range;
}

function rangeLabel(key: RangeKey, customFrom: string, customTo: string) {
    if (key === 'all') return 'All time';
    if (key === 'today') return 'Today';
    if (key === '7d') return 'Last 7 days';
    if (key === '30d') return 'Last 30 days';
    if (key === 'month') return 'This month';
    if (customFrom && customTo) return `${formatDay(customFrom)} – ${formatDay(customTo)}`;
    if (customFrom) return `From ${formatDay(customFrom)}`;
    if (customTo) return `Until ${formatDay(customTo)}`;
    return 'Custom range';
}

function formatDay(value: string) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function recordsLabel(count: number) {
    return `${count} ${count === 1 ? 'record' : 'records'}`;
}
