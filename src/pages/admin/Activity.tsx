import { useEffect, useMemo, useState } from 'react';
import {
    Activity as ActivityIcon,
    ChevronDown,
    Download,
    FileJson,
    FileSpreadsheet,
    List,
    RotateCw,
    Search,
    ShieldAlert,
    UserCheck,
    UserX,
    X,
} from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminActivity, type ActivityItem } from '@/hooks/useAdminAudit';
import { LoadingRow, Notice, formatWhen } from './adminUi';

const PAGE_SIZE = 8;
const MODULES = ['AUTH', 'SESSION', 'ADMIN', 'ROLE', 'PERMISSION', 'CREATOR', 'BRAND', 'CAMPAIGN', 'PAYMENT', 'PAYOUT', 'WALLET', 'SUPPORT', 'CONTENT', 'REPORT', 'SETTINGS'];

type Severity = 'INFO' | 'WARNING' | 'CRITICAL';
type Toast = { id: number; message: string };

function severityOf(action: string): Severity {
    if (/FAILED|DELETED/.test(action)) return 'CRITICAL';
    if (/REVOK|SUSPEND/.test(action)) return 'WARNING';
    return 'INFO';
}

function moduleClass(module: string) {
    const styles: Record<string, string> = {
        ADMIN: 'border-blue-200 bg-blue-50 text-blue-700',
        CREATOR: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        SESSION: 'border-purple-200 bg-purple-50 text-purple-700',
        BRAND: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        CAMPAIGN: 'border-amber-200 bg-amber-50 text-amber-700',
        SECURITY: 'border-rose-200 bg-rose-50 text-rose-700',
        AUTH: 'border-rose-200 bg-rose-50 text-rose-700',
        ROLE: 'border-orange-200 bg-orange-50 text-orange-700',
        PERMISSION: 'border-orange-200 bg-orange-50 text-orange-700',
    };
    return styles[module] || 'border-slate-200 bg-slate-100 text-slate-600';
}

function severityClass(severity: Severity) {
    if (severity === 'CRITICAL') return 'border-rose-200/80 bg-rose-50 text-rose-700';
    if (severity === 'WARNING') return 'border-amber-200/80 bg-amber-50 text-amber-700';
    return 'border-slate-200 bg-slate-100 text-slate-700';
}

