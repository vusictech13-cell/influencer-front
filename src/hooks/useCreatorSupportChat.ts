import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { connectSupportSocket, disconnectSupportSocket, getSupportSocket } from '@/lib/supportSocket';
import type { SupportMessage, SupportThread } from '@/types/support';

const CREATOR_MESSAGES_KEY = ['support', 'creator', 'messages'] as const;
const CREATOR_THREAD_KEY = ['support', 'creator', 'thread'] as const;

function mergeMessages(existing: SupportMessage[], incoming: SupportMessage) {
    if (existing.some((m) => m.id === incoming.id)) return existing;
    return [...existing, incoming].sort((a, b) => a.id - b.id);
}

export function useCreatorSupportChat() {
    const queryClient = useQueryClient();
    const [connected, setConnected] = useState(false);
    const [peerTyping, setPeerTyping] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingIdle = useRef<ReturnType<typeof setTimeout> | null>(null);

    const messagesQuery = useQuery({
        queryKey: CREATOR_MESSAGES_KEY,
        queryFn: async () => {
            const res = await api.get('/support/messages');
            return res.data.data as { thread: SupportThread; messages: SupportMessage[] };
        },
    });

    const thread = messagesQuery.data?.thread;
    const messages = messagesQuery.data?.messages ?? [];

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const socket = connectSupportSocket(token);

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        const onMessage = (message: SupportMessage) => {
            queryClient.setQueryData(CREATOR_MESSAGES_KEY, (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: mergeMessages(prev.messages, message),
                };
            });
            if (message.sender_role === 'admin') {
                socket.emit('support:read', { threadId: message.thread_id });
            }
        };
        const onThreadUpdated = (updated: SupportThread) => {
            queryClient.setQueryData(CREATOR_MESSAGES_KEY, (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
                if (!prev) return prev;
                return { ...prev, thread: { ...prev.thread, ...updated } };
            });
            queryClient.setQueryData(CREATOR_THREAD_KEY, updated);
        };
        const onTyping = (payload: { role?: string; isTyping?: boolean }) => {
            if (payload.role !== 'admin') return;
            setPeerTyping(Boolean(payload.isTyping));
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            if (payload.isTyping) {
                typingTimeout.current = setTimeout(() => setPeerTyping(false), 2500);
            }
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('support:message', onMessage);
        socket.on('support:thread_updated', onThreadUpdated);
        socket.on('support:typing', onTyping);

        if (socket.connected) setConnected(true);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('support:message', onMessage);
            socket.off('support:thread_updated', onThreadUpdated);
            socket.off('support:typing', onTyping);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            if (typingIdle.current) clearTimeout(typingIdle.current);
            disconnectSupportSocket();
        };
    }, [queryClient]);

    useEffect(() => {
        if (!thread?.id || !connected) return;
        const socket = getSupportSocket();
        socket?.emit('support:join', { threadId: thread.id });
        socket?.emit('support:read', { threadId: thread.id });
    }, [thread?.id, connected]);

    const sendMessage = useCallback(async (body: string) => {
        setSendError(null);
        const socket = getSupportSocket();
        if (!socket?.connected) {
            setSendError('Not connected. Trying again…');
            const token = localStorage.getItem('accessToken');
            if (token) connectSupportSocket(token);
            throw new Error('Socket not connected');
        }

        return new Promise<{ message: SupportMessage; thread: SupportThread }>((resolve, reject) => {
            socket.emit(
                'support:send',
                { threadId: thread?.id, body },
                (ack?: { ok?: boolean; message?: string; data?: { message: SupportMessage; thread: SupportThread } }) => {
                    if (!ack?.ok || !ack.data) {
                        const err = ack?.message || 'Failed to send message';
                        setSendError(err);
                        reject(new Error(err));
                        return;
                    }
                    queryClient.setQueryData(CREATOR_MESSAGES_KEY, (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
                        if (!prev) {
                            return { thread: ack.data!.thread, messages: [ack.data!.message] };
                        }
                        return {
                            thread: ack.data!.thread,
                            messages: mergeMessages(prev.messages, ack.data!.message),
                        };
                    });
                    resolve(ack.data);
                },
            );
        });
    }, [queryClient, thread?.id]);

    const notifyTyping = useCallback((isTyping: boolean) => {
        const socket = getSupportSocket();
        if (!socket?.connected || !thread?.id) return;
        socket.emit('support:typing', { threadId: thread.id, isTyping });
        if (typingIdle.current) clearTimeout(typingIdle.current);
        if (isTyping) {
            typingIdle.current = setTimeout(() => {
                socket.emit('support:typing', { threadId: thread.id, isTyping: false });
            }, 1500);
        }
    }, [thread?.id]);

    const markRead = useMutation({
        mutationFn: async () => {
            const res = await api.post('/support/read');
            return res.data.data as SupportThread;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(CREATOR_MESSAGES_KEY, (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
                if (!prev) return prev;
                return { ...prev, thread: updated };
            });
        },
    });

    return {
        thread,
        messages,
        isLoading: messagesQuery.isLoading,
        isError: messagesQuery.isError,
        connected,
        peerTyping,
        sendError,
        sendMessage,
        notifyTyping,
        markRead,
        refetch: messagesQuery.refetch,
    };
}
