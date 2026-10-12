import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useAdminActivity } from '@/hooks/useAdminAudit';
import { LoadingRow, Notice, PageHeader, Panel, StatusPill, formatWhen } from './adminUi';

const LINKS = [
    { to: '/admin/team', title: 'Team', text: 'Create staff and admin accounts, and suspend access.' },
    { to: '/admin/roles', title: 'Roles', text: 'Review who can do what across the admin console.' },
    { to: '/admin/activity', title: 'Activity', text: 'See admin and user actions as they are recorded.' },
    { to: '/admin/security', title: 'Security', text: 'Check devices signed in to this account.' },
];

export default function AdminDashboard() {
    const me = useAdminMe();
    const canActivity = adminCan(me.data, 'ACTIVITY_VIEW', 'ACTIVITY_VIEW_USERS', 'ACTIVITY_VIEW_ADMINS');
    const activity = useAdminActivity(1, canActivity && adminCan(me.data, 'ACTIVITY_VIEW_ADMINS') ? 'ADMIN' : '', '', 20, canActivity);
    const links = LINKS.filter((link) => {
        if (!me.data) return false;
        if (link.to === '/admin/team') return adminCan(me.data, 'STAFF_VIEW', 'ADMIN_VIEW');
        if (link.to === '/admin/roles') return adminCan(me.data, 'ROLE_VIEW');
        if (link.to === '/admin/activity') return canActivity;
        return true;
    });

    return (
        <div className="space-y-5">
            <PageHeader
                title={me.data ? `Hello, ${me.data.name}` : 'Admin'}
                description="This console is only for staff, admin, and super admin. Creators and brands continue to use the main login."
            />
            {me.isError && <Notice>{getApiErrorMessage(me.error, 'Could not load your admin profile.')}</Notice>}
            {me.data && (
                <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                        <p className="text-sm font-semibold text-brand-ink">{me.data.email}</p>
                        <p className="mt-1 text-xs text-brand-gray">
                            {me.data.roles.map((role) => role.name).join(', ') || 'No role'}
                        </p>
                    </div>
                    <StatusPill status={me.data.status} />
                </Panel>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
                {links.map((link) => (
                    <Link key={link.to} to={link.to} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm no-underline hover:border-[#ffd7c2]">
                        <p className="font-bold text-brand-ink">{link.title}</p>
                        <p className="mt-1 text-sm text-brand-gray">{link.text}</p>
                    </Link>
                ))}
            </div>
            <Panel>
                <div className="border-b border-gray-100 px-5 py-4">
                    <h3 className="font-bold text-brand-ink">Recent admin activity</h3>
                </div>
                {!canActivity ? <div className="px-5 py-8 text-sm text-brand-gray">Activity is not available for this account.</div> : activity.isLoading ? <LoadingRow /> : activity.isError ? (
                    <div className="p-5"><Notice>{getApiErrorMessage(activity.error, 'Activity is not available for this account.')}</Notice></div>
                ) : (
                    <ul>
                        {(activity.data?.items || []).slice(0, 8).map((item) => (
                            <li key={item.id} className="flex items-start justify-between gap-3 border-b border-gray-50 px-5 py-3 last:border-0">
                                <div>
                                    <p className="text-sm font-semibold text-brand-ink">{item.description || item.action.replaceAll('_', ' ')}</p>
                                    <p className="text-[11px] text-brand-gray">{item.module} · {item.actor?.name || (item.actor_type === 'ADMIN' ? 'Admin' : 'User')}{item.actor?.type ? ` · ${item.actor.type}` : ''}</p>
                                </div>
                                <p className="whitespace-nowrap text-[11px] text-brand-gray">{formatWhen(item.createdAt)}</p>
                            </li>
                        ))}
                        {!activity.data?.items.length && <li className="px-5 py-8 text-sm text-brand-gray">No admin activity yet.</li>}
                    </ul>
                )}
            </Panel>
        </div>
    );
}
