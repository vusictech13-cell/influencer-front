import { getApiErrorMessage } from '@/api/axios';
import { useOwnerSessions, useRevokeOwnerSession } from '@/hooks/useAdminOps';
import { formatWhen } from './adminUi';

export default function AccountSessions({
    owner,
    ownerId,
    canRevoke,
}: {
    owner: 'user' | 'admin';
    ownerId?: number;
    canRevoke: boolean;
}) {
    const sessions = useOwnerSessions(owner, ownerId, true);
    const revoke = useRevokeOwnerSession(owner, ownerId);
    const rows = sessions.data || [];

    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">Signed-in devices</h2>
            <p className="mt-1 text-xs text-gray-500">Devices that can still use this account.</p>
            {sessions.isLoading ? (
                <p className="mt-4 text-sm text-gray-400">Loading devices…</p>
            ) : sessions.isError ? (
                <p className="mt-4 text-sm text-red-600">{getApiErrorMessage(sessions.error, 'Could not load devices.')}</p>
            ) : rows.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">No signed-in devices.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {rows.map((session) => (
                        <div key={session.sessionId} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {session.deviceName || session.browser || 'Device'}
                                    {session.isCurrent ? ' · This device' : ''}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                    {[session.os, session.location, session.ipAddress].filter(Boolean).join(' · ') || 'Unknown location'}
                                    {' · '}
                                    {formatWhen(session.lastActiveAt)}
                                </p>
                            </div>
                            {canRevoke && !session.isCurrent && (
                                <button
                                    type="button"
                                    className="rounded-full border border-[#ffd7c2] px-3 py-1 text-[11px] font-bold text-brand-orange disabled:opacity-40"
                                    disabled={revoke.isPending}
                                    onClick={() => revoke.mutate(session.sessionId)}
                                >
                                    Sign out
                                </button>
                            )}
                        </div>
                    ))}
                    {revoke.isError && (
                        <p className="text-xs text-red-600">{getApiErrorMessage(revoke.error, 'Could not sign out that device.')}</p>
                    )}
                </div>
            )}
        </section>
    );
}
