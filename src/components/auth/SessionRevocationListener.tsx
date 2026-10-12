import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { getSupportSocket } from '@/lib/supportSocket';
import { AUTH_CHANGED_EVENT, forceSessionEnd, getRefreshPath, isReturningToAdmin, readSessionId } from '@/utils/auth';

type RevokedPayload = {
    sessionId?: string;
    reason?: string;
};

/**
 * Listens for real-time session revocation on the shared Socket.IO connection.
 * Database checks still reject refresh tokens when the device was offline.
 */
export default function SessionRevocationListener() {
    useEffect(() => {
        let socket: Socket | null = null;
        let refreshTried = false;

        const onRevoked = (payload: RevokedPayload) => {
            if (isReturningToAdmin()) return;
            const current = readSessionId(localStorage.getItem('accessToken'));
            if (payload?.sessionId && current && payload.sessionId !== current) return;
            forceSessionEnd(payload?.reason === 'SESSION_EXPIRED' ? 'session_expired' : 'session_revoked');
        };

        const onConnectError = async (error: Error) => {
            if (isReturningToAdmin()) return;
            if (!/unauthorized/i.test(error?.message || '')) return;
            const refreshToken = localStorage.getItem('refreshToken');
            if (!socket || !refreshToken || refreshTried) {
                forceSessionEnd('session_revoked');
                return;
            }
            refreshTried = true;
            try {
                const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
                const response = await fetch(`${base}${getRefreshPath()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
                const body = await response.json().catch(() => null);
                const accessToken = body?.data?.accessToken as string | undefined;
                const nextRefresh = body?.data?.refreshToken as string | undefined;
                if (isReturningToAdmin()) return;
                if (!response.ok || !accessToken) {
                    const message = String(body?.message || '');
                    forceSessionEnd(/expired/i.test(message) ? 'session_expired' : 'session_revoked');
                    return;
                }
                localStorage.setItem('accessToken', accessToken);
                if (nextRefresh) localStorage.setItem('refreshToken', nextRefresh);
                socket.auth = { token: accessToken };
                if (!socket.connected) socket.connect();
            } catch {
                forceSessionEnd('session_revoked');
            }
        };

        const onConnect = () => {
            refreshTried = false;
        };

        const bind = () => {
            const next = getSupportSocket();
            if (socket && socket !== next) {
                socket.off('SESSION_REVOKED', onRevoked);
                socket.off('connect_error', onConnectError);
                socket.off('connect', onConnect);
            }
            socket = next;
            if (!socket) return;
            socket.off('SESSION_REVOKED', onRevoked);
            socket.off('connect_error', onConnectError);
            socket.off('connect', onConnect);
            socket.on('SESSION_REVOKED', onRevoked);
            socket.on('connect_error', onConnectError);
            socket.on('connect', onConnect);
        };

        bind();
        window.addEventListener(AUTH_CHANGED_EVENT, bind);
        return () => {
            window.removeEventListener(AUTH_CHANGED_EVENT, bind);
            socket?.off('SESSION_REVOKED', onRevoked);
            socket?.off('connect_error', onConnectError);
            socket?.off('connect', onConnect);
        };
    }, []);

    return null;
}