function relativeTime(value?: string) {
    if (!value) return '';
    const delta = Date.now() - new Date(value).getTime();
    const minutes = Math.round(delta / 60000);
    if (Number.isNaN(minutes)) return '';
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

function actorName(item: ActivityItem) {
    return item.actor?.name?.trim() || (item.actor_type === 'ADMIN' ? 'Admin' : 'User');
}

function actorTypeLabel(item: ActivityItem) {
    return item.actor?.type || (item.actor_type === 'ADMIN' ? 'Admin' : 'User');
}

function actorSummary(item: ActivityItem) {
    const parts = [actorName(item), actorTypeLabel(item), item.actor?.email].filter(Boolean);
    return parts.join(' · ');
}

function actorMark(item: ActivityItem) {
    const name = item.actor?.name?.trim();
    if (!name) return item.actor_type === 'ADMIN' ? 'A' : 'U';
    return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
}

function isToday(value?: string) {
    if (!value) return false;
    const date = new Date(value);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function downloadFile(filename: string, contents: string, type: string) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function labelFor(key: string) {
    const known: Record<string, string> = {
        status: 'Status',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        code: 'Code',
        role: 'Role',
        roles: 'Roles',
        permissions: 'Permissions',
        deleted: 'Removed',
        description: 'Description',
        session_id: 'Session',
        reason: 'Reason',
    };
    if (known[key]) return known[key];
    return key
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: unknown): string {
    if (value == null || value === '') return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
        if (!value.length) return 'None';
        return value.map((item) => displayValue(item)).join(', ');
    }
    if (isRecord(value)) {
        const parts = Object.entries(value).map(([key, item]) => `${labelFor(key)}: ${displayValue(item)}`);
        return parts.join(' · ') || 'Not set';
    }
    const text = String(value);
    if (/^[A-Z0-9_]+$/.test(text)) {
        return text.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    }
    if (/^[a-z][a-z\s-]*$/.test(text)) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    return text.replaceAll('_', ' ');
}

function deviceSummary(agent: string) {
    const browser = /Edg\//.test(agent) ? 'Edge'
        : /Chrome\//.test(agent) ? 'Chrome'
            : /Firefox\//.test(agent) ? 'Firefox'
                : /Safari\//.test(agent) ? 'Safari'
                    : 'a browser';
    const device = /iPhone|iPad/.test(agent) ? 'iPhone'
        : /Android/.test(agent) ? 'Android'
            : /Windows/.test(agent) ? 'Windows'
                : /Mac OS X/.test(agent) ? 'Mac'
                    : 'this device';
    return `${browser} on ${device}`;
}

function changeRows(oldData: unknown, newData: unknown) {
    const previous = isRecord(oldData) ? oldData : {};
    const next = isRecord(newData) ? newData : {};
    const keys = [...new Set([...Object.keys(previous), ...Object.keys(next)])];
    return keys
        .map((key) => ({
            label: labelFor(key),
            before: key in previous ? displayValue(previous[key]) : null,
            after: key in next ? displayValue(next[key]) : null,
        }))
        .filter((row) => row.before !== row.after);
}

function severityLabel(level: Severity) {
    if (level === 'CRITICAL') return 'Critical';
    if (level === 'WARNING') return 'Needs attention';
    return 'Routine';
}

type ProfileChange = {
    field: string;
    added?: string[];
    removed?: string[];
    before?: string | number | null;
    after?: string | number | null;
};

function readProfileChanges(data: unknown): ProfileChange[] | null {
    if (!isRecord(data) || !Array.isArray(data.changes)) return null;
    const rows = data.changes.filter(isRecord).map((change) => ({
        field: String(change.field || 'Profile'),
        added: Array.isArray(change.added) ? change.added.map(String) : [],
        removed: Array.isArray(change.removed) ? change.removed.map(String) : [],
        before: change.before == null ? null : String(change.before),
        after: change.after == null ? null : String(change.after),
    }));
    return rows.length ? rows : null;
}

function fieldTitle(field: string) {
    return field.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function payloadOf(item: ActivityItem) {
    return {
        event_id: item.id,
        action: item.action,
        module: item.module,
        actor_type: item.actor_type,
        actor_id: item.actor_id,
        description: item.description,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        session_id: item.session_id || null,
        ip_address: item.ip_address,
        user_agent: item.user_agent || null,
        old_data: item.old_data || null,
        new_data: item.new_data || null,
        created_at: item.createdAt,
    };
}

export default function AdminActivity() {
    const me = useAdminMe();
    const canViewUsers = adminCan(me.data, 'ACTIVITY_VIEW_USERS');
    const canViewAdmins = adminCan(me.data, 'ACTIVITY_VIEW_ADMINS');
    const actorOptions: [string, string][] = [
        ...(canViewUsers && canViewAdmins ? [['', 'All actors'] as [string, string]] : []),
        ...(canViewAdmins ? [['ADMIN', 'Admins'] as [string, string]] : []),
        ...(canViewUsers ? [['USER', 'Users'] as [string, string]] : []),
    ];
    const [actorType, setActorType] = useState('');
    const [module, setModule] = useState('');
    const [severity, setSeverity] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [exportOpen, setExportOpen] = useState(false);
    const [selected, setSelected] = useState<ActivityItem | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    useEffect(() => {
        if (!me.data) return;
        const allowed = actorOptions.map(([value]) => value);
        if (!allowed.includes(actorType)) setActorType(allowed[0] || '');
    }, [me.data, actorType, canViewUsers, canViewAdmins]);

    const activity = useAdminActivity(1, actorType, module, 50);

    const pushToast = (message: string) => {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, message }]);
        window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 2800);
    };

    const items = activity.data?.items || [];
    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return items.filter((item) => {
            const level = severityOf(item.action);
            if (severity && level !== severity) return false;
            if (!needle) return true;
            const haystack = `${actorSummary(item)} ${item.action} ${item.module} ${item.description || ''} ${item.ip_address || ''}`.toLowerCase();
            return haystack.includes(needle);
        });
    }, [items, query, severity]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const todayCount = items.filter((item) => isToday(item.createdAt)).length;
    const warningCount = items.filter((item) => severityOf(item.action) !== 'INFO').length;
    const adminActors = new Set(items.filter((item) => item.actor_type === 'ADMIN').map((item) => item.actor_id)).size;
    const revocations = items.filter((item) => item.action === 'SESSION_REVOKED').length;
    const rangeStart = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
    const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

    const pills = [
        actorType ? `Actor: ${actorType === 'ADMIN' ? 'Admins' : 'Users'}` : '',
        module ? `Module: ${module}` : '',
        severity ? `Severity: ${severity}` : '',
        query.trim() ? `Query: "${query.trim()}"` : '',
    ].filter(Boolean);

    const reset = () => {
        setActorType('');
        setModule('');
        setSeverity('');
        setQuery('');
        setPage(1);
    };

    const exportLogs = (format: 'CSV' | 'JSON') => {
        setExportOpen(false);
        if (!filtered.length) {
            pushToast('Nothing to export');
            return;
        }
        if (format === 'JSON') {
            downloadFile('activity-logs.json', JSON.stringify(filtered.map(payloadOf), null, 2), 'application/json');
        } else {
            const header = ['when', 'actor', 'module', 'action', 'detail', 'severity', 'ip'];
            const rows = filtered.map((item) => [
                formatWhen(item.createdAt),
                actorSummary(item),
                item.module,
                item.action,
                item.description || '',
                severityOf(item.action),
                item.ip_address || '',
            ]);
            const csv = [header, ...rows]
                .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
                .join('\n');
            downloadFile('activity-logs.csv', csv, 'text/csv');
        }
        pushToast(`Exported ${filtered.length} records as ${format}`);
    };

    const profileChanges = selected ? readProfileChanges(selected.new_data) : null;
    const selectedChanges = selected && !profileChanges ? changeRows(selected.old_data, selected.new_data) : [];
    const selectedLevel = selected ? severityOf(selected.action) : 'INFO';

    return (
        <div className="space-y-6 font-jakarta text-slate-800">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-2 md:flex-row md:items-center">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Activity Log</h1>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            Live feed
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        A record of admin and user actions, including logins, role changes, and session revocations.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => activity.refetch()}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                    >
                        <RotateCw className={`h-4 w-4 text-slate-500 ${activity.isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setExportOpen((open) => !open)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                        >
                            <Download className="h-4 w-4" />
                            Export logs
                            <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        {exportOpen && (
                            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 text-xs shadow-lg">
                                <button type="button" onClick={() => exportLogs('CSV')} className="flex w-full items-center gap-2 px-3.5 py-2 text-left font-medium text-slate-700 hover:bg-slate-50">
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export as CSV
                                </button>
                                <button type="button" onClick={() => exportLogs('JSON')} className="flex w-full items-center gap-2 px-3.5 py-2 text-left font-medium text-slate-700 hover:bg-slate-50">
                                    <FileJson className="h-4 w-4 text-amber-600" /> Export as JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Metric icon={List} label="Total events" value={activity.data?.total ?? 0} note={todayCount ? `${todayCount} today in view` : 'Matching filters'} />
                <Metric icon={ShieldAlert} iconClass="text-rose-500" label="Warnings" value={warningCount} note="Suspend and revoke" />
                <Metric icon={UserCheck} iconClass="text-orange-500" label="Admin actors" value={adminActors} note="In the latest records" />
                <Metric icon={UserX} iconClass="text-amber-500" label="Session revocations" value={revocations} note="In the latest records" />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => { setPage(1); setQuery(event.target.value); }}
                            placeholder="Search by actor, action, or detail..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-9 text-xs outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                        {query && (
                            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <FilterSelect value={actorType} onChange={(value) => { setPage(1); setActorType(value); }} options={actorOptions.length ? actorOptions : [['', 'All actors']]} />
                        <FilterSelect value={module} onChange={(value) => { setPage(1); setModule(value); }} options={[['', 'All modules'], ...MODULES.map((item) => [item, item] as [string, string])]} />
                        <FilterSelect value={severity} onChange={(value) => { setPage(1); setSeverity(value); }} options={[['', 'All severity levels'], ['INFO', 'Info'], ['WARNING', 'Warning'], ['CRITICAL', 'Critical']]} />
                        <button type="button" onClick={reset} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-800">Reset</button>
                    </div>
                </div>
                {!!pills.length && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-xs">
                        <span className="font-medium text-slate-400">Active filters:</span>
                        {pills.map((pill) => (
                            <span key={pill} className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{pill}</span>
                        ))}
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                {activity.isLoading ? <LoadingRow /> : activity.isError ? (
                    <div className="p-5"><Notice>{getApiErrorMessage(activity.error, 'Could not load activity.')}</Notice></div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                        <th className="px-5 py-3.5">When</th>
                                        <th className="px-5 py-3.5">Actor</th>
                                        <th className="px-5 py-3.5">Module / action</th>
                                        <th className="px-5 py-3.5">Detail</th>
                                        <th className="px-5 py-3.5">Severity</th>
                                        <th className="px-5 py-3.5 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {visible.map((item) => {
                                        const level = severityOf(item.action);
                                        return (
                                            <tr key={item.id} className="border-b border-slate-100/80 hover:bg-slate-50/80">
                                                <td className="whitespace-nowrap px-5 py-3.5">
                                                    <div className="font-medium text-slate-700">{formatWhen(item.createdAt)}</div>
                                                    <div className="text-[10px] font-medium text-slate-400">{relativeTime(item.createdAt)}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700">{actorMark(item)}</div>
                                                        <div>
                                                            <span className="block font-bold tracking-tight text-slate-800">{actorName(item)}</span>
                                                            <span className="text-[10px] text-slate-400">{actorTypeLabel(item)}{item.actor?.email ? ` · ${item.actor.email}` : ''}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3.5">
                                                    <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-black uppercase ${moduleClass(item.module)}`}>{item.module}</span>
                                                    <div className="mt-0.5 font-bold tracking-tight text-slate-900">{item.action.replaceAll('_', ' ')}</div>
                                                    <div className="font-mono text-[10px] text-slate-400">{item.action}</div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="max-w-xs truncate text-slate-600">{item.description || '—'}</div>
                                                    <div className="font-mono text-[10px] text-slate-400">IP: {item.ip_address || '—'}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3.5">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${severityClass(level)}`}>{level}</span>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                                                    <button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {!filtered.length && (
                            <div className="py-16 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                    <Search className="h-6 w-6" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">No activity logs found</h3>
                                <p className="mt-1 text-xs text-slate-500">Try another actor, module, or search.</p>
                                <button type="button" onClick={reset} className="mt-3 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100">Clear filters</button>
                            </div>
                        )}
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-500 sm:flex-row">
                            <span>
                                Showing <span className="font-bold text-slate-800">{filtered.length ? `${rangeStart} to ${rangeEnd} of ${filtered.length}` : '0 entries'}</span>
                                {(activity.data?.total || 0) > items.length ? ` · latest ${items.length} of ${activity.data?.total}` : ''}
                            </span>
                            <div className="flex items-center gap-2">
                                <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:text-slate-400">Previous</button>
                                <span className="px-2 font-semibold text-slate-700">{currentPage}</span>
                                <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:text-slate-400">Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-5">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{selected.description || selected.action.replaceAll('_', ' ')}</h3>
                                <p className="mt-1 text-xs text-slate-500">{selected.module.charAt(0) + selected.module.slice(1).toLowerCase()} · {formatWhen(selected.createdAt)}</p>
                            </div>
                            <button type="button" aria-label="Close" onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-xs">
                                <Detail label="When" value={formatWhen(selected.createdAt)} />
                                <Detail label="Who" value={actorSummary(selected)} />
                                <Detail label="Where from" value={selected.ip_address || 'Not recorded'} />
                                <Detail label="How serious" value={severityLabel(selectedLevel)} />
                            </div>
                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">What happened</p>
                                <p className="rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{selected.description || 'No extra note was saved for this action.'}</p>
                            </div>
                            {!!profileChanges?.length && (
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">What changed</p>
                                    <div className="space-y-2">
                                        {profileChanges.map((change) => (
                                            <div key={change.field} className="rounded-xl border border-slate-200/70 bg-white px-4 py-3">
                                                <p className="text-sm font-semibold text-slate-800">{fieldTitle(change.field)}</p>
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {(change.added || []).map((item) => (
                                                        <span key={`add-${item}`} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Added {item}</span>
                                                    ))}
                                                    {(change.removed || []).map((item) => (
                                                        <span key={`remove-${item}`} className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Removed {item}</span>
                                                    ))}
                                                    {!change.added?.length && !change.removed?.length && (
                                                        <span className="text-sm text-slate-600">
                                                            {change.before && change.after ? `${change.before} → ${change.after}` : change.after || change.before || 'Updated'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {!!selectedChanges.length && (
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">What changed</p>
                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70">
                                        {selectedChanges.map((row) => (
                                            <div key={row.label} className="grid gap-2 bg-white px-4 py-3 text-sm sm:grid-cols-[140px_1fr]">
                                                <p className="font-semibold text-slate-800">{row.label}</p>
                                                <p className="text-slate-600">
                                                    {row.before && row.after ? (
                                                        <>
                                                            <span className="text-slate-400">{row.before}</span>
                                                            <span className="mx-2 text-slate-300">→</span>
                                                            <span className="font-medium text-slate-800">{row.after}</span>
                                                        </>
                                                    ) : (
                                                        <span className="font-medium text-slate-800">{row.after || row.before}</span>
                                                    )}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selected.user_agent && (
                                <p className="text-xs leading-relaxed text-slate-400">Signed in from {deviceSummary(selected.user_agent)}.</p>
                            )}
                        </div>
                        <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4">
                            <button type="button" onClick={() => setSelected(null)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">Close details</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div key={toast.id} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">
                        <ActivityIcon className="h-4 w-4 text-orange-400" />
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Metric({
    icon: Icon,
    iconClass = 'text-slate-400',
    label,
    value,
    note,
}: {
    icon: typeof List;
    iconClass?: string;
    label: string;
    value: number;
    note: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                <Icon className={`h-4 w-4 ${iconClass}`} />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">{value}</span>
                <span className="text-[11px] font-semibold text-slate-400">{note}</span>
            </div>
        </div>
    );
}

function FilterSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    options: [string, string][];
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
                {options.map(([optionValue, label]) => <option key={label} value={optionValue}>{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
    );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <span className="block font-medium text-slate-400">{label}</span>
            <span className={`font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
        </div>
    );
}
