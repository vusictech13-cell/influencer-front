import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox, KeyRound, Plus, ScrollText, ShieldCheck, Users } from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminActivity, useOwnSessions, type ActivityItem } from '@/hooks/useAdminAudit';
import { useAdminRoles } from '@/hooks/useAdminRoles';
import { useAdminAccounts } from '@/hooks/useAdminTeam';
import { LoadingRow, Notice, formatWhen } from './adminUi';

export default function AdminDashboard() {
    const me = useAdminMe();
    const canTeam = adminCan(me.data, 'STAFF_VIEW', 'ADMIN_VIEW');
    const canCreateStaff = adminCan(me.data, 'STAFF_CREATE', 'ADMIN_CREATE');
    const canRoles = adminCan(me.data, 'ROLE_VIEW');
    const canActivity = adminCan(me.data, 'ACTIVITY_VIEW', 'ACTIVITY_VIEW_USERS', 'ACTIVITY_VIEW_ADMINS');
    const adminActivityOnly = canActivity && adminCan(me.data, 'ACTIVITY_VIEW_ADMINS');
    const accounts = useAdminAccounts(1, '', canTeam);
    const roles = useAdminRoles(canRoles);
    const sessions = useOwnSessions();
    const activity = useAdminActivity(1, adminActivityOnly ? 'ADMIN' : '', '', 8, canActivity);

    const greetingName = me.data?.name?.trim() || 'there';
    const roleLabel = me.data?.roles.map((role) => role.name).join(', ') || 'Admin';
    const activeRoles = (roles.data || []).filter((role) => role.status === 'active').length;
    const sessionCount = sessions.data?.length || 0;
    const items = activity.data?.items || [];

    return (
        <div className="space-y-6 font-jakarta text-slate-900">
            <div className="space-y-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Hello, {greetingName}</h1>
                <p className="max-w-3xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                    This console is only for staff, admin, and super admin. Creators and brands continue to use the main login.
                </p>
            </div>

            {me.isError && <Notice>{getApiErrorMessage(me.error, 'Could not load your admin profile.')}</Notice>}

            {me.data && (
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
                    <div className="flex items-center gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-slate-100 text-sky-600">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-extrabold text-slate-900">{me.data.email}</span>
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">{roleLabel}</span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-slate-400">Signed in to the admin console</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wider sm:self-center ${
                        me.data.status === 'active'
                            ? 'border-emerald-200/80 bg-emerald-50 text-emerald-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                        <span className={`h-2 w-2 rounded-full ${me.data.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {me.data.status}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                {canTeam && (
                    <ActionCard
                        icon={<Users className="h-4 w-4" />}
                        iconClass="bg-sky-50 text-sky-600"
                        title="Team"
                        meta={accounts.data ? `${accounts.data.total} ${accounts.data.total === 1 ? 'member' : 'members'}` : 'Team'}
                        text="Create staff and admin accounts, and suspend access."
                        href="/admin/team"
                        linkLabel="Manage team"
                        action={canCreateStaff ? (
                            <Link to="/admin/team" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white no-underline shadow-sm transition hover:bg-slate-800">
                                <span className="inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add staff</span>
                            </Link>
                        ) : undefined}
                    />
                )}
                {canRoles && (
                    <ActionCard
                        icon={<KeyRound className="h-4 w-4" />}
                        iconClass="bg-purple-50 text-purple-600"
                        title="Roles"
                        meta={roles.data ? `${activeRoles} active ${activeRoles === 1 ? 'role' : 'roles'}` : 'Roles'}
                        text="Review who can do what across the admin console."
                        href="/admin/roles"
                        linkLabel="View roles"
                    />
                )}
                {canActivity && (
                    <ActionCard
                        icon={<ScrollText className="h-4 w-4" />}
                        iconClass="bg-emerald-50 text-emerald-600"
                        title="Activity"
                        meta={activity.data ? `${activity.data.total} recorded` : 'Activity'}
                        text="See admin and user actions as they are recorded."
                        href="/admin/activity"
                        linkLabel="View activity"
                    />
                )}
                <ActionCard
                    icon={<ShieldCheck className="h-4 w-4" />}
                    iconClass="bg-amber-50 text-amber-600"
                    title="Security"
                    meta={sessions.data ? `${sessionCount} signed in` : 'Security'}
                    text="Check devices signed in to this account."
                    href="/admin/security"
                    linkLabel={sessions.data ? `Active sessions (${sessionCount})` : 'Active sessions'}
                />
            </div>

            <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-extrabold text-slate-900">{adminActivityOnly ? 'Recent admin activity' : 'Recent activity'}</h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {adminActivityOnly ? 'Actions recorded by admin accounts.' : 'Actions this account is allowed to see.'}
                    </p>
                </div>

                {!canActivity ? (
                    <p className="py-8 text-center text-sm font-medium text-slate-500">Activity is not available for this account.</p>
                ) : activity.isLoading ? (
                    <LoadingRow />
                ) : activity.isError ? (
                    <Notice>{getApiErrorMessage(activity.error, 'Activity is not available for this account.')}</Notice>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                            <Inbox className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">No admin activity yet.</p>
                        <p className="max-w-xs text-xs text-slate-400">New actions will show up here after someone uses the admin console.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <ActivityRow key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionCard({
    icon,
    iconClass,
    title,
    meta,
    text,
    href,
    linkLabel,
    action,
}: {
    icon: ReactNode;
    iconClass: string;
    title: string;
    meta: string;
    text: string;
    href: string;
    linkLabel: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)]">
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
                        <span className={`grid h-8 w-8 place-items-center rounded-lg text-sm ${iconClass}`}>{icon}</span>
                        {title}
                    </h3>
                    <span className="text-xs font-bold text-slate-400">{meta}</span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">{text}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <Link to={href} className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 no-underline hover:text-sky-700">
                    {linkLabel} <ArrowRight className="h-3 w-3" />
                </Link>
                {action}
            </div>
        </div>
    );
}

function ActivityRow({ item }: { item: ActivityItem }) {
    const tone = activityTone(item);
    const who = item.actor?.name || (item.actor_type === 'ADMIN' ? 'Admin' : 'User');
    const role = item.actor?.type && item.actor.type !== who ? item.actor.type : null;
    const detail = [who, role, item.module].filter(Boolean).join(' · ');

    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 text-xs transition hover:bg-slate-100/80">
            <div className="flex min-w-0 items-center gap-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}>
                    <ScrollText className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{item.description || item.action.replaceAll('_', ' ')}</p>
                    <p className="truncate text-[11px] text-slate-400">{detail}</p>
                </div>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-slate-400">{timeAgo(item.createdAt)}</span>
        </div>
    );
}

function activityTone(item: ActivityItem) {
    const key = `${item.module} ${item.action}`.toUpperCase();
    if (key.includes('ROLE') || key.includes('PERMISSION')) return 'bg-purple-100 text-purple-600';
    if (key.includes('PAYMENT') || key.includes('WALLET') || key.includes('PAYOUT') || key.includes('REPORT')) return 'bg-emerald-100 text-emerald-600';
    if (key.includes('SESSION') || key.includes('AUTH')) return 'bg-sky-100 text-sky-600';
    return 'bg-slate-100 text-slate-500';
}

function timeAgo(value: string) {
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return formatWhen(value);
    const minutes = Math.round((Date.now() - then) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    return formatWhen(value);
}
