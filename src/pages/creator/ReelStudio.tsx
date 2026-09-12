import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    useCancelReelPost,
    useReelPosts,
    useRetryReelTarget,
    useSaveReelPost,
    useUploadReelMedia,
    type ReelPost,
    type ReelPostPayload,
} from '@/hooks/useReelPosts';
import {
    useConnectInstagram,
    useConnectMeta,
    useInstagramAccounts,
    useSearchInstagramAudio,
    type InstagramAudioTrack,
} from '@/hooks/useSocialAccounts';
import { accountAvatarStyle } from '@/components/creator/CreatorInstagramAccounts';
import api, { getApiErrorMessage } from '@/api/axios';
import { formatCount, type SocialAccountRecord } from '@/utils/creator';
import { formatFileSize, resolveAssetUrl } from '@/utils/image';
import {
    accountHasMeta,
    clearInstagramOAuthSearchParams,
    getInstagramOAuthErrorMessage,
    getOAuthSuccessMessage,
} from '@/utils/socialAccounts';

const HASHTAG_SUGGESTIONS = ['#creator', '#reels', '#music', '#lifestyle', '#india', '#viral'];
const DEFAULT_TIMES = ['18:30', '12:15', '20:00'];

type AccountSchedule = {
    date: string;
    time: string;
    caption: string;
};

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function istDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
    return {
        date: `${get('year')}-${get('month')}-${get('day')}`,
        time: `${get('hour')}:${get('minute')}`,
    };
}

function addIstDays(days: number) {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return istDateParts(now).date;
}

function toIstIso(date: string, time: string) {
    return `${date}T${time}:00+05:30`;
}

function isScheduleBeforeNow(date: string, time: string) {
    if (!date || !time) return true;
    const now = istDateParts();
    return toIstIso(date, time) < toIstIso(now.date, now.time);
}

function clampSchedule(date: string, time: string, caption = ''): AccountSchedule {
    if (!isScheduleBeforeNow(date, time)) return { date, time, caption };
    const now = istDateParts();
    return { date: now.date, time: now.time, caption };
}

function defaultSchedule(index: number, caption = ''): AccountSchedule {
    return clampSchedule(addIstDays(index), DEFAULT_TIMES[index % DEFAULT_TIMES.length], caption);
}

function formatIstLabel(iso?: string | null) {
    if (!iso) return '—';
    const value = new Date(iso);
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
        .format(value)
        .replace(',', ' ·');
}

function formatDuration(seconds?: number | null) {
    if (!seconds || !Number.isFinite(seconds)) return '0:00';
    const total = Math.max(0, Math.round(seconds));
    return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

function clampAudioStart(startMs: number, durationMs?: number | null) {
    const start = Math.max(0, Math.round(Number(startMs) || 0));
    if (!durationMs || durationMs <= 1000) return start;
    return Math.min(start, durationMs - 1000);
}

function AudioPlayIcon({ playing }: { playing: boolean }) {
    return playing ? (
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
            <path d="M8 5.5v13l11-6.5z" />
        </svg>
    );
}

function AudioPlayButton({
    loading,
    playing,
    onClick,
}: {
    loading?: boolean;
    playing: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            disabled={loading}
            className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-orange text-white disabled:opacity-50"
            aria-label={playing ? 'Pause' : 'Play'}
        >
            {loading ? (
                <span className="h-2.5 w-2.5 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : (
                <AudioPlayIcon playing={playing} />
            )}
        </button>
    );
}

function AudioStartSlider({
    startMs,
    durationMs,
    disabled,
    onChange,
}: {
    startMs: number;
    durationMs?: number | null;
    disabled?: boolean;
    onChange: (value: number) => void;
}) {
    if (!durationMs || durationMs <= 1000) return null;
    return (
        <div className="mt-1.5 px-0.5">
            <div className="mb-0.5 flex items-center justify-between text-[8px] text-[#8a8d95]">
                <span>Start at {formatDuration(startMs / 1000)}</span>
                <span>{formatDuration(durationMs / 1000)}</span>
            </div>
            <input
                type="range"
                min={0}
                max={Math.max(0, durationMs - 1000)}
                step={100}
                value={clampAudioStart(startMs, durationMs)}
                disabled={disabled}
                onChange={(event) => onChange(Number(event.target.value))}
                className="h-1.5 w-full accent-[#f05a0c]"
            />
        </div>
    );
}

function accountRoleLabel(account: SocialAccountRecord, index: number) {
    if (index === 0) return 'Primary creator account';
    if (String(account.account_type || '').toUpperCase() === 'BUSINESS') return 'Brand / catalogue account';
    return 'Connected account';
}

function statusClass(status: string) {
    if (status === 'scheduled' || status === 'publishing' || status === 'processing') {
        return 'bg-[#eef5ff] text-[#47658e]';
    }
    if (status === 'published') return 'bg-[#eaf9f1] text-[#15945a]';
    if (status === 'failed') return 'bg-[#fff0f0] text-[#c23b3b]';
    return 'bg-[#f4f4f6] text-[#777a83]';
}

function queueStatus(post: ReelPost) {
    const statuses = (post.targets || []).filter((item) => item.enabled).map((item) => item.status);
    if (statuses.includes('processing') || post.status === 'publishing') return 'Publishing';
    if (statuses.includes('failed') || post.status === 'failed') return 'Failed';
    if (statuses.includes('scheduled') || post.status === 'scheduled') return 'Scheduled';
    if (statuses.every((status) => status === 'published') || post.status === 'published') return 'Published';
    if (post.status === 'cancelled') return 'Cancelled';
    return 'Draft';
}

async function readVideoMeta(file: File) {
    const previewUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = previewUrl;

    await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Could not read this video file'));
    });

    const duration = video.duration;
    const width = video.videoWidth;
    const height = video.videoHeight;
    video.currentTime = Math.min(0.5, Number.isFinite(duration) ? duration * 0.08 : 0.1);

    await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        setTimeout(resolve, 900);
    });

    const canvas = document.createElement('canvas');
    canvas.width = width || 1080;
    canvas.height = height || 1920;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const thumbnail = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.82);
    });

    return { previewUrl, duration, width, height, thumbnail };
}

