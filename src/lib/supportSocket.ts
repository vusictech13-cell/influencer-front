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

type TicketJoin = {
    count: number;
    leaveTimer: ReturnType<typeof setTimeout> | null;
};

const ticketJoins = new Map<number, TicketJoin>();

function readAccessToken(): string | null {
    return localStorage.getItem('accessToken');
}

function syncAuth(target: Socket) {
    const token = readAccessToken();
    target.auth = token ? { token } : {};
}

export function sameTicketId(a: unknown, b: unknown) {
    const left = Number(a);
    const right = Number(b);
    return Number.isFinite(left) && left === right;
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
        transports: ['websocket', 'polling'],
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

    socket.on('reconnect_attempt', () => {
        if (socket) syncAuth(socket);
    });

    socket.on('connect_error', (err) => {
        if (import.meta.env.DEV) {
            console.warn('[support-socket] connect_error', err.message, { url: SOCKET_URL });
        }
    });

    if (import.meta.env.DEV) {
        socket.on('connect', () => {
            console.info('[support-socket] connected', socket?.id, { url: SOCKET_URL, transport: socket?.io.engine.transport.name });
        });
    }

    return socket;
}

/** Join a ticket room once connected; re-join automatically after reconnects. */
export function joinSupportTicket(ticketId: number, onJoined?: () => void) {
    const s = getSupportSocket();
    const id = Number(ticketId);
    if (!s || !Number.isFinite(id)) return () => {};

    let entry = ticketJoins.get(id);
    if (!entry) {
        entry = { count: 0, leaveTimer: null };
        ticketJoins.set(id, entry);
    }
    entry.count += 1;
    if (entry.leaveTimer) {
        clearTimeout(entry.leaveTimer);
        entry.leaveTimer = null;
    }

    const doJoin = () => {
        syncAuth(s);
        s.emit('support:join', { ticketId: id }, (ack?: { success?: boolean; message?: string }) => {
            if (ack && ack.success === false) {
                if (import.meta.env.DEV) {
                    console.warn('[support-socket] join failed', id, ack.message);
                }
                return;
            }
            onJoined?.();
        });
    };

    s.on('connect', doJoin);
    if (s.connected) {
        doJoin();
    } else if (!s.active) {
        s.connect();
    }

    return () => {
        s.off('connect', doJoin);
        const current = ticketJoins.get(id);
        if (!current) return;
        current.count -= 1;
        if (current.count > 0) return;

        // Delay leave so React Strict Mode remount can re-join the same ticket first.
        current.leaveTimer = setTimeout(() => {
            const latest = ticketJoins.get(id);
            if (!latest || latest.count > 0) return;
            ticketJoins.delete(id);
            if (s.connected) {
                s.emit('support:leave', { ticketId: id });
            }
        }, 150);
    };
}

export function disconnectSupportSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    for (const entry of ticketJoins.values()) {
        if (entry.leaveTimer) clearTimeout(entry.leaveTimer);
    }
    ticketJoins.clear();
}

export function getSupportSocketUrl() {
    return SOCKET_URL;
}
