import { Headset } from 'lucide-react';
import { SupportChatPanel } from '@/components/support/SupportChatPanel';
import { useCreatorSupportChat } from '@/hooks/useCreatorSupportChat';
import { getStoredUser } from '@/utils/auth';

export default function CreatorSupport() {
    const user = getStoredUser();
    const {
        messages,
        isLoading,
        connected,
        peerTyping,
        sendError,
        sendMessage,
        notifyTyping,
    } = useCreatorSupportChat();

    return (
        <div className="mx-auto flex h-[calc(100dvh-72px-2rem)] max-w-[920px] flex-col md:h-[calc(100dvh-72px-3.5rem)]">
            <div className="mb-4 flex items-start gap-3">
                <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-brand-orange text-white shadow-[0_8px_18px_rgba(255,106,26,0.22)]">
                    <Headset className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="mb-1 text-[28px] font-extrabold leading-[1.05] tracking-[-1.1px]">Creator Support</h1>
                    <p className="m-0 text-[13px] text-[#777a83]">
                        Chat live with Melotap support. We usually reply within a few hours.
                    </p>
                </div>
            </div>

            <div className="min-h-0 flex-1">
                <SupportChatPanel
                    title="Melotap Support"
                    subtitle={connected ? 'Connected · live chat' : 'Connecting…'}
                    messages={messages}
                    currentUserId={user?.id != null ? Number(user.id) : undefined}
                    ownRole="creator"
                    isLoading={isLoading}
                    connected={connected}
                    peerTyping={peerTyping}
                    sendError={sendError}
                    emptyHint="Ask about campaigns, payouts, Instagram, or anything else."
                    onSend={sendMessage}
                    onTyping={notifyTyping}
                />
            </div>
        </div>
    );
}
