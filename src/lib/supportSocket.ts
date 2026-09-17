import { io, type Socket } from 'socket.io-client';

function getSocketBaseUrl() {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return apiBase.replace(/\/api\/?$/, '');
}

let socket: Socket | null = null;

export function getSupportSocket() {
    return socket;
}

export function connectSupportSocket(token: string) {
    if (socket?.connected) {
        return socket;
    }

    if (socket) {
        socket.auth = { token };
        socket.connect();
        return socket;
    }

    socket = io(getSocketBaseUrl(), {
        path: '/socket.io',
        autoConnect: true,
        transports: ['websocket', 'polling'],
        auth: { token },
    });

    return socket;
}

export function disconnectSupportSocket() {
    if (!socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
}
