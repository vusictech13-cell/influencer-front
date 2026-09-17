export type SupportThreadStatus = 'open' | 'waiting_on_admin' | 'waiting_on_creator' | 'closed';

export type SupportSenderRole = 'creator' | 'admin';

export type SupportUserPreview = {
    id: number;
    name: string;
    email?: string;
    profile_image?: string | null;
    role?: string;
};

export type SupportThread = {
    id: number;
    creator_id: number;
    assigned_admin_id: number | null;
    status: SupportThreadStatus;
    last_message_at: string | null;
    last_message_preview: string | null;
    creator_unread_count: number;
    admin_unread_count: number;
    created_at?: string;
    updated_at?: string;
    creator?: SupportUserPreview;
};

export type SupportMessage = {
    id: number;
    thread_id: number;
    sender_id: number;
    sender_role: SupportSenderRole;
    body: string;
    read_at: string | null;
    created_at: string;
    sender?: SupportUserPreview;
};
