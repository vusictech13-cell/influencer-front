import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { connectSupportSocket, disconnectSupportSocket, getSupportSocket } from '@/lib/supportSocket';
import type { SupportMessage, SupportThread, SupportThreadStatus } from '@/types/support';

const ADMIN_THREADS_KEY = ['support', 'admin', 'threads'] as const;

function messagesKey(threadId: number) {
    return ['support', 'admin', 'messages', threadId] as const;
}

function mergeMessages(existing: SupportMessage[], incoming: SupportMessage) {
    if (existing.some((m) => m.id === incoming.id)) return existing;
    return [...existing, incoming].sort((a, b) => a.id - b.id);
}

function upsertThread(list: SupportThread[], updated: SupportThread) {
    const without = list.filter((t) => t.id !== updated.id);
    return [updated, ...without].sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
    });
}

export function useAdminSupportInbox(filters?: { status?: string; search?: string }) {
    const queryClient = useQueryClient();
    const [connected, setConnected] = useState(false);

    const threadsQuery = useQuery({
        queryKey: [...ADMIN_THREADS_KEY, filters?.status ?? 'all', filters?.search ?? ''],
        queryFn: async () => {
            const res = await api.get('/support/admin/threads', {
                params: {
                    status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
                    search: filters?.search || undefined,
                },
            });
            return res.data.data as { threads: SupportThread[]; total: number };
        },
    });

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const socket = connectSupportSocket(token);
        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        const onThreadUpdated = (updated: SupportThread) => {
            queryClient.setQueriesData(
                { queryKey: ADMIN_THREADS_KEY },
                (prev: { threads: SupportThread[]; total: number } | undefined) => {
                    if (!prev) return prev;
                    const exists = prev.threads.some((t) => t.id === updated.id);
                    return {
                        threads: upsertThread(prev.threads, updated),
                        total: exists ? prev.total : prev.total + 1,
                    };
                },
            );
            queryClient.setQueryData(messagesKey(updated.id), (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
                if (!prev) return prev;
                return { ...prev, thread: { ...prev.thread, ...updated } };
            });
        };
        const onMessage = (message: SupportMessage) => {
            queryClient.setQueryData(messagesKey(message.thread_id), (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    messages: mergeMessages(prev.messages, message),
                };
            });
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('support:thread_updated', onThreadUpdated);
        socket.on('support:message', onMessage);
        if (socket.connected) setConnected(true);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('support:thread_updated', onThreadUpdated);
            socket.off('support:message', onMessage);
            disconnectSupportSocket();
        };
    }, [queryClient]);

    return {
        threads: threadsQuery.data?.threads ?? [],
        total: threadsQuery.data?.total ?? 0,
        isLoading: threadsQuery.isLoading,
        connected,
        refetch: threadsQuery.refetch,
    };
}

export function useAdminSupportThread(threadId: number | null, connected = false) {
    const queryClient = useQueryClient();
    const [peerTyping, setPeerTyping] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingIdle = useRef<ReturnType<typeof setTimeout> | null>(null);

    const messagesQuery = useQuery({
        queryKey: threadId ? messagesKey(threadId) : ['support', 'admin', 'messages', 'none'],
        enabled: Boolean(threadId),
        queryFn: async () => {
            const res = await api.get(`/support/admin/threads/${threadId}/messages`);
            return res.data.data as { thread: SupportThread; messages: SupportMessage[] };
        },
    });

    useEffect(() => {
        if (!threadId || !connected) return;
        const socket = getSupportSocket();
        if (!socket) return;

        socket.emit('support:join', { threadId });
        socket.emit('support:read', { threadId });

        const onTyping = (payload: { threadId?: number; role?: string; isTyping?: boolean }) => {
            if (payload.threadId !== threadId || payload.role !== 'creator') return;
            setPeerTyping(Boolean(payload.isTyping));
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            if (payload.isTyping) {
                typingTimeout.current = setTimeout(() => setPeerTyping(false), 2500);
            }
        };

        socket.on('support:typing', onTyping);
        return () => {
            socket.off('support:typing', onTyping);
            socket.emit('support:leave', { threadId });
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            if (typingIdle.current) clearTimeout(typingIdle.current);
        };
    }, [threadId, connected]);

    useEffect(() => {
        if (!threadId) return;
        api.post(`/support/admin/threads/${threadId}/read`).then((res) => {
            const updated = res.data.data as SupportThread;
            queryClient.setQueryData(messagesKey(threadId), (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
                if (!prev) return prev;
                return { ...prev, thread: updated };
            });
            queryClient.setQueriesData(
                { queryKey: ADMIN_THREADS_KEY },
                (prev: { threads: SupportThread[]; total: number } | undefined) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        threads: prev.threads.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
                    };
                },
            );
        }).catch(() => undefined);
    }, [threadId, queryClient]);

    const sendMessage = useCallback(async (body: string) => {
        if (!threadId) throw new Error('No thread selected');
        setSendError(null);
        const socket = getSupportSocket();
        if (!socket?.connected) {
            setSendError('Not connected');
            throw new Error('Socket not connected');
        }

        return new Promise<{ message: SupportMessage; thread: SupportThread }>((resolve, reject) => {
            socket.emit(
                'support:send',
                { threadId, body },
                (ack?: { ok?: boolean; message?: string; data?: { message: SupportMessage; thread: SupportThread } }) => {
                    if (!ack?.ok || !ack.data) {
                        const err = ack?.message || 'Failed to send message';
                        setSendError(err);
                        reject(new Error(err));
                        return;
                    }
                    queryClient.setQueryData(messagesKey(threadId), (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
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
    }, [queryClient, threadId]);

    const notifyTyping = useCallback((isTyping: boolean) => {
        const socket = getSupportSocket();
        if (!socket?.connected || !threadId) return;
        socket.emit('support:typing', { threadId, isTyping });
        if (typingIdle.current) clearTimeout(typingIdle.current);
        if (isTyping) {
            typingIdle.current = setTimeout(() => {
                socket.emit('support:typing', { threadId, isTyping: false });
            }, 1500);
        }
    }, [threadId]);

    const updateStatus = useMutation({
        mutationFn: async (status: SupportThreadStatus) => {
            const res = await api.patch(`/support/admin/threads/${threadId}`, { status });
            return res.data.data as SupportThread;
        },
        onSuccess: (updated) => {
            if (!threadId) return;
            queryClient.setQueryData(messagesKey(threadId), (prev: { thread: SupportThread; messages: SupportMessage[] } | undefined) => {
                if (!prev) return prev;
                return { ...prev, thread: updated };
            });
            queryClient.invalidateQueries({ queryKey: ADMIN_THREADS_KEY });
        },
    });

    return {
        thread: messagesQuery.data?.thread,
        messages: messagesQuery.data?.messages ?? [],
        isLoading: messagesQuery.isLoading,
        peerTyping,
        sendError,
        sendMessage,
        notifyTyping,
        updateStatus,
    };
}