export default function CreatorReelStudio() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { accounts } = useInstagramAccounts();
    const studioAccounts = useMemo(() => accounts.filter(accountHasMeta), [accounts]);
    const needsMeta = accounts.length > 0 && studioAccounts.length === 0;
    const { mutate: connectInstagram, isPending: isConnecting } = useConnectInstagram('reel-studio');
    const { mutate: connectMeta, isPending: isConnectingMeta } = useConnectMeta('reel-studio');
    const { data: posts = [], isLoading: postsLoading } = useReelPosts();
    const uploadReel = useUploadReelMedia();
    const saveReel = useSaveReelPost();
    const cancelReel = useCancelReelPost();
    const retryTarget = useRetryReelTarget();
    const fileRef = useRef<HTMLInputElement>(null);
    const didInitAccounts = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioBlobUrlRef = useRef<string | null>(null);
    const playRequestRef = useRef(0);
    const audioStartsRef = useRef<Record<string, number>>({});

    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [schedules, setSchedules] = useState<Record<string, AccountSchedule>>({});
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState<string[]>(['#creator', '#reels']);
    const [customTag, setCustomTag] = useState('');
    const [sameCaption, setSameCaption] = useState(true);
    const [suggestHashtags, setSuggestHashtags] = useState(true);
    const [addFirstComment, setAddFirstComment] = useState(false);
    const [firstComment, setFirstComment] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [fileSize, setFileSize] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoFilename, setVideoFilename] = useState('');
    const [videoMime, setVideoMime] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [dragging, setDragging] = useState(false);
    const [banner, setBanner] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [selectedAudio, setSelectedAudio] = useState<InstagramAudioTrack | null>(null);
    const [audioQuery, setAudioQuery] = useState('');
    const [audioType, setAudioType] = useState<'music' | 'original_sound'>('music');
    const [audioResults, setAudioResults] = useState<InstagramAudioTrack[]>([]);
    const [audioSearchError, setAudioSearchError] = useState<string | null>(null);
    const [audioStarts, setAudioStarts] = useState<Record<string, number>>({});
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
    const [audioPlayError, setAudioPlayError] = useState<string | null>(null);
    audioStartsRef.current = audioStarts;

    const oauthError = getInstagramOAuthErrorMessage(
        searchParams.get('error'),
        searchParams.get('error_description'),
    );
    const oauthSuccess = getOAuthSuccessMessage(searchParams.get('success'));

    useEffect(() => {
        if (!oauthSuccess && !oauthError) return;
        if (oauthSuccess) setNotice(oauthSuccess);
        if (oauthError) setBanner({ type: 'error', text: oauthError });
        clearInstagramOAuthSearchParams(searchParams);
        setSearchParams(searchParams, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [oauthSuccess, oauthError]);

    useEffect(() => {
        return () => {
            if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    useEffect(() => {
        const el = new Audio();
        audioRef.current = el;
        const onEnded = () => setPreviewPlaying(false);
        const onPause = () => setPreviewPlaying(false);
        const onPlay = () => setPreviewPlaying(true);
        el.addEventListener('ended', onEnded);
        el.addEventListener('pause', onPause);
        el.addEventListener('play', onPlay);
        return () => {
            el.pause();
            el.removeEventListener('ended', onEnded);
            el.removeEventListener('pause', onPause);
            el.removeEventListener('play', onPlay);
            el.removeAttribute('src');
            if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
        };
    }, []);

    useEffect(() => {
        if (!studioAccounts.length || didInitAccounts.current) return;
        didInitAccounts.current = true;
        const first = String(studioAccounts[0].id);
        setSelectedIds([first]);
        setSchedules((current) => ({
            ...current,
            [first]: current[first] || defaultSchedule(0),
        }));
    }, [studioAccounts]);

    const selectedAccounts = useMemo(
        () => studioAccounts.filter((account) => selectedIds.includes(String(account.id))),
        [studioAccounts, selectedIds],
    );
    const audioAccountId = selectedIds[0] || (studioAccounts[0] ? String(studioAccounts[0].id) : undefined);
    const searchAudio = useSearchInstagramAudio(audioAccountId);

    useEffect(() => {
        if (!audioAccountId) {
            setAudioResults([]);
            setAudioSearchError(null);
            return;
        }
        const handle = window.setTimeout(async () => {
            try {
                const tracks = await searchAudio.mutateAsync({ q: audioQuery, audioType });
                setAudioResults(tracks);
                setAudioSearchError(null);
            } catch (error) {
                setAudioResults([]);
                setAudioSearchError(getApiErrorMessage(error, 'Could not search Instagram music'));
            }
        }, 400);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioAccountId, audioQuery, audioType]);

    function stopAudioPreview() {
        playRequestRef.current += 1;
        audioRef.current?.pause();
        if (audioRef.current) {
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
        }
        if (audioBlobUrlRef.current) {
            URL.revokeObjectURL(audioBlobUrlRef.current);
            audioBlobUrlRef.current = null;
        }
        setPreviewingId(null);
        setPreviewPlaying(false);
        setPreviewLoadingId(null);
    }

    function rememberAudioDuration(audioId: string, durationMs: number) {
        if (!durationMs) return;
        setAudioResults((current) => current.map((track) => (
            track.audio_id === audioId && !track.duration_ms ? { ...track, duration_ms: durationMs } : track
        )));
        setSelectedAudio((current) => (
            current?.audio_id === audioId && !current.duration_ms
                ? { ...current, duration_ms: durationMs }
                : current
        ));
    }

    function applyAudioStart(track: InstagramAudioTrack) {
        const el = audioRef.current;
        if (!el || !Number.isFinite(el.duration)) return;
        const durationMs = track.duration_ms || Math.round(el.duration * 1000);
        const startMs = clampAudioStart(audioStartsRef.current[track.audio_id] || 0, durationMs);
        if (startMs > 0 && startMs / 1000 < el.duration) {
            el.currentTime = startMs / 1000;
        }
    }

    function updateTrackStart(audioId: string, startMs: number, durationMs?: number | null) {
        const next = clampAudioStart(startMs, durationMs);
        setAudioStarts((current) => ({ ...current, [audioId]: next }));
        if (previewingId === audioId && audioRef.current && Number.isFinite(audioRef.current.duration)) {
            audioRef.current.currentTime = Math.min(next / 1000, audioRef.current.duration);
        }
    }

    async function loadAudioSrc(src: string) {
        const el = audioRef.current;
        if (!el) throw new Error('Audio player is not ready');
        await new Promise<void>((resolve, reject) => {
            let settled = false;
            const onReady = () => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve();
            };
            const onError = () => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(new Error('Could not load audio'));
            };
            const cleanup = () => {
                el.removeEventListener('loadedmetadata', onReady);
                el.removeEventListener('error', onError);
            };
            el.addEventListener('loadedmetadata', onReady);
            el.addEventListener('error', onError);
            el.src = src;
            if (el.readyState >= 1) onReady();
        });
    }

    async function fetchAudioPreviewBlob(track: InstagramAudioTrack) {
        if (!audioAccountId) throw new Error('Connect Meta to play Instagram music');
        const res = await api.get(
            `/social-accounts/${audioAccountId}/audio/${encodeURIComponent(track.audio_id)}/preview`,
            {
                params: track.download_url ? { url: track.download_url } : undefined,
                responseType: 'blob',
            },
        );
        if (res.data instanceof Blob && res.data.type.includes('json')) {
            const text = await res.data.text();
            try {
                const parsed = JSON.parse(text) as { message?: string };
                throw new Error(parsed.message || 'Could not play this track');
            } catch (error) {
                if (error instanceof SyntaxError) throw new Error('Could not play this track');
                throw error;
            }
        }
        if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
        const url = URL.createObjectURL(res.data);
        audioBlobUrlRef.current = url;
        return url;
    }

    async function previewTrack(track: InstagramAudioTrack) {
        const el = audioRef.current;
        if (!el) return;
        if (previewingId === track.audio_id) {
            if (el.paused) await el.play();
            else el.pause();
            return;
        }
        if (!audioAccountId) {
            setAudioPlayError('Connect Meta to play Instagram music');
            return;
        }

        const requestId = ++playRequestRef.current;
        setAudioPlayError(null);
        setPreviewLoadingId(track.audio_id);
        el.pause();
        try {
            await loadAudioSrc(await fetchAudioPreviewBlob(track));
            if (requestId !== playRequestRef.current) return;
            const durationMs = Number.isFinite(el.duration)
                ? Math.round(el.duration * 1000)
                : (track.duration_ms || 0);
            rememberAudioDuration(track.audio_id, durationMs);
            applyAudioStart({ ...track, duration_ms: durationMs || track.duration_ms });
            const playingTrack = { ...track, duration_ms: durationMs || track.duration_ms };
            el.addEventListener('playing', () => applyAudioStart(playingTrack), { once: true });
            await el.play();
            setPreviewingId(track.audio_id);
        } catch (error) {
            if (requestId !== playRequestRef.current) return;
            setPreviewingId(null);
            setAudioPlayError(getApiErrorMessage(error, 'Could not play this track'));
        } finally {
            if (requestId === playRequestRef.current) setPreviewLoadingId(null);
        }
    }

    const nextPublish = useMemo(() => {
        const stamps = selectedAccounts
            .map((account) => schedules[String(account.id)])
            .filter((item) => item?.date && item?.time)
            .map((item) => new Date(toIstIso(item.date, item.time)).getTime())
            .sort((a, b) => a - b);
        return stamps[0] ? formatIstLabel(new Date(stamps[0]).toISOString()) : '—';
    }, [selectedAccounts, schedules]);

    const upcoming = useMemo(
        () => posts.filter((post) => post.status !== 'cancelled'),
        [posts],
    );

    function ensureSchedule(accountId: string, index: number) {
        setSchedules((current) => {
            if (current[accountId]) return current;
            return {
                ...current,
                [accountId]: defaultSchedule(index),
            };
        });
    }

    function updateSchedule(accountId: string, next: Partial<AccountSchedule>, current: AccountSchedule) {
        const merged = {
            date: next.date ?? current.date,
            time: next.time ?? current.time,
            caption: next.caption ?? current.caption,
        };
        const clamped = clampSchedule(merged.date, merged.time, merged.caption);
        if (isScheduleBeforeNow(merged.date, merged.time)) {
            setBanner({ type: 'error', text: 'Schedule date and time cannot be before the current date and time.' });
        }
        setSchedules((existing) => ({ ...existing, [accountId]: clamped }));
    }

    function toggleAccount(accountId: string, index: number) {
        setSelectedIds((current) => {
            if (current.includes(accountId)) {
                return current.filter((id) => id !== accountId);
            }
            ensureSchedule(accountId, index);
            return [...current, accountId];
        });
    }

    function selectAll() {
        const ids = studioAccounts.map((account) => String(account.id));
        ids.forEach((id, index) => ensureSchedule(id, index));
        setSelectedIds(ids);
    }

    function resetComposer() {
        setEditingId(null);
        setCaption('');
        setHashtags(['#creator', '#reels']);
        setSameCaption(true);
        setSuggestHashtags(true);
        setAddFirstComment(false);
        setFirstComment('');
        setPreviewUrl('');
        setFileName('');
        setFileSize(null);
        setDuration(null);
        setDimensions(null);
        setVideoUrl('');
        setVideoFilename('');
        setVideoMime('');
        setThumbnailUrl('');
        setSelectedAudio(null);
        setAudioQuery('');
        setAudioResults([]);
        setAudioSearchError(null);
        setAudioStarts({});
        setAudioPlayError(null);
        stopAudioPreview();
    }

    async function handleVideoFile(file: File) {
        const allowed = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
        if (!allowed.includes(file.type) && !/\.(mp4|mov|m4v)$/i.test(file.name)) {
            setBanner({ type: 'error', text: 'Upload an MP4 or MOV reel.' });
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            setBanner({ type: 'error', text: 'Reel files can be up to 100MB.' });
            return;
        }

        try {
            const meta = await readVideoMeta(file);
            setPreviewUrl(meta.previewUrl);
            setFileName(file.name);
            setFileSize(file.size);
            setDuration(meta.duration);
            setDimensions({ width: meta.width, height: meta.height });
            setBanner(null);

            const uploaded = await uploadReel.mutateAsync({
                file,
                thumbnail: meta.thumbnail,
                meta: {
                    duration_seconds: meta.duration,
                    width: meta.width,
                    height: meta.height,
                },
            });
            setVideoUrl(uploaded.video_url);
            setVideoFilename(uploaded.video_filename);
            setVideoMime(uploaded.video_mime || file.type);
            setThumbnailUrl(uploaded.thumbnail_url || '');
            setFileSize(uploaded.video_size || file.size);
            setDuration(uploaded.duration_seconds || meta.duration);
            if (uploaded.width && uploaded.height) {
                setDimensions({ width: uploaded.width, height: uploaded.height });
            }
        } catch (error) {
            setBanner({ type: 'error', text: getApiErrorMessage(error, 'Could not upload this reel') });
        }
    }

    function onDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void handleVideoFile(file);
    }

    function addHashtag() {
        const next = customTag.trim();
        if (!next) return;
        const tag = next.startsWith('#') ? next : `#${next.replace(/^#+/, '')}`;
        if (!hashtags.includes(tag)) setHashtags((current) => [...current, tag]);
        setCustomTag('');
    }

    function buildPayload(status: 'draft' | 'scheduled'): ReelPostPayload {
        return {
            video_url: videoUrl,
            video_filename: videoFilename,
            original_filename: fileName,
            video_mime: videoMime,
            video_size: fileSize,
            duration_seconds: duration,
            width: dimensions?.width,
            height: dimensions?.height,
            thumbnail_url: thumbnailUrl,
            caption,
            hashtags,
            use_same_caption: sameCaption,
            suggest_hashtags: suggestHashtags,
            add_first_comment: addFirstComment,
            first_comment: firstComment,
            ig_audio_id: selectedAudio?.audio_id || null,
            ig_audio_title: selectedAudio?.title || null,
            ig_audio_artist: selectedAudio?.artist || null,
            ig_audio_thumbnail_url: selectedAudio?.thumbnail_url || null,
            ig_audio_duration_ms: selectedAudio?.duration_ms || null,
            ig_audio_start_ms: selectedAudio
                ? clampAudioStart(audioStarts[selectedAudio.audio_id] || 0, selectedAudio.duration_ms)
                : null,
            status,
            targets: studioAccounts.map((account) => {
                const id = String(account.id);
                const schedule = schedules[id];
                const enabled = selectedIds.includes(id);
                return {
                    social_account_id: Number(account.id),
                    caption: sameCaption ? caption : (schedule?.caption || caption),
                    first_comment: firstComment,
                    scheduled_at: schedule ? toIstIso(schedule.date, schedule.time) : null,
                    enabled,
                };
            }),
        };
    }

    async function save(status: 'draft' | 'scheduled') {
        if (!videoUrl) {
            setBanner({ type: 'error', text: 'Upload a reel before saving or scheduling.' });
            return;
        }
        if (status === 'scheduled' && selectedIds.length === 0) {
            setBanner({ type: 'error', text: 'Choose at least one Instagram account.' });
            return;
        }
        if (status === 'scheduled') {
            const pastAccounts = selectedAccounts.filter((account) => {
                const schedule = schedules[String(account.id)];
                return !schedule || isScheduleBeforeNow(schedule.date, schedule.time);
            });
            if (pastAccounts.length) {
                setBanner({
                    type: 'error',
                    text: `Schedule date and time cannot be before now (${pastAccounts.map((account) => `@${account.username}`).join(', ')}).`,
                });
                return;
            }
        }
        try {
            await saveReel.mutateAsync({
                id: editingId || undefined,
                payload: buildPayload(status),
            });
            setBanner({
                type: 'ok',
                text: status === 'scheduled'
                    ? `Scheduled ${selectedIds.length} reel${selectedIds.length === 1 ? '' : 's'}.`
                    : 'Draft saved.',
            });
            if (status === 'scheduled') resetComposer();
        } catch (error) {
            setBanner({ type: 'error', text: getApiErrorMessage(error, 'Could not save this reel') });
        }
    }

    function loadPost(post: ReelPost) {
        setEditingId(post.id);
        setCaption(post.caption || '');
        setHashtags(post.hashtags?.length ? post.hashtags : ['#creator', '#reels']);
        setSameCaption(post.use_same_caption);
        setSuggestHashtags(post.suggest_hashtags);
        setAddFirstComment(post.add_first_comment);
        setFirstComment(post.first_comment || '');
        setVideoUrl(post.video_url);
        setVideoFilename(post.video_filename || '');
        setVideoMime(post.video_mime || '');
        setThumbnailUrl(post.thumbnail_url || '');
        setFileName(post.original_filename || post.video_filename || 'reel.mp4');
        setFileSize(post.video_size || null);
        setDuration(post.duration_seconds || null);
        setDimensions(post.width && post.height ? { width: post.width, height: post.height } : null);
        setPreviewUrl(resolveAssetUrl(post.video_url));
        setSelectedAudio(post.ig_audio_id ? {
            audio_id: post.ig_audio_id,
            title: post.ig_audio_title || 'Selected audio',
            artist: post.ig_audio_artist,
            thumbnail_url: post.ig_audio_thumbnail_url,
            duration_ms: post.ig_audio_duration_ms,
        } : null);
        setAudioStarts(post.ig_audio_id
            ? { [post.ig_audio_id]: clampAudioStart(post.ig_audio_start_ms || 0, post.ig_audio_duration_ms) }
            : {});
        setAudioQuery('');
        stopAudioPreview();
        const nextSelected = (post.targets || [])
            .filter((target) => target.enabled)
            .map((target) => String(target.social_account_id));
        setSelectedIds(nextSelected);
        const nextSchedules: Record<string, AccountSchedule> = {};
        for (const target of post.targets || []) {
            const parts = target.scheduled_at ? istDateParts(new Date(target.scheduled_at)) : defaultSchedule(0);
            nextSchedules[String(target.social_account_id)] = clampSchedule(
                parts.date,
                parts.time,
                target.caption || '',
            );
        }
        setSchedules(nextSchedules);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const editId = Number(searchParams.get('edit') || 0);
    useEffect(() => {
        if (!editId || !posts.length) return;
        const post = posts.find((item) => item.id === editId);
        if (!post) return;
        loadPost(post);
        searchParams.delete('edit');
        setSearchParams(searchParams, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, posts]);

    const videoPreview = previewUrl || (videoUrl ? resolveAssetUrl(videoUrl) : '');
    const thumbPreview = thumbnailUrl ? resolveAssetUrl(thumbnailUrl) : '';
    const saving = saveReel.isPending || uploadReel.isPending;
    const nowIst = istDateParts();
    const hasPastSchedule = selectedAccounts.some((account) => {
        const schedule = schedules[String(account.id)];
        return !schedule || isScheduleBeforeNow(schedule.date, schedule.time);
    });

    return (
        <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-7">
            <div className="mx-auto max-w-[1450px] px-4 pb-10 pt-6 md:px-7">
                {(banner || notice) && (
                    <div
                        className={`mb-4 rounded-[13px] border px-4 py-3 text-[12px] ${
                            banner?.type === 'error'
                                ? 'border-[#f3d0d0] bg-[#fff7f7] text-[#b4232c]'
                                : 'border-[#d8efe3] bg-[#f3fbf6] text-[#147a4b]'
                        }`}
                    >
                        {banner?.text || notice}
                    </div>
                )}

                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="m-0 text-[28px] font-extrabold tracking-[-1.2px]">
                            {editingId ? 'Edit scheduled reel' : 'Schedule a new reel'}
                        </h1>
                        <p className="mt-1.5 text-[11px] text-[#858891]">
                            Upload one reel and decide exactly where and when it goes live.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/creator/bulk-reels')}
                            className="rounded-[10px] border border-[#dce8f0] bg-white px-3.5 py-2.5 text-[10px] font-extrabold"
                        >
                            Bulk upload
                        </button>
                        <button
                            type="button"
                            onClick={() => void save('scheduled')}
                            disabled={saving || hasPastSchedule}
                            className="rounded-[10px] bg-brand-orange px-3.5 py-2.5 text-[10px] font-extrabold text-white disabled:opacity-60"
                        >
                            {saving ? 'Working…' : 'Add to schedule →'}
                        </button>
                    </div>
                </div>

                <div className="grid items-start gap-3.5 lg:grid-cols-[235px_minmax(0,1fr)_320px]">
                    <aside className="rounded-[18px] border border-[#dce8f0] bg-white p-4">
                        <div className="mb-3 flex items-start justify-between">
                            <div>
                                <h2 className="mb-1 text-[13px] font-bold">Connected accounts</h2>
                                <p className="m-0 text-[9px] text-[#8a8d95]">Choose where this reel should go</p>
                            </div>
                            {studioAccounts.length > 0 && (
                                <button type="button" onClick={selectAll} className="text-[9px] font-bold text-[#be2d6b]">
                                    Select all
                                </button>
                            )}
                        </div>
                        <div className="mb-2.5 text-[9px] text-[#787b83]">
                            {studioAccounts.length} account{studioAccounts.length === 1 ? '' : 's'} ready for Reels Studio
                        </div>
                        {accounts.length === 0 ? (
                            <div className="rounded-[13px] border border-dashed border-[#d9dae1] p-3 text-center">
                                <p className="text-[10px] text-[#8a8c94]">No Instagram accounts yet.</p>
                                <button
                                    type="button"
                                    onClick={() => connectInstagram()}
                                    className="mt-2 text-[10px] font-bold text-[#be2d6b]"
                                >
                                    {isConnecting ? 'Opening Instagram…' : 'Connect Instagram'}
                                </button>
                            </div>
                        ) : needsMeta ? (
                            <div className="rounded-[13px] border border-dashed border-[#d9dae1] p-3 text-center">
                                <p className="text-[10px] font-bold text-brand-ink">Meta connection required</p>
                                <p className="mt-1 text-[10px] text-[#8a8c94]">Connect Meta Account to use Reels Studio. Your Instagram connection stays intact.</p>
                                <button
                                    type="button"
                                    onClick={() => connectMeta()}
                                    className="mt-2 text-[10px] font-bold text-[#be2d6b]"
                                >
                                    {isConnectingMeta ? 'Opening Meta…' : 'Connect Meta Account'}
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {studioAccounts.map((account, index) => {
                                    const id = String(account.id);
                                    const selected = selectedIds.includes(id);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => toggleAccount(id, index)}
                                            className={`flex items-center gap-2.5 rounded-[13px] border p-2.5 text-left ${
                                                selected
                                                    ? 'border-[#ff6a1a] bg-[#eef7fc] shadow-[0_0_0_2px_rgba(255,106,26,0.05)]'
                                                    : 'border-[#dce8f0]'
                                            }`}
                                        >
                                            <div
                                                className="h-[35px] w-[35px] flex-none rounded-full"
                                                style={accountAvatarStyle(account, index)}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <strong className="block text-[11px]">@{account.username}</strong>
                                                <span className="mt-0.5 block text-[9px] text-[#8a8c94]">
                                                    {formatCount(account.followers_count || 0)} followers
                                                </span>
                                            </div>
                                            <div
                                                className={`grid h-[17px] w-[17px] place-items-center rounded-full text-[9px] ${
                                                    selected
                                                        ? 'border border-[#ff6a1a] bg-[#ff6a1a] text-white'
                                                        : 'border border-[#d6d7de] text-transparent'
                                                }`}
                                            >
                                                ✓
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <p className="mt-4 border-t border-[#efeff2] pt-3 text-[9px] leading-relaxed text-[#898c94]">
                            Each selected account can have its own date, time and caption before publishing.
                        </p>
                    </aside>

                    <section className="min-h-[580px] rounded-[18px] border border-[#dce8f0] bg-white p-4">
                        <div className="mb-3 flex items-start justify-between">
                            <div>
                                <h2 className="mb-1 text-[13px] font-bold">Reel content</h2>
                                <p className="m-0 text-[9px] text-[#8a8d95]">Upload MP4/MOV · Recommended 9:16 vertical video</p>
                            </div>
                            <span className="text-[9px] font-bold text-[#be2d6b]">Up to 100MB</span>
                        </div>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="video/mp4,video/quicktime,.mp4,.mov"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void handleVideoFile(file);
                                event.target.value = '';
                            }}
                        />

                        <div
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            className={`relative flex h-[350px] items-center justify-center overflow-hidden rounded-[18px] border-[1.5px] ${
                                videoPreview
                                    ? 'border-solid border-[#dce8f0] bg-[#101116]'
                                    : `border-dashed ${dragging ? 'border-[#ff6a1a] bg-[#fff7fb]' : 'border-[#d8d9e0] bg-gradient-to-b from-[#fcfcfd] to-[#f8f8fb]'}`
                            }`}
                        >
                            {videoPreview ? (
                                <div className="relative">
                                    <video
                                        src={videoPreview}
                                        poster={thumbPreview || undefined}
                                        className="h-[290px] w-[176px] rounded-[20px] border-[5px] border-white/20 object-cover shadow-[0_25px_50px_rgba(0,0,0,0.3)]"
                                        controls
                                        muted
                                    />
                                    <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/55 px-1.5 py-1 text-[8px] text-white">
                                        {formatDuration(duration)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="mx-auto mb-3 grid h-[58px] w-[58px] place-items-center rounded-[17px] border border-[#dce8f0] bg-white text-[#555861] shadow-[0_8px_18px_rgba(20,20,40,0.05)]">
                                        <svg viewBox="0 0 24 24" className="h-[25px] w-[25px] fill-none stroke-current stroke-[1.7]">
                                            <path d="M12 16V5" />
                                            <path d="M8 9l4-4 4 4" />
                                            <path d="M4 19h16" />
                                        </svg>
                                    </div>
                                    <h3 className="mb-1 text-[14px] font-bold">Drop your reel here</h3>
                                    <p className="mb-3 text-[10px] text-[#8a8d95]">
                                        Upload one video and schedule it across multiple accounts.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        className="rounded-[9px] bg-brand-orange px-3.5 py-2 text-[10px] font-extrabold text-white"
                                    >
                                        Choose video
                                    </button>
                                </div>
                            )}
                        </div>

                        {fileName && (
                            <div className="mt-3 flex items-center justify-between">
                                <div>
                                    <strong className="block text-[11px]">{fileName}</strong>
                                    <span className="text-[9px] text-[#8d9098]">
                                        {fileSize ? `${formatFileSize(fileSize)} · ` : ''}
                                        {dimensions ? `${dimensions.width} × ${dimensions.height} · ` : ''}
                                        {formatDuration(duration)}
                                        {uploadReel.isPending ? ' · Uploading…' : ''}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="rounded-[9px] border border-[#dce8f0] bg-white px-2.5 py-2 text-[9px] font-bold"
                                >
                                    Replace
                                </button>
                            </div>
                        )}

                        <div className="mt-4">
                            <div className="mb-2 flex justify-between text-[10px] font-extrabold">
                                <span>Caption</span>
                                <span className="font-medium text-[#a0a2aa]">{caption.length} / 2200</span>
                            </div>
                            <textarea
                                value={caption}
                                maxLength={2200}
                                onChange={(event) => setCaption(event.target.value)}
                                placeholder="Write your reel caption... e.g. Introducing our new summer drop ✨"
                                className="min-h-[85px] w-full resize-y rounded-xl border border-[#dce8f0] px-3 py-2.5 text-[11px] leading-relaxed outline-none"
                            />
                            <div className="mt-3">
                                <div className="mb-2 flex justify-between text-[10px] font-extrabold">
                                    <span>Hashtags</span>
                                    <span className="font-medium text-[#a0a2aa]">Add or choose suggestions</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {HASHTAG_SUGGESTIONS.map((tag) => {
                                        const active = hashtags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setHashtags((current) => (
                                                    current.includes(tag)
                                                        ? current.filter((item) => item !== tag)
                                                        : [...current, tag]
                                                ))}
                                                className={`rounded-full px-2 py-1.5 text-[9px] ${
                                                    active ? 'bg-[#e8f8fe] text-[#f05a0c]' : 'bg-[#f3f3f6] text-[#656872]'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                    {hashtags.filter((tag) => !HASHTAG_SUGGESTIONS.includes(tag)).map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setHashtags((current) => current.filter((item) => item !== tag))}
                                            className="rounded-full bg-[#e8f8fe] px-2 py-1.5 text-[9px] text-[#f05a0c]"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 flex gap-1.5">
                                    <input
                                        value={customTag}
                                        onChange={(event) => setCustomTag(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                addHashtag();
                                            }
                                        }}
                                        placeholder="Add custom hashtag"
                                        className="h-9 flex-1 rounded-[9px] border border-[#dce8f0] px-2 text-[11px] outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={addHashtag}
                                        className="rounded-[9px] border border-[#dce8f0] bg-white px-2.5 text-[9px] font-bold"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="mb-2 flex items-center justify-between text-[10px] font-extrabold">
                                    <span>Instagram music</span>
                                    <span className="font-medium text-[#a0a2aa]">Optional · Meta catalog</span>
                                </div>
                                {selectedAudio && (
                                    <div className="mb-2 rounded-[11px] border border-[#dce8f0] bg-[#f4fbff] p-2">
                                        <div className="flex items-center gap-2">
                                            <AudioPlayButton
                                                loading={previewLoadingId === selectedAudio.audio_id}
                                                playing={previewingId === selectedAudio.audio_id && previewPlaying}
                                                onClick={() => void previewTrack(selectedAudio)}
                                            />
                                            {selectedAudio.thumbnail_url ? (
                                                <img
                                                    src={selectedAudio.thumbnail_url}
                                                    alt=""
                                                    className="h-9 w-9 flex-none rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="grid h-9 w-9 flex-none place-items-center rounded-md bg-brand-orange text-[9px] font-bold text-white">♪</div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <strong className="block truncate text-[10px]">{selectedAudio.title}</strong>
                                                <span className="block truncate text-[8px] text-[#8a8d95]">
                                                    {selectedAudio.artist || 'Instagram audio'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (previewingId === selectedAudio.audio_id) stopAudioPreview();
                                                    setSelectedAudio(null);
                                                }}
                                                className="text-[9px] font-bold text-[#be2d6b]"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <AudioStartSlider
                                            startMs={audioStarts[selectedAudio.audio_id] || 0}
                                            durationMs={selectedAudio.duration_ms}
                                            onChange={(value) => updateTrackStart(selectedAudio.audio_id, value, selectedAudio.duration_ms)}
                                        />
                                    </div>
                                )}
                                <div className="mb-1.5 flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setAudioType('music')}
                                        className={`rounded-full px-2 py-1 text-[8px] font-bold ${
                                            audioType === 'music' ? 'bg-[#e8f8fe] text-[#f05a0c]' : 'bg-[#f3f3f6] text-[#656872]'
                                        }`}
                                    >
                                        Music
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAudioType('original_sound')}
                                        className={`rounded-full px-2 py-1 text-[8px] font-bold ${
                                            audioType === 'original_sound' ? 'bg-[#e8f8fe] text-[#f05a0c]' : 'bg-[#f3f3f6] text-[#656872]'
                                        }`}
                                    >
                                        Original sounds
                                    </button>
                                </div>
                                <input
                                    value={audioQuery}
                                    onChange={(event) => setAudioQuery(event.target.value)}
                                    placeholder={audioAccountId ? 'Search Instagram music' : 'Connect Meta to search music'}
                                    disabled={!audioAccountId}
                                    className="h-9 w-full rounded-[9px] border border-[#dce8f0] px-2 text-[11px] outline-none disabled:bg-[#f7f7f9]"
                                />
                                <div className="mt-1.5 max-h-[220px] overflow-auto">
                                    {searchAudio.isPending && (
                                        <p className="px-1 py-2 text-[9px] text-[#8a8d95]">Searching…</p>
                                    )}
                                    {!searchAudio.isPending && audioSearchError && (
                                        <div className="px-1 py-2">
                                            <p className="text-[9px] leading-relaxed text-[#be2d6b]">{audioSearchError}</p>
                                            {audioSearchError.toLowerCase().includes('reconnect') && (
                                                <button
                                                    type="button"
                                                    onClick={() => connectMeta()}
                                                    className="mt-1 text-[9px] font-bold text-[#be2d6b]"
                                                >
                                                    {isConnectingMeta ? 'Opening Facebook…' : 'Reconnect Facebook Account'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {!searchAudio.isPending && !audioSearchError && audioResults.length === 0 && (
                                        <p className="px-1 py-2 text-[9px] text-[#8a8d95]">
                                            {audioQuery.trim()
                                                ? 'No matching tracks in Meta’s third-party catalog. Try a shorter keyword, or clear the search for trending tracks.'
                                                : 'No trending tracks returned. Reconnect Meta if this stays empty.'}
                                        </p>
                                    )}
                                    {audioResults.map((track) => {
                                        const selected = selectedAudio?.audio_id === track.audio_id;
                                        const previewing = previewingId === track.audio_id;
                                        return (
                                            <div
                                                key={track.audio_id}
                                                className={`rounded-[9px] px-1 py-1.5 ${selected ? 'bg-[#e8f8fe]' : 'hover:bg-[#f4fbff]'}`}
                                            >
                                                <div className="flex w-full items-center gap-2">
                                                    <AudioPlayButton
                                                        loading={previewLoadingId === track.audio_id}
                                                        playing={previewing && previewPlaying}
                                                        onClick={() => void previewTrack(track)}
                                                    />
                                                    {track.thumbnail_url ? (
                                                        <img src={track.thumbnail_url} alt="" className="h-7 w-7 flex-none rounded object-cover" />
                                                    ) : (
                                                        <div className="grid h-7 w-7 flex-none place-items-center rounded bg-[#f3f3f6] text-[9px]">♪</div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedAudio(track)}
                                                        className="min-w-0 flex-1 text-left"
                                                    >
                                                        <strong className="block truncate text-[10px]">{track.title}</strong>
                                                        <span className="block truncate text-[8px] text-[#8a8d95]">
                                                            {track.artist || 'Instagram audio'}
                                                            {track.duration_ms ? ` · ${formatDuration(track.duration_ms / 1000)}` : ''}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedAudio(track)}
                                                        className={`text-[8px] font-bold ${selected ? 'text-[#f05a0c]' : 'text-[#656872]'}`}
                                                    >
                                                        {selected ? 'Using' : 'Use'}
                                                    </button>
                                                </div>
                                                {(previewing && !selected) && (
                                                    <AudioStartSlider
                                                        startMs={audioStarts[track.audio_id] || 0}
                                                        durationMs={track.duration_ms}
                                                        onChange={(value) => updateTrackStart(track.audio_id, value, track.duration_ms)}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {audioPlayError && (
                                    <p className="mt-1 px-1 text-[8px] leading-relaxed text-[#be2d6b]">{audioPlayError}</p>
                                )}
                                <p className="mt-1 text-[8px] leading-relaxed text-[#9a9ca4]">
                                    Play any track without attaching it. Drag Start at to choose where the song begins. Search uses Meta’s royalty-free Sound Collection for third-party apps, not the licensed songs in the Instagram app.
                                </p>
                            </div>
                        </div>
                    </section>

                    <aside className="grid gap-3.5 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
                        <div className="rounded-[18px] border border-[#dce8f0] bg-white p-4">
                            <div className="mb-3">
                                <h2 className="mb-1 text-[13px] font-bold">Schedule by account</h2>
                                <p className="m-0 text-[9px] text-[#8a8d95]">Set individual publishing times</p>
                            </div>
                            <div className="grid gap-2">
                                {studioAccounts.map((account, index) => {
                                    const id = String(account.id);
                                    const selected = selectedIds.includes(id);
                                    const schedule = schedules[id] || defaultSchedule(index);
                                    const pastSchedule = selected && isScheduleBeforeNow(schedule.date, schedule.time);
                                    return (
                                        <div
                                            key={id}
                                            className={`rounded-[13px] border p-2.5 ${
                                                selected ? (pastSchedule ? 'border-[#e7b4b4]' : 'border-[#dce8f0]') : 'border-[#dce8f0] opacity-55'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-[30px] w-[30px] flex-none rounded-full"
                                                    style={accountAvatarStyle(account, index)}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <strong className="block text-[10px]">@{account.username}</strong>
                                                    <span className="text-[8px] text-[#8a8d95]">
                                                        {selected ? accountRoleLabel(account, index) : 'Not selected'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAccount(id, index)}
                                                    className={`h-[18px] w-8 rounded-full p-0.5 ${selected ? 'bg-[#ff6a1a]' : 'bg-[#ececf1]'}`}
                                                    aria-label={`Toggle @${account.username}`}
                                                >
                                                    <span className={`block h-3.5 w-3.5 rounded-full bg-white shadow ${selected ? 'ml-3.5' : ''}`} />
                                                </button>
                                            </div>
                                            {selected && (
                                                <>
                                                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                                                        <label className="block">
                                                            <span className="mb-1 block text-[8px] text-[#8b8d95]">Date</span>
                                                            <input
                                                                type="date"
                                                                min={nowIst.date}
                                                                value={schedule.date}
                                                                onChange={(event) => updateSchedule(id, { date: event.target.value }, schedule)}
                                                                className={`h-9 w-full rounded-[9px] border px-2 text-[9px] ${
                                                                    pastSchedule ? 'border-[#e7b4b4]' : 'border-[#dce8f0]'
                                                                }`}
                                                            />
                                                        </label>
                                                        <label className="block">
                                                            <span className="mb-1 block text-[8px] text-[#8b8d95]">Time</span>
                                                            <input
                                                                type="time"
                                                                min={schedule.date === nowIst.date ? nowIst.time : undefined}
                                                                value={schedule.time}
                                                                onChange={(event) => updateSchedule(id, { time: event.target.value }, schedule)}
                                                                className={`h-9 w-full rounded-[9px] border px-2 text-[9px] ${
                                                                    pastSchedule ? 'border-[#e7b4b4]' : 'border-[#dce8f0]'
                                                                }`}
                                                            />
                                                        </label>
                                                    </div>
                                                    {pastSchedule && (
                                                        <p className="mt-1.5 text-[8px] text-[#c23b3b]">
                                                            Date and time cannot be before now.
                                                        </p>
                                                    )}
                                                    {!sameCaption && (
                                                        <textarea
                                                            value={schedule.caption}
                                                            onChange={(event) => setSchedules((current) => ({
                                                                ...current,
                                                                [id]: { ...schedule, caption: event.target.value },
                                                            }))}
                                                            placeholder={`Caption for @${account.username}`}
                                                            className="mt-2 min-h-[70px] w-full rounded-[10px] border border-[#dce8f0] px-2 py-2 text-[10px] outline-none"
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = studioAccounts.find((account) => !selectedIds.includes(String(account.id)));
                                    if (next) {
                                        toggleAccount(String(next.id), studioAccounts.findIndex((account) => account.id === next.id));
                                        return;
                                    }
                                    connectMeta();
                                }}
                                className="mt-2 w-full rounded-[9px] border border-dashed border-[#d9dae1] bg-[#f4fbff] py-2 text-[9px] font-bold text-[#777b84]"
                            >
                                + Add another account schedule
                            </button>
                            <div className="mt-2 text-[8px] text-[#9a9ca4]">Timezone: IST (UTC+05:30)</div>
                            <div className="mt-2.5 rounded-[13px] border border-[#ededf1] bg-[#f4fbff] p-2.5">
                                <div className="my-1 flex justify-between text-[9px] text-[#777a83]">
                                    <span>Accounts selected</span>
                                    <strong className="text-brand-ink">{selectedIds.length}</strong>
                                </div>
                                <div className="my-1 flex justify-between text-[9px] text-[#777a83]">
                                    <span>Posts to publish</span>
                                    <strong className="text-brand-ink">{selectedIds.length}</strong>
                                </div>
                                <div className="mt-1.5 flex justify-between border-t border-[#e9e9ee] pt-1.5 text-[9px] font-bold">
                                    <span>Next publish</span>
                                    <strong>{nextPublish}</strong>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => void save('scheduled')}
                                disabled={saving || hasPastSchedule}
                                className="mt-3 h-11 w-full rounded-[11px] bg-brand-orange text-[10px] font-extrabold text-white disabled:opacity-60"
                            >
                                {saving ? 'Scheduling…' : `Schedule ${selectedIds.length || 0} reel${selectedIds.length === 1 ? '' : 's'} →`}
                            </button>
                            <div className="mt-2 text-center text-[8px] leading-relaxed text-[#a0a2aa]">
                                Publishing uses the optional Meta connection for each selected account. Videos are stored on this server.
                            </div>
                            <button
                                type="button"
                                onClick={() => void save('draft')}
                                disabled={saving}
                                className="mt-2 w-full rounded-[9px] border border-[#dce8f0] bg-white py-2 text-[9px] font-bold"
                            >
                                Save draft
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetComposer}
                                    className="mt-2 w-full text-[9px] font-bold text-[#8a8c94]"
                                >
                                    Clear and start a new reel
                                </button>
                            )}
                        </div>

                        <div className="rounded-[18px] border border-[#dce8f0] bg-white p-4">
                            <div className="mb-3">
                                <h2 className="mb-1 text-[13px] font-bold">Account-specific publishing</h2>
                                <p className="m-0 text-[9px] text-[#8a8d95]">Customize before scheduling</p>
                            </div>
                            <label className="mb-2 flex items-center gap-1.5 text-[9px]">
                                <input
                                    type="checkbox"
                                    checked={sameCaption}
                                    onChange={() => setSameCaption(true)}
                                    className="h-3.5 w-3.5"
                                />
                                Use same caption on all accounts
                            </label>
                            <label className="mb-2 flex items-center gap-1.5 text-[9px]">
                                <input
                                    type="checkbox"
                                    checked={!sameCaption}
                                    onChange={() => setSameCaption(false)}
                                    className="h-3.5 w-3.5"
                                />
                                Customize caption per account
                            </label>
                            <label className="mb-2 flex items-center gap-1.5 text-[9px]">
                                <input
                                    type="checkbox"
                                    checked={suggestHashtags}
                                    onChange={(event) => setSuggestHashtags(event.target.checked)}
                                    className="h-3.5 w-3.5"
                                />
                                Suggest hashtags automatically
                            </label>
                            <label className="mb-2 flex items-center gap-1.5 text-[9px]">
                                <input
                                    type="checkbox"
                                    checked={addFirstComment}
                                    onChange={(event) => setAddFirstComment(event.target.checked)}
                                    className="h-3.5 w-3.5"
                                />
                                Add first comment after publishing
                            </label>
                            {addFirstComment && (
                                <textarea
                                    value={firstComment}
                                    onChange={(event) => setFirstComment(event.target.value)}
                                    placeholder="First comment to post after the reel goes live"
                                    className="mt-1 min-h-[70px] w-full rounded-[10px] border border-[#dce8f0] px-2 py-2 text-[10px] outline-none"
                                />
                            )}
                        </div>
                    </aside>
                </div>

                <div className="mt-4 rounded-[18px] border border-[#dce8f0] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="m-0 text-[13px] font-bold">Upcoming schedule</h2>
                        <span className="text-[9px] text-[#888b93]">
                            {postsLoading ? 'Loading…' : `${upcoming.length} post${upcoming.length === 1 ? '' : 's'} queued`}
                        </span>
                    </div>
                    {upcoming.length === 0 ? (
                        <p className="py-4 text-[11px] text-[#8a8c94]">No scheduled reels yet. Upload a video and add it to the schedule.</p>
                    ) : (
                        <>
                            <div className="hidden border-b border-[#f0f0f3] pb-2 text-[8px] uppercase tracking-[0.4px] text-[#8b8d95] md:grid md:grid-cols-[52px_minmax(0,1.2fr)_minmax(170px,1fr)_130px_90px_110px] md:items-center md:gap-2.5">
                                <span />
                                <span>Reel</span>
                                <span>Instagram account</span>
                                <span>Schedule</span>
                                <span>Status</span>
                                <span className="text-right">Actions</span>
                            </div>
                            {upcoming.map((post) => {
                            const enabled = (post.targets || []).filter((target) => target.enabled);
                            const next = enabled
                                .map((target) => target.scheduled_at)
                                .filter(Boolean)
                                .sort()[0];
                            const status = queueStatus(post);
                            const failedTarget = enabled.find((target) => target.status === 'failed');
                            return (
                                <div
                                    key={post.id}
                                    className="grid grid-cols-[52px_minmax(0,1fr)_minmax(120px,0.9fr)] items-center gap-2.5 border-t border-[#f0f0f3] py-2.5 md:grid-cols-[52px_minmax(0,1.2fr)_minmax(170px,1fr)_130px_90px_110px]"
                                >
                                    <div
                                        className="relative h-12 overflow-hidden rounded-lg bg-gradient-to-br from-[#dba5a9] via-[#ff6a1a] to-[#27232a]"
                                        style={post.thumbnail_url ? {
                                            backgroundImage: `url(${resolveAssetUrl(post.thumbnail_url)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        } : undefined}
                                    >
                                        <span className="absolute left-1/2 top-1/2 -translate-x-[35%] -translate-y-1/2 border-y-[6px] border-l-[8px] border-y-transparent border-l-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <strong className="block truncate text-[10px]">{post.original_filename || post.video_filename || 'reel.mp4'}</strong>
                                        <span className="mt-0.5 block text-[8px] text-[#8b8e96]">
                                            {post.video_size ? `${formatFileSize(post.video_size)} · ` : ''}
                                            {formatDuration(post.duration_seconds)}
                                        </span>
                                        {failedTarget?.error_message && (
                                            <span className="mt-1 block text-[8px] text-[#c23b3b]">{failedTarget.error_message}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 space-y-1.5">
                                        {enabled.length === 0 ? (
                                            <span className="text-[8px] text-[#8b8e96]">No account</span>
                                        ) : enabled.map((target, index) => {
                                            const account: SocialAccountRecord = {
                                                id: String(target.social_account?.id || target.social_account_id),
                                                platform: 'instagram',
                                                username: target.social_account?.username || 'account',
                                                display_name: target.social_account?.display_name,
                                                profile_image: target.social_account?.profile_image,
                                                account_type: target.social_account?.account_type,
                                                followers_count: target.social_account?.followers_count,
                                                is_connected: target.social_account?.is_connected,
                                            };
                                            return (
                                                <div key={target.id} className="flex min-w-0 items-center gap-2">
                                                    <div
                                                        className="h-7 w-7 flex-none rounded-full"
                                                        style={accountAvatarStyle(account, index)}
                                                    />
                                                    <div className="min-w-0">
                                                        <strong className="block truncate text-[9px]">@{account.username}</strong>
                                                        <span className="mt-0.5 block truncate text-[8px] text-[#8b8e96]">
                                                            {formatCount(account.followers_count || 0)} followers
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="hidden md:block">
                                        <strong className="block text-[9px]">{formatIstLabel(next)}</strong>
                                        <span className="mt-0.5 block text-[8px] text-[#8b8e96]">IST</span>
                                    </div>
                                    <div className={`hidden rounded-full px-2 py-1 text-center text-[8px] font-bold md:block ${statusClass(status.toLowerCase())}`}>
                                        {status}
                                    </div>
                                    <div className="hidden text-right md:block">
                                        {['draft', 'scheduled', 'failed'].includes(post.status) && (
                                            <button
                                                type="button"
                                                onClick={() => loadPost(post)}
                                                className="rounded-lg border border-[#dce8f0] bg-white px-2 py-1.5 text-[8px]"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {post.status === 'scheduled' && (
                                            <button
                                                type="button"
                                                onClick={() => cancelReel.mutate(post.id)}
                                                className="ml-1 rounded-lg border border-[#dce8f0] bg-white px-2 py-1.5 text-[8px]"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {failedTarget && (
                                            <button
                                                type="button"
                                                onClick={() => retryTarget.mutate(failedTarget.id)}
                                                className="ml-1 rounded-lg border border-[#dce8f0] bg-white px-2 py-1.5 text-[8px]"
                                            >
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
