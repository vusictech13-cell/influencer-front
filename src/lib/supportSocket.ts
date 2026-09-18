import { io, type Socket } from 'socket.io-client';

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ||
    'http://localhost:5000';

let socket: Socket | null = null;

export function getSupportSocket() {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    if (socket?.connected) return socket;

    if (socket) {
        socket.auth = { token };
        socket.connect();
        return socket;
    }

    socket = io(SOCKET_URL, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        auth: { token },
        path: '/socket.io',
    });

    return socket;
}

export function disconnectSupportSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
