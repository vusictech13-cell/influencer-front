import { io, type Socket } from 'socket.io-client';

/**
 * Socket must hit the API host (not the SPA host).
 * Prefer VITE_SOCKET_URL in production; otherwise derive from VITE_API_BASE_URL.
 */
const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ||
    'http://localhost:5000';

let socket: Socket | null = null;

function readAccessToken(): string | null {
    return localStorage.getItem('accessToken');
}

function syncAuth(target: Socket) {
    const token = readAccessToken();
    target.auth = token ? { token } : {};
}

/**
 * Returns a connected (or connecting) support socket.
 * Always refreshes JWT from localStorage so token refresh via REST keeps sockets working.
 */
export function getSupportSocket() {
    const token = readAccessToken();
    if (!token) return null;

    if (socket) {
        syncAuth(socket);
        if (!socket.connected && !socket.active) {
            socket.connect();
        }
        return socket;
    }

    socket = io(SOCKET_URL, {
        autoConnect: true,
        // Polling first is more reliable behind nginx/CDN; then upgrade to websocket.
        transports: ['polling', 'websocket'],
        upgrade: true,
        withCredentials: true,
        auth: { token },
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        timeout: 20000,
    });

    // Keep auth fresh on every reconnect attempt (token may have been refreshed by axios).
    socket.on('reconnect_attempt', () => {
        if (socket) syncAuth(socket);
    });

    socket.on('connect_error', (err) => {
        if (import.meta.env.DEV) {
            console.warn('[support-socket] connect_error', err.message, { url: SOCKET_URL });
        }
    });

    return socket;
}

/** Join a ticket room once connected; re-join automatically after reconnects. */
export function joinSupportTicket(ticketId: number, onJoined?: () => void) {
    const s = getSupportSocket();
    if (!s || !ticketId) return () => {};

    const doJoin = () => {
        syncAuth(s);
        s.emit('support:join', { ticketId }, () => {
            onJoined?.();
        });
    };

    if (s.connected) {
        doJoin();
    } else {
        s.once('connect', doJoin);
        if (!s.active) s.connect();
    }

    const onReconnect = () => doJoin();
    s.on('reconnect', onReconnect);

    return () => {
        s.off('connect', doJoin);
        s.off('reconnect', onReconnect);
        if (s.connected) {
            s.emit('support:leave', { ticketId });
        }
    };
}

export function disconnectSupportSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function getSupportSocketUrl() {
    return SOCKET_URL;
}
