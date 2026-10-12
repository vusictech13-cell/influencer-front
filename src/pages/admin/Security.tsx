import { useState } from 'react';
import { Pagination } from 'antd';
import { getApiErrorMessage } from '@/api/axios';
import { adminCan, useAdminMe } from '@/hooks/useAdminAccess';
import { useOwnLoginHistory, useOwnSessions, useSessionMutations } from '@/hooks/useAdminAudit';
import { forceSessionEnd, readSessionId } from '@/utils/auth';
import { LoadingRow, Notice, PageHeader, Panel, StatusPill, formatWhen, primaryButtonClass } from './adminUi';

export default function AdminSecurity() {
    const me = useAdminMe();
    const canRevoke = adminCan(me.data, 'SESSION_REVOKE_OWN');
    const canRevokeOthers = adminCan(me.data, 'SESSION_REVOKE_ALL_OWN');
    const [tab, setTab] = useState<'sessions' | 'history'>('sessions');
    const [page, setPage] = useState(1);
    const sessions = useOwnSessions();
    const history = useOwnLoginHistory(page);
    const mutations = useSessionMutations();
    const [error, setError] = useState<string | null>(null);

    const revoke = async (sessionId: string, current: boolean) => {
        setError(null);
        try {
            await mutations.revoke.mutateAsync(sessionId);
            if (current || sessionId === readSessionId()) forceSessionEnd('session_revoked');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not revoke this session.'));
        }
    };

    const revokeOthers = async () => {
        setError(null);
        try {
            await mutations.revokeOthers.mutateAsync();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not revoke other sessions.'));
        }
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Security"
                description="Devices signed in to this admin account, and the login history for this account."
                action={tab === 'sessions' && canRevokeOthers ? (
                    <button type="button" className={primaryButtonClass} onClick={revokeOthers} disabled={mutations.revokeOthers.isPending}>
                        {mutations.revokeOthers.isPending ? 'Signing out...' : 'Sign out other devices'}
                    </button>
                ) : undefined}
            />
            <div className="flex gap-2">
                {(['sessions', 'history'] as const).map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`h-10 rounded-full px-4 text-sm font-bold ${tab === key ? 'bg-brand-navy text-white' : 'bg-white text-brand-ink'}`}
                    >
                        {key === 'sessions' ? 'Sessions' : 'Login history'}
                    </button>
                ))}
            </div>
            {error && <Notice>{error}</Notice>}
            {tab === 'sessions' ? (
                <div className="grid gap-3">
                    {sessions.isLoading ? <Panel><LoadingRow /></Panel> : sessions.isError ? (
                        <Notice>{getApiErrorMessage(sessions.error, 'Could not load sessions.')}</Notice>
                    ) : (sessions.data || []).map((session) => (
                        <Panel key={session.sessionId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <div>
                                <p className="font-semibold text-brand-ink">
                                    {session.deviceName || session.browser || 'Unknown device'}
                                    {session.isCurrent ? ' · This device' : ''}
                                </p>
                                <p className="mt-1 text-xs text-brand-gray">
                                    {[session.os, session.browser, session.location, session.ipAddress].filter(Boolean).join(' · ') || 'No device details'}
                                </p>
                                <p className="mt-1 text-xs text-brand-gray">Last active {formatWhen(session.lastActiveAt)}</p>
                            </div>
                            {canRevoke && !session.isCurrent && (
                                <button type="button" className="text-xs font-bold text-red-500" onClick={() => revoke(session.sessionId, session.isCurrent)}>
                                    Revoke
                                </button>
                            )}
                        </Panel>
                    ))}
                    {!sessions.isLoading && !sessions.data?.length && <Notice tone="muted">No active sessions.</Notice>}
                </div>
            ) : (
                <Panel>
                    {history.isLoading ? <LoadingRow /> : history.isError ? (
                        <div className="p-5"><Notice>{getApiErrorMessage(history.error, 'Could not load login history.')}</Notice></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-brand-gray">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">When</th>
                                        <th className="px-4 py-3 font-bold">Event</th>
                                        <th className="px-4 py-3 font-bold">Status</th>
                                        <th className="px-4 py-3 font-bold">Device</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(history.data?.items || []).map((item) => (
                                        <tr key={item.id} className="border-b border-gray-50">
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-gray">{formatWhen(item.createdAt)}</td>
                                            <td className="px-4 py-3 text-xs font-semibold">{item.event.replaceAll('_', ' ')}</td>
                                            <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                                            <td className="px-4 py-3 text-xs text-brand-gray">
                                                {[item.device_name, item.browser, item.city, item.ip_address].filter(Boolean).join(' · ') || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {!history.data?.items.length && (
                                        <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-brand-gray">No login history yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            )}
            {tab === 'history' && (history.data?.total || 0) > 20 && (
                <Pagination current={page} pageSize={20} total={history.data?.total} onChange={setPage} showSizeChanger={false} />
            )}
        </div>
    );
}
