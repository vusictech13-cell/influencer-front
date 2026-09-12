import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    useCancelReelPost,
    useReelPosts,
    useRetryReelTarget,
    useSaveBulkReelPosts,
    useUploadReelMedia,
    type ReelPostPayload,
} from '@/hooks/useReelPosts';
import {
    useConnectInstagram,
    useConnectMeta,
    useInstagramAccounts,
} from '@/hooks/useSocialAccounts';
import { accountAvatarStyle } from '@/components/creator/CreatorInstagramAccounts';
import { getApiErrorMessage } from '@/api/axios';
import { formatCount, type SocialAccountRecord } from '@/utils/creator';
import { formatFileSize, resolveAssetUrl } from '@/utils/image';
import {
    accountHasMeta,
    clearInstagramOAuthSearchParams,
    getInstagramOAuthErrorMessage,
    getOAuthSuccessMessage,
} from '@/utils/socialAccounts';
import {
    HASHTAG_SUGGESTIONS,
    MAX_BULK_REELS,
    MAX_REEL_BYTES,
    clampSchedule,
    formatDuration,
    formatIstLabel,
    isAllowedReelFile,
    isScheduleBeforeNow,
    istDateParts,
    queueStatus,
    readVideoMeta,
    shuffle,
    staggerSchedule,
    statusClass,
    toIstIso,
} from '@/utils/reels';

type ScheduleMode = 'same' | 'stagger' | 'custom';

type BulkReel = {
    id: string;
    name: string;
    size: number | null;
    duration: number | null;
    width: number | null;
    height: number | null;
    previewUrl: string;
    videoUrl: string;
    videoFilename: string;
    videoMime: string;
    thumbnailUrl: string;
    accountId: string | null;
    date: string;
    time: string;
    caption: string;
    uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
    uploadError?: string;
};

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-[19px] w-[34px] rounded-full p-[2px] ${on ? 'bg-[#ff6a1a]' : 'bg-[#e9e9ee]'}`}
            aria-pressed={on}
        >
            <span className={`block h-[15px] w-[15px] rounded-full bg-white shadow ${on ? 'ml-[15px]' : ''}`} />
        </button>
    );
}

function thumbStyle(reel: BulkReel, index: number) {
    const src = reel.thumbnailUrl || reel.previewUrl;
    if (src) {
        return {
            backgroundImage: `url(${src.startsWith('blob:') ? src : resolveAssetUrl(src)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        } as const;
    }
    return {
        background: `linear-gradient(145deg,hsl(${index * 31 + 10} 35% 72%),#ff6a1a,#27232a)`,
    } as const;
}

function uniqueId() {
    return globalThis.crypto?.randomUUID?.() || `reel-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CreatorBulkReelUpload() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { accounts } = useInstagramAccounts();
    const studioAccounts = useMemo(() => accounts.filter(accountHasMeta), [accounts]);
    const needsMeta = accounts.length > 0 && studioAccounts.length === 0;
    const { mutate: connectInstagram, isPending: isConnecting } = useConnectInstagram('bulk-reels');
    const { mutate: connectMeta, isPending: isConnectingMeta } = useConnectMeta('bulk-reels');
    const { data: posts = [], isLoading: postsLoading } = useReelPosts();
    const uploadReel = useUploadReelMedia();
    const saveBulk = useSaveBulkReelPosts();
    const cancelReel = useCancelReelPost();
    const retryTarget = useRetryReelTarget();
    const fileRef = useRef<HTMLInputElement>(null);
    const accountSectionRef = useRef<HTMLElement>(null);
    const mappingSectionRef = useRef<HTMLElement>(null);
    const filesRef = useRef<Map<string, File>>(new Map());

    const nowIst = istDateParts();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [reels, setReels] = useState<BulkReel[]>([]);
    const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('stagger');
    const [batchDate, setBatchDate] = useState(nowIst.date);
    const [batchTime, setBatchTime] = useState(nowIst.time);
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState<string[]>(['#creator', '#reels']);
    const [customTag, setCustomTag] = useState('');
    const [sameCaption, setSameCaption] = useState(true);
    const [suggestHashtags, setSuggestHashtags] = useState(true);
    const [randomizeOn, setRandomizeOn] = useState(true);
    const [stopOnFail, setStopOnFail] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [banner, setBanner] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

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
        if (!notice) return;
        const timer = setTimeout(() => setNotice(null), 3500);
        return () => clearTimeout(timer);
    }, [notice]);

    useEffect(() => {
        return () => {
            reels.forEach((reel) => {
                if (reel.previewUrl.startsWith('blob:')) URL.revokeObjectURL(reel.previewUrl);
                if (reel.thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(reel.thumbnailUrl);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedAccounts = useMemo(
        () => studioAccounts.filter((account) => selectedIds.includes(String(account.id))),
        [studioAccounts, selectedIds],
    );

    const accountById = useMemo(() => {
        const map = new Map<string, SocialAccountRecord>();
        accounts.forEach((account) => map.set(String(account.id), account));
        return map;
    }, [accounts]);

    const mappedCount = reels.filter((reel) => reel.accountId).length;
    const uniqueMapped = new Set(reels.map((reel) => reel.accountId).filter(Boolean)).size;
    const allUploaded = reels.length > 0 && reels.every((reel) => reel.videoUrl && reel.uploadStatus === 'uploaded');
    const mappingValid = reels.length > 0
        && selectedIds.length === reels.length
        && uniqueMapped === reels.length
        && mappedCount === reels.length;
    const hasPastSchedule = reels.some((reel) => isScheduleBeforeNow(reel.date, reel.time));
    const campaignReady = mappingValid && allUploaded && !hasPastSchedule && reels.every((reel) => reel.uploadStatus !== 'error');

    const nextPublish = useMemo(() => {
        const stamps = reels
            .filter((reel) => reel.date && reel.time)
            .map((reel) => new Date(toIstIso(reel.date, reel.time)).getTime())
            .sort((a, b) => a - b);
        return stamps[0] ? formatIstLabel(new Date(stamps[0]).toISOString()) : '—';
    }, [reels]);

    const upcoming = useMemo(
        () => posts.filter((post) => post.status !== 'cancelled'),
        [posts],
    );

    const uploadingCount = reels.filter((reel) => reel.uploadStatus === 'uploading' || reel.uploadStatus === 'pending').length;
    const saving = saveBulk.isPending || uploadingCount > 0;

    function flashNotice(text: string) {
        setNotice(text);
        setBanner(null);
    }

    function scheduleForIndex(index: number) {
        if (scheduleMode === 'same') return clampSchedule(batchDate, batchTime);
        return staggerSchedule(index, batchDate, batchTime);
    }

    function applySchedule(mode: ScheduleMode, date = batchDate, time = batchTime) {
        setReels((current) => current.map((reel, index) => {
            if (mode === 'custom') return reel;
            const next = mode === 'same' ? clampSchedule(date, time, reel.caption) : staggerSchedule(index, date, time, reel.caption);
            return { ...reel, date: next.date, time: next.time };
        }));
    }

    function mapAccounts(ids: string[], random = false) {
        const assigned = random ? shuffle(ids) : [...ids];
        setReels((current) => current.map((reel, index) => ({
            ...reel,
            accountId: assigned[index] || null,
        })));
    }

    function toggleAccount(accountId: string) {
        const next = selectedIds.includes(accountId)
            ? selectedIds.filter((id) => id !== accountId)
            : [...selectedIds, accountId];
        setSelectedIds(next);
        setReels((reelsCurrent) => {
            if (reelsCurrent.length && reelsCurrent.length === next.length) {
                const assigned = randomizeOn ? shuffle(next) : [...next];
                return reelsCurrent.map((reel, index) => ({
                    ...reel,
                    accountId: assigned[index] || null,
                }));
            }
            return reelsCurrent.map((reel) => (
                reel.accountId && next.includes(reel.accountId) ? reel : { ...reel, accountId: null }
            ));
        });
    }

    function selectAllAccounts() {
        let ids = studioAccounts.map((account) => String(account.id));
        if (reels.length && reels.length < ids.length) ids = ids.slice(0, reels.length);
        setSelectedIds(ids);
        mapAccounts(ids, randomizeOn);
        flashNotice(`${ids.length} account${ids.length === 1 ? '' : 's'} selected.`);
    }

    function clearAccounts() {
        setSelectedIds([]);
        setReels((current) => current.map((reel) => ({ ...reel, accountId: null })));
        flashNotice('All posting accounts were cleared.');
    }

    function randomizeMapping() {
        if (!reels.length) {
            setBanner({ type: 'error', text: 'Upload reels before randomizing the mapping.' });
            return;
        }
        if (reels.length !== selectedIds.length) {
            setBanner({ type: 'error', text: `Select exactly ${reels.length} accounts for ${reels.length} reels before randomizing.` });
            return;
        }
        mapAccounts(selectedIds, true);
        flashNotice('Random mapping created — every reel is assigned to a different account.');
    }

    function autoMap() {
        mapAccounts(selectedIds, false);
        flashNotice('Reels mapped in order — Reel 01 → Account 01, Reel 02 → Account 02, and so on.');
    }

    function resetMapping() {
        mapAccounts(selectedIds, false);
        flashNotice('Mapping reset to account order.');
    }

    function assignAccount(reelId: string, accountId: string) {
        setReels((current) => {
            const next = current.map((reel) => ({ ...reel }));
            const target = next.find((reel) => reel.id === reelId);
            if (!target) return current;
            const previousOwner = accountId ? next.find((reel) => reel.id !== reelId && reel.accountId === accountId) : undefined;
            const previousAccount = target.accountId;
            target.accountId = accountId || null;
            if (previousOwner) previousOwner.accountId = previousAccount;
            return next;
        });
    }

    function updateReelSchedule(reelId: string, date: string, time: string) {
        const clamped = clampSchedule(date, time);
        if (isScheduleBeforeNow(date, time)) {
            setBanner({ type: 'error', text: 'Schedule date and time cannot be before the current date and time.' });
        }
        if (scheduleMode === 'same') {
            setBatchDate(clamped.date);
            setBatchTime(clamped.time);
            applySchedule('same', clamped.date, clamped.time);
            return;
        }
        if (scheduleMode === 'stagger') {
            const index = reels.findIndex((reel) => reel.id === reelId);
            setBatchDate(clamped.date);
            setBatchTime(clamped.time);
            setReels((current) => current.map((reel, reelIndex) => {
                const next = staggerSchedule(Math.max(reelIndex - index, 0), clamped.date, clamped.time, reel.caption);
                if (reelIndex < index) return reel;
                return { ...reel, date: next.date, time: next.time };
            }));
            return;
        }
        setReels((current) => current.map((reel) => (
            reel.id === reelId ? { ...reel, date: clamped.date, time: clamped.time } : reel
        )));
    }

    async function uploadOne(reelId: string, file: File) {
        setReels((current) => current.map((reel) => (
            reel.id === reelId ? { ...reel, uploadStatus: 'uploading' } : reel
        )));
        try {
            const meta = await readVideoMeta(file);
            const localThumb = meta.thumbnail ? URL.createObjectURL(meta.thumbnail) : '';
            setReels((current) => current.map((reel) => {
                if (reel.id !== reelId) return reel;
                if (reel.previewUrl.startsWith('blob:')) URL.revokeObjectURL(reel.previewUrl);
                return {
                    ...reel,
                    previewUrl: meta.previewUrl,
                    thumbnailUrl: localThumb,
                    duration: meta.duration,
                    width: meta.width,
                    height: meta.height,
                };
            }));
            const uploaded = await uploadReel.mutateAsync({
                file,
                thumbnail: meta.thumbnail,
                meta: {
                    duration_seconds: meta.duration,
                    width: meta.width,
                    height: meta.height,
                },
            });
            setReels((current) => current.map((reel) => (
                reel.id === reelId ? {
                    ...reel,
                    uploadStatus: 'uploaded',
                    uploadError: undefined,
                    videoUrl: uploaded.video_url,
                    videoFilename: uploaded.video_filename,
                    videoMime: uploaded.video_mime || file.type,
                    thumbnailUrl: uploaded.thumbnail_url || localThumb,
                    size: uploaded.video_size || file.size,
                    duration: uploaded.duration_seconds || meta.duration,
                    width: uploaded.width || meta.width,
                    height: uploaded.height || meta.height,
                } : reel
            )));
        } catch (error) {
            setReels((current) => current.map((reel) => (
                reel.id === reelId ? {
                    ...reel,
                    uploadStatus: 'error',
                    uploadError: getApiErrorMessage(error, 'Could not upload this reel'),
                } : reel
            )));
        }
    }

    async function handleFiles(fileList: FileList | File[]) {
        const incoming = Array.from(fileList);
        if (!incoming.length) return;

        const valid: File[] = [];
        for (const file of incoming) {
            if (!isAllowedReelFile(file)) {
                setBanner({ type: 'error', text: `${file.name} is not an MP4 or MOV reel.` });
                continue;
            }
            if (file.size > MAX_REEL_BYTES) {
                setBanner({ type: 'error', text: `${file.name} is over 100MB.` });
                continue;
            }
            valid.push(file);
        }
        if (!valid.length) return;

        const remaining = MAX_BULK_REELS - reels.length;
        const files = valid.slice(0, Math.max(0, remaining));
        if (valid.length > files.length) {
            setBanner({ type: 'error', text: `A bulk batch can include up to ${MAX_BULK_REELS} reels.` });
            if (!files.length) return;
        }

        const created = files.map((file, index) => {
            const id = uniqueId();
            filesRef.current.set(id, file);
            const schedule = scheduleForIndex(reels.length + index);
            return {
                id,
                name: file.name,
                size: file.size,
                duration: null,
                width: null,
                height: null,
                previewUrl: '',
                videoUrl: '',
                videoFilename: '',
                videoMime: file.type,
                thumbnailUrl: '',
                accountId: selectedIds[reels.length + index] || null,
                date: schedule.date,
                time: schedule.time,
                caption: '',
                uploadStatus: 'pending' as const,
            };
        });

        const nextReels = [...reels, ...created];
        setReels(nextReels);
        if (selectedIds.length === nextReels.length) {
            mapAccounts(selectedIds, randomizeOn);
        }
        flashNotice(`${created.length} reel${created.length === 1 ? '' : 's'} added. ${selectedIds.length} account${selectedIds.length === 1 ? '' : 's'} currently selected.`);

        const queue = created.map((reel) => ({ id: reel.id, file: filesRef.current.get(reel.id)! })).filter((item) => item.file);
        const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
            while (queue.length) {
                const item = queue.shift();
                if (item) await uploadOne(item.id, item.file);
            }
        });
        await Promise.all(workers);
    }

    function clearUploads(message?: string) {
        setReels((current) => {
            current.forEach((reel) => {
                if (reel.previewUrl.startsWith('blob:')) URL.revokeObjectURL(reel.previewUrl);
                if (reel.thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(reel.thumbnailUrl);
            });
            return [];
        });
        filesRef.current.clear();
        if (message) flashNotice(message);
    }

    function removeReel(reelId: string) {
        setReels((current) => {
            const target = current.find((reel) => reel.id === reelId);
            if (target?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl);
            if (target?.thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(target.thumbnailUrl);
            return current.filter((reel) => reel.id !== reelId);
        });
        filesRef.current.delete(reelId);
    }

    function addHashtag() {
        const next = customTag.trim();
        if (!next) return;
        const tag = next.startsWith('#') ? next : `#${next.replace(/^#+/, '')}`;
        if (!hashtags.includes(tag)) setHashtags((current) => [...current, tag]);
        setCustomTag('');
    }

    function rowStatus(reel: BulkReel): { label: string; kind: string } {
        if (reel.uploadStatus === 'uploading' || reel.uploadStatus === 'pending') return { label: 'Uploading', kind: 'queued' };
        if (reel.uploadStatus === 'error') return { label: 'Error', kind: 'error' };
        if (!reel.accountId) return { label: 'Unmapped', kind: 'warning' };
        if (reels.filter((item) => item.accountId === reel.accountId).length > 1) return { label: 'Duplicate', kind: 'warning' };
        if (isScheduleBeforeNow(reel.date, reel.time)) return { label: 'Past time', kind: 'warning' };
        if (!reel.videoUrl) return { label: 'Needs upload', kind: 'warning' };
        return { label: 'Ready', kind: 'ready' };
    }

    function buildPayloads(status: 'draft' | 'scheduled'): ReelPostPayload[] {
        return reels.map((reel) => ({
            video_url: reel.videoUrl,
            video_filename: reel.videoFilename,
            original_filename: reel.name,
            video_mime: reel.videoMime,
            video_size: reel.size,
            duration_seconds: reel.duration,
            width: reel.width,
            height: reel.height,
            thumbnail_url: reel.thumbnailUrl.startsWith('blob:') ? '' : reel.thumbnailUrl,
            caption: sameCaption ? caption : (reel.caption || caption),
            hashtags,
            use_same_caption: sameCaption,
            suggest_hashtags: suggestHashtags,
            add_first_comment: false,
            first_comment: '',
            status,
            targets: [{
                social_account_id: Number(reel.accountId),
                caption: sameCaption ? caption : (reel.caption || caption),
                scheduled_at: toIstIso(reel.date, reel.time),
                enabled: true,
            }],
        }));
    }

    async function save(status: 'draft' | 'scheduled') {
        if (!reels.length) {
            setBanner({ type: 'error', text: 'Upload reels before saving this bulk batch.' });
            return;
        }
        if (!allUploaded) {
            setBanner({ type: 'error', text: 'Wait for every reel to finish uploading.' });
            return;
        }
        if (reels.length !== selectedIds.length || !mappingValid) {
            setBanner({
                type: 'error',
                text: `Bulk mapping requires an equal 1:1 count. You currently have ${reels.length} reels and ${selectedIds.length} accounts.`,
            });
            return;
        }
        if (status === 'scheduled' && hasPastSchedule) {
            setBanner({ type: 'error', text: 'Schedule date and time cannot be before now.' });
            return;
        }

        try {
            const result = await saveBulk.mutateAsync({
                status,
                stopOnFail,
                posts: buildPayloads(status),
            });
            const failed = result.errors.length;
            if (failed) {
                const failedIndexes = new Set(result.errors.map((item) => item.index));
                setReels((current) => current.filter((_, index) => failedIndexes.has(index)));
                setBanner({
                    type: 'error',
                    text: result.message || `Saved ${result.posts.length} reels, ${failed} failed.`,
                });
                return;
            }
            clearUploads();
            setBanner({
                type: 'ok',
                text: result.message || (status === 'scheduled'
                    ? `Scheduled ${result.posts.length} reels with a 1:1 account mapping.`
                    : 'Bulk campaign saved.'),
            });
        } catch (error) {
            setBanner({ type: 'error', text: getApiErrorMessage(error, 'Could not save this bulk batch') });
        }
    }

    function onDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setDragging(false);
        void handleFiles(event.dataTransfer.files);
    }

    const modeText = scheduleMode === 'same'
        ? 'All reels will use the same publishing time'
        : scheduleMode === 'stagger'
            ? 'Publishing times will be automatically staggered'
            : 'Each reel can have its own date and time';

    return (
        <div className="-mx-4 -mt-4 md:-mx-8 md:-mt-7">
            <div className="mx-auto max-w-[1500px] px-4 pb-10 pt-6 md:px-7">
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
                        <h1 className="m-0 text-[28px] font-extrabold tracking-[-1.2px]">Bulk upload reels</h1>
                        <p className="mt-1.5 text-[11px] text-[#858891]">
                            Add multiple videos and multiple Instagram accounts, then map each video to exactly one account.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void save('draft')}
                        disabled={saving || !allUploaded || !mappingValid}
                        className="rounded-[10px] bg-brand-orange px-3.5 py-2.5 text-[10px] font-extrabold text-white disabled:opacity-60"
                    >
                        {saveBulk.isPending ? 'Saving…' : 'Save bulk campaign →'}
                    </button>
                </div>

                <section ref={accountSectionRef} className="mb-3.5 rounded-[18px] border border-[#dce8f0] bg-white p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="mb-1 text-[13px] font-bold">1. Select Instagram accounts for posting</h2>
                            <p className="m-0 text-[9px] text-[#8a8d95]">
                                Select the accounts that will receive the reels. For a 1:1 bulk upload, the number of selected accounts must match the number of reels.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={selectAllAccounts} className="rounded-[8px] border border-[#dce8f0] bg-white px-2.5 py-1.5 text-[8px] font-bold">
                                Select all
                            </button>
                            <button type="button" onClick={clearAccounts} className="rounded-[8px] border border-[#dce8f0] bg-white px-2.5 py-1.5 text-[8px] font-bold">
                                Clear
                            </button>
                            <button type="button" onClick={randomizeMapping} className="rounded-[8px] border border-brand-orange bg-brand-orange px-2.5 py-1.5 text-[8px] font-bold text-white">
                                Randomize mapping ↻
                            </button>
                        </div>
                    </div>
                    {accounts.length === 0 ? (
                        <div className="rounded-[13px] border border-dashed border-[#d9dae1] p-4 text-center">
                            <p className="text-[10px] text-[#8a8c94]">No Instagram accounts connected yet.</p>
                            <button
                                type="button"
                                onClick={() => connectInstagram()}
                                className="mt-2 text-[10px] font-bold text-[#be2d6b]"
                            >
                                {isConnecting ? 'Opening Instagram…' : 'Connect Instagram'}
                            </button>
                        </div>
                    ) : needsMeta ? (
                        <div className="rounded-[13px] border border-dashed border-[#d9dae1] p-4 text-center">
                            <p className="text-[10px] font-bold text-brand-ink">Meta connection required</p>
                            <p className="mt-1 text-[10px] text-[#8a8c94]">Connect Meta Account to use bulk publishing. Your Instagram connection stays intact.</p>
                            <button
                                type="button"
                                onClick={() => connectMeta()}
                                className="mt-2 text-[10px] font-bold text-[#be2d6b]"
                            >
                                {isConnectingMeta ? 'Opening Meta…' : 'Connect Meta Account'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                            {studioAccounts.map((account, index) => {
                                const id = String(account.id);
                                const selected = selectedIds.includes(id);
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => toggleAccount(id)}
                                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left ${
                                            selected
                                                ? 'border-[#ff6a1a] bg-[#eef7fc] shadow-[0_0_0_2px_rgba(255,106,26,0.05)]'
                                                : 'border-[#dce8f0] bg-white'
                                        }`}
                                    >
                                        <div className="h-[30px] w-[30px] flex-none rounded-full" style={accountAvatarStyle(account, index)} />
                                        <div className="min-w-0 flex-1">
                                            <strong className="block truncate text-[9px]">@{account.username}</strong>
                                            <span className="mt-0.5 block text-[8px] text-[#8a8d95]">
                                                {formatCount(account.followers_count || 0)} followers
                                            </span>
                                        </div>
                                        <div className={`grid h-4 w-4 flex-none place-items-center rounded-full text-[8px] ${
                                            selected ? 'border border-[#ff6a1a] bg-[#ff6a1a] text-white' : 'border border-[#d6d7de] text-transparent'
                                        }`}>
                                            ✓
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-2.5 flex items-center justify-between border-t border-[#f0f0f3] pt-2.5 text-[9px] text-[#858891]">
                        <span>
                            <strong className="text-brand-ink">{selectedIds.length} account{selectedIds.length === 1 ? '' : 's'} selected</strong>
                            {' '}· Choose accounts before uploading/mapping reels.
                        </span>
                        <span>
                            Required for 1:1 mapping:{' '}
                            <strong className="text-brand-ink">{reels.length || 0} account{reels.length === 1 ? '' : 's'}</strong>
                        </span>
                    </div>
                </section>

                <div className="mb-3.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    {[
                        { label: 'Reels uploaded', value: String(reels.length), note: uploadingCount ? `${uploadingCount} uploading` : 'Ready to map', ok: !uploadingCount },
                        { label: 'Accounts selected', value: String(selectedIds.length), note: 'Connected accounts', ok: true },
                        { label: '1 : 1 mapping', value: `${Math.min(mappedCount, reels.length)} / ${reels.length || 0}`, note: mappingValid ? 'Every reel has one destination' : 'Counts must match 1 : 1', ok: mappingValid },
                        { label: 'Campaign status', value: campaignReady ? 'Ready' : 'Needs attention', note: campaignReady ? 'All mappings valid' : 'Fix mapping or schedule', ok: campaignReady },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-[15px] border border-[#dce8f0] bg-white px-4 py-3">
                            <span className="text-[9px] uppercase tracking-[0.4px] text-[#8b8d95]">{stat.label}</span>
                            <strong className="mt-1 block text-[18px]">{stat.value}</strong>
                            <small className={`text-[8px] ${stat.ok ? 'text-[#25a66c]' : 'text-[#d84b5b]'}`}>{stat.note}</small>
                        </div>
                    ))}
                </div>

                <div className="mb-3.5 grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_285px]">
                    <section className="rounded-[18px] border border-[#dce8f0] bg-white p-4">
                        <div className="mb-3 flex items-start justify-between">
                            <div>
                                <h2 className="mb-1 text-[13px] font-bold">2. Upload reels</h2>
                                <p className="m-0 text-[9px] text-[#8a8d95]">Select all videos you want to publish. The system will create one row per video.</p>
                            </div>
                            <button type="button" onClick={() => clearUploads('All uploaded reels were removed.')} className="text-[9px] font-bold text-[#be2d6b]">
                                Clear all
                            </button>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="video/mp4,video/quicktime,.mp4,.mov"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                                if (event.target.files) void handleFiles(event.target.files);
                                event.target.value = '';
                            }}
                        />
                        <div
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            className={`flex min-h-[190px] cursor-pointer items-center justify-center rounded-2xl border-[1.5px] border-dashed text-center ${
                                dragging ? 'border-[#ff6a1a] bg-[#fff7fb]' : 'border-[#d8d9e0] bg-gradient-to-b from-[#fcfcfd] to-[#f8f8fb]'
                            }`}
                        >
                            <div>
                                <div className="mx-auto mb-3 grid h-[52px] w-[52px] place-items-center rounded-2xl border border-[#dce8f0] bg-white text-[#555861] shadow-[0_8px_18px_rgba(20,20,40,0.05)]">
                                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.7]">
                                        <path d="M12 16V5" />
                                        <path d="M8 9l4-4 4 4" />
                                        <path d="M4 19h16" />
                                    </svg>
                                </div>
                                <h3 className="mb-1 text-[14px] font-bold">Drop multiple reels here</h3>
                                <p className="mb-3 text-[10px] text-[#8a8d95]">
                                    MP4 / MOV · 9:16 recommended · Select {selectedIds.length || 'N'} reels for a {selectedIds.length || 'N'}-account batch
                                </p>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        fileRef.current?.click();
                                    }}
                                    className="rounded-[9px] bg-brand-orange px-3.5 py-2 text-[10px] font-extrabold text-white"
                                >
                                    Choose videos
                                </button>
                            </div>
                        </div>
                    </section>
                    <aside className="rounded-[14px] border border-[#ededf1] bg-[#f4fbff] p-3.5">
                        <h3 className="mb-2.5 text-[11px] font-bold">Bulk upload rules</h3>
                        {[
                            ['1 video → 1 account.', 'A reel cannot be assigned to multiple accounts in this bulk batch.'],
                            ['1 account → 1 video.', 'The selected account is locked after it is assigned.'],
                            ['Random mapping.', 'Use Randomize to automatically shuffle reels across accounts.'],
                            ['Manual mapping.', 'You can change any row before scheduling.'],
                            ['Equal counts required.', `For ${reels.length || 10} reels, select exactly ${reels.length || 10} accounts.`],
                        ].map(([title, copy]) => (
                            <div key={title} className="mb-2 flex gap-2 text-[9px] leading-relaxed text-[#747780]">
                                <i className="mt-1 h-[7px] w-[7px] flex-none rounded-full bg-[#ff6a1a]" />
                                <div>
                                    <b className="text-brand-ink">{title}</b> {copy}
                                </div>
                            </div>
                        ))}
                    </aside>
                </div>

                <section ref={mappingSectionRef} className="mb-3.5 rounded-[18px] border border-[#dce8f0] bg-white p-4">
                    <div className="mb-3 flex items-start justify-between">
                        <div>
                            <h2 className="mb-1 text-[13px] font-bold">3. Map reels to Instagram accounts</h2>
                            <p className="m-0 text-[9px] text-[#8a8d95]">Each row represents one publishing job.</p>
                        </div>
                        <button type="button" onClick={resetMapping} className="text-[9px] font-bold text-[#be2d6b]">
                            Reset mapping
                        </button>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={randomizeMapping} className="rounded-[9px] border border-brand-orange bg-brand-orange px-2.5 py-2 text-[9px] font-bold text-white">
                            ↻ Randomize mapping
                        </button>
                        <button type="button" onClick={autoMap} className="rounded-[9px] border border-[#dce8f0] bg-white px-2.5 py-2 text-[9px] font-bold">
                            Auto map in order
                        </button>
                        <button
                            type="button"
                            onClick={() => accountSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="rounded-[9px] border border-[#ffd4e7] bg-[#e8f8fe] px-2.5 py-2 text-[9px] font-bold text-[#f05a0c]"
                        >
                            Manage accounts
                        </button>
                        <select
                            value={scheduleMode}
                            onChange={(event) => {
                                const mode = event.target.value as ScheduleMode;
                                setScheduleMode(mode);
                                applySchedule(mode);
                            }}
                            className="h-8 rounded-[9px] border border-[#dce8f0] bg-white px-2 text-[9px]"
                        >
                            <option value="same">Same schedule for all</option>
                            <option value="stagger">Stagger publishing times</option>
                            <option value="custom">Custom per reel</option>
                        </select>
                        <span className="ml-auto text-[9px] text-[#858891]">{modeText}</span>
                    </div>

                    {sameCaption && (
                        <div className="mb-3">
                            <div className="mb-1.5 flex justify-between text-[10px] font-extrabold">
                                <span>Shared caption</span>
                                <span className="font-medium text-[#a0a2aa]">{caption.length} / 2200</span>
                            </div>
                            <textarea
                                value={caption}
                                maxLength={2200}
                                onChange={(event) => setCaption(event.target.value)}
                                placeholder="Write one caption for every reel in this batch"
                                className="min-h-[72px] w-full resize-y rounded-xl border border-[#dce8f0] px-3 py-2.5 text-[11px] outline-none"
                            />
                        </div>
                    )}

                    {suggestHashtags && (
                        <div className="mb-3">
                            <div className="mb-2 flex justify-between text-[10px] font-extrabold">
                                <span>Hashtags</span>
                                <span className="font-medium text-[#a0a2aa]">Added to every reel</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {HASHTAG_SUGGESTIONS.map((tag) => {
                                    const active = hashtags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setHashtags((current) => (
                                                current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
                                            ))}
                                            className={`rounded-full px-2 py-1.5 text-[9px] ${active ? 'bg-[#e8f8fe] text-[#f05a0c]' : 'bg-[#f3f3f6] text-[#656872]'}`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
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
                                <button type="button" onClick={addHashtag} className="rounded-[9px] border border-[#dce8f0] bg-white px-2.5 text-[9px] font-bold">
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-auto rounded-[14px] border border-[#eeeef2]">
                        <table className="min-w-[820px] w-full border-collapse">
                            <thead>
                                <tr className="bg-[#f4fbff] text-left text-[8px] uppercase tracking-[0.4px] text-[#8b8d95]">
                                    <th className="border-b border-[#dce8f0] px-2.5 py-2.5">#</th>
                                    <th className="border-b border-[#dce8f0] px-2.5 py-2.5">Reel</th>
                                    <th className="border-b border-[#dce8f0] px-2.5 py-2.5">Instagram account</th>
                                    <th className="border-b border-[#dce8f0] px-2.5 py-2.5">Publish date</th>
                                    <th className="border-b border-[#dce8f0] px-2.5 py-2.5">Publish time</th>
                                    {!sameCaption && <th className="border-b border-[#dce8f0] px-2.5 py-2.5">Caption</th>}
                                    <th className="border-b border-[#dce8f0] px-2.5 py-2.5">Status</th>
                                    <th className="border-b border-[#dce8f0] px-2.5 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {reels.length === 0 ? (
                                    <tr>
                                        <td colSpan={sameCaption ? 7 : 8} className="px-3 py-6 text-center text-[11px] text-[#8a8c94]">
                                            Upload videos to create mapping rows.
                                        </td>
                                    </tr>
                                ) : reels.map((reel, index) => {
                                    const account = reel.accountId ? accountById.get(reel.accountId) : undefined;
                                    const status = rowStatus(reel);
                                    const past = isScheduleBeforeNow(reel.date, reel.time);
                                    return (
                                        <tr key={reel.id} className="border-b border-[#f0f0f3] last:border-0">
                                            <td className="px-2.5 py-2.5 text-[9px] font-extrabold text-[#8b8d95]">
                                                {String(index + 1).padStart(2, '0')}
                                            </td>
                                            <td className="px-2.5 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative h-[58px] w-[42px] flex-none rounded-lg" style={thumbStyle(reel, index)}>
                                                        <span className="absolute left-1/2 top-1/2 -translate-x-[35%] -translate-y-1/2 border-y-[6px] border-l-[8px] border-y-transparent border-l-white" />
                                                    </div>
                                                    <div>
                                                        <strong className="block max-w-[260px] truncate text-[9px]">{reel.name}</strong>
                                                        <span className="mt-0.5 block text-[8px] text-[#8b8e96]">
                                                            {reel.size ? `${formatFileSize(reel.size)} · ` : ''}
                                                            {reel.width && reel.height ? `${reel.width} × ${reel.height} · ` : ''}
                                                            {formatDuration(reel.duration)}
                                                            {reel.uploadStatus === 'uploading' ? ' · Uploading…' : ''}
                                                        </span>
                                                        {reel.uploadError && (
                                                            <span className="mt-1 block text-[8px] text-[#c23b3b]">{reel.uploadError}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2.5 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    {account && (
                                                        <div
                                                            className="h-[29px] w-[29px] flex-none rounded-full"
                                                            style={accountAvatarStyle(account, accounts.findIndex((item) => String(item.id) === reel.accountId))}
                                                        />
                                                    )}
                                                    <select
                                                        value={reel.accountId || ''}
                                                        onChange={(event) => assignAccount(reel.id, event.target.value)}
                                                        className="h-[34px] w-full rounded-lg border border-[#dce8f0] bg-white px-2 text-[9px]"
                                                    >
                                                        <option value="">Select account</option>
                                                        {selectedAccounts.map((item) => (
                                                            <option key={item.id} value={String(item.id)}>
                                                                @{item.username} · {formatCount(item.followers_count || 0)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-2.5 py-2.5">
                                                <input
                                                    type="date"
                                                    min={nowIst.date}
                                                    value={reel.date}
                                                    onChange={(event) => updateReelSchedule(reel.id, event.target.value, reel.time)}
                                                    className={`h-[34px] w-full rounded-lg border px-2 text-[9px] ${past ? 'border-[#e7b4b4]' : 'border-[#dce8f0]'}`}
                                                />
                                            </td>
                                            <td className="px-2.5 py-2.5">
                                                <input
                                                    type="time"
                                                    min={reel.date === nowIst.date ? nowIst.time : undefined}
                                                    value={reel.time}
                                                    onChange={(event) => updateReelSchedule(reel.id, reel.date, event.target.value)}
                                                    className={`h-[34px] w-full rounded-lg border px-2 text-[9px] ${past ? 'border-[#e7b4b4]' : 'border-[#dce8f0]'}`}
                                                />
                                            </td>
                                            {!sameCaption && (
                                                <td className="px-2.5 py-2.5">
                                                    <input
                                                        value={reel.caption}
                                                        onChange={(event) => setReels((current) => current.map((item) => (
                                                            item.id === reel.id ? { ...item, caption: event.target.value } : item
                                                        )))}
                                                        placeholder="Caption for this reel"
                                                        className="h-[34px] w-full min-w-[160px] rounded-lg border border-[#dce8f0] px-2 text-[9px]"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-2.5 py-2.5">
                                                <span className={`inline-block rounded-full px-2 py-1 text-center text-[8px] font-bold ${statusClass(status.kind)}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-2.5 py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeReel(reel.id)}
                                                    className="rounded-lg border border-[#dce8f0] bg-white px-2 py-1.5 text-[8px]"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="mb-3.5 grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_330px]">
                    <section className="rounded-[18px] border border-[#dce8f0] bg-white p-4">
                        <div className="mb-3">
                            <h2 className="mb-1 text-[13px] font-bold">4. Bulk publishing settings</h2>
                            <p className="m-0 text-[9px] text-[#8a8d95]">Apply common rules to every mapped job.</p>
                        </div>
                        {[
                            {
                                title: 'Randomize account assignment',
                                copy: 'Shuffle the selected accounts against the uploaded reels.',
                                on: randomizeOn,
                                toggle: () => {
                                    const next = !randomizeOn;
                                    setRandomizeOn(next);
                                    if (next && reels.length && reels.length === selectedIds.length) {
                                        mapAccounts(selectedIds, true);
                                        flashNotice('Random mapping created — every reel is assigned to a different account.');
                                    }
                                },
                            },
                            {
                                title: 'Use the same caption',
                                copy: 'Apply one caption to every reel in this batch.',
                                on: sameCaption,
                                toggle: () => setSameCaption((value) => !value),
                            },
                            {
                                title: 'Auto-suggest hashtags',
                                copy: 'Generate hashtag suggestions for each reel.',
                                on: suggestHashtags,
                                toggle: () => setSuggestHashtags((value) => !value),
                            },
                            {
                                title: 'Stop batch if one post fails',
                                copy: 'Keep later jobs from publishing if an earlier job fails.',
                                on: stopOnFail,
                                toggle: () => setStopOnFail((value) => !value),
                            },
                        ].map((option) => (
                            <div key={option.title} className="flex items-center justify-between border-b border-[#f0f0f3] py-3 last:border-0">
                                <div>
                                    <strong className="block text-[10px]">{option.title}</strong>
                                    <span className="mt-0.5 block text-[8px] text-[#8b8d95]">{option.copy}</span>
                                </div>
                                <Toggle on={option.on} onClick={option.toggle} />
                            </div>
                        ))}
                    </section>

                    <aside className="rounded-[18px] border border-[#dce8f0] bg-white p-4">
                        <h2 className="mb-3 text-[13px] font-bold">Bulk publish summary</h2>
                        <div className="my-2 flex justify-between text-[9px] text-[#777a83]">
                            <span>Videos</span>
                            <strong className="text-brand-ink">{reels.length}</strong>
                        </div>
                        <div className="my-2 flex justify-between text-[9px] text-[#777a83]">
                            <span>Accounts</span>
                            <strong className="text-brand-ink">{selectedIds.length}</strong>
                        </div>
                        <div className="my-2 flex justify-between text-[9px] text-[#777a83]">
                            <span>Publishing jobs</span>
                            <strong className="text-brand-ink">{Math.min(reels.length, selectedIds.length)}</strong>
                        </div>
                        <div className="my-2 flex justify-between text-[9px] text-[#777a83]">
                            <span>Assignment</span>
                            <strong className="text-brand-ink">1 : 1</strong>
                        </div>
                        <div className="mt-3 flex justify-between border-t border-[#eeeef2] pt-3 text-[9px] text-[#777a83]">
                            <span>Next publish</span>
                            <strong className="text-brand-ink">{nextPublish}</strong>
                        </div>
                        <button
                            type="button"
                            onClick={() => void save('scheduled')}
                            disabled={saving || !campaignReady}
                            className="mt-3.5 h-11 w-full rounded-[11px] bg-brand-orange text-[10px] font-extrabold text-white disabled:opacity-60"
                        >
                            {saveBulk.isPending ? 'Scheduling…' : `Schedule ${reels.length} reels →`}
                        </button>
                        <div className="mt-2 text-center text-[8px] leading-relaxed text-[#a0a2aa]">
                            Publishing is handled through the optional Meta connection for each selected account.
                        </div>
                    </aside>
                </div>

                <section className="rounded-[18px] border border-[#dce8f0] bg-white p-4">
                    <div className="mb-2.5 flex items-center justify-between">
                        <h2 className="m-0 text-[13px] font-bold">Bulk campaign queue</h2>
                        <span className="text-[9px] text-[#888b93]">
                            {postsLoading ? 'Loading…' : `${upcoming.length} publishing job${upcoming.length === 1 ? '' : 's'}`}
                        </span>
                    </div>
                    {reels.length > 0 && (
                        <div className="mb-2">
                            <div className="hidden border-b border-[#f0f0f3] pb-2 text-[8px] uppercase tracking-[0.4px] text-[#8b8d95] md:grid md:grid-cols-[45px_minmax(0,1.2fr)_minmax(160px,1fr)_130px_85px_70px] md:items-center md:gap-2.5">
                                <span />
                                <span>Reel</span>
                                <span>Instagram account</span>
                                <span>Schedule</span>
                                <span>Status</span>
                                <span className="text-right">Actions</span>
                            </div>
                            {reels.slice(0, 4).map((reel, index) => {
                                const account = reel.accountId ? accountById.get(reel.accountId) : undefined;
                                const accountIndex = accounts.findIndex((item) => String(item.id) === reel.accountId);
                                return (
                                    <div key={reel.id} className="grid grid-cols-[45px_minmax(0,1fr)_minmax(120px,0.9fr)] items-center gap-2.5 border-t border-[#f0f0f3] py-2.5 md:grid-cols-[45px_minmax(0,1.2fr)_minmax(160px,1fr)_130px_85px_70px]">
                                        <div className="relative h-12 rounded-lg" style={thumbStyle(reel, index)}>
                                            <span className="absolute left-1/2 top-1/2 -translate-x-[35%] -translate-y-1/2 border-y-[5px] border-l-[7px] border-y-transparent border-l-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <strong className="block truncate text-[9px]">{reel.name}</strong>
                                            <span className="mt-0.5 block text-[8px] text-[#8b8e96]">
                                                {reel.size ? `${formatFileSize(reel.size)} · ` : ''}
                                                {formatDuration(reel.duration)}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            {account ? (
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <div
                                                        className="h-7 w-7 flex-none rounded-full"
                                                        style={accountAvatarStyle(account, accountIndex)}
                                                    />
                                                    <div className="min-w-0">
                                                        <strong className="block truncate text-[9px]">@{account.username}</strong>
                                                        <span className="mt-0.5 block truncate text-[8px] text-[#8b8e96]">
                                                            {formatCount(account.followers_count || 0)} followers
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[8px] text-[#8b8e96]">Unmapped</span>
                                            )}
                                        </div>
                                        <div className="hidden md:block">
                                            <strong className="block text-[9px]">{formatIstLabel(toIstIso(reel.date, reel.time))}</strong>
                                            <span className="mt-0.5 block text-[8px] text-[#8b8e96]">IST</span>
                                        </div>
                                        <div className={`hidden rounded-full px-2 py-1 text-center text-[8px] font-bold md:block ${statusClass('queued')}`}>
                                            Queued
                                        </div>
                                        <div className="hidden text-right md:block">
                                            <button
                                                type="button"
                                                onClick={() => mappingSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                                className="rounded-lg border border-[#dce8f0] bg-white px-2 py-1.5 text-[8px]"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {upcoming.length === 0 && reels.length === 0 ? (
                        <p className="py-4 text-[11px] text-[#8a8c94]">No publishing jobs yet. Map reels 1:1 and schedule the batch.</p>
                    ) : (
                        <>
                            {reels.length === 0 && upcoming.length > 0 && (
                                <div className="hidden border-b border-[#f0f0f3] pb-2 text-[8px] uppercase tracking-[0.4px] text-[#8b8d95] md:grid md:grid-cols-[45px_minmax(0,1.2fr)_minmax(160px,1fr)_130px_85px_70px] md:items-center md:gap-2.5">
                                    <span />
                                    <span>Reel</span>
                                    <span>Instagram account</span>
                                    <span>Schedule</span>
                                    <span>Status</span>
                                    <span className="text-right">Actions</span>
                                </div>
                            )}
                            {upcoming.map((post) => {
                            const enabled = (post.targets || []).filter((target) => target.enabled);
                            const next = enabled.map((target) => target.scheduled_at).filter(Boolean).sort()[0];
                            const status = queueStatus(post);
                            const failedTarget = enabled.find((target) => target.status === 'failed');
                            return (
                                <div
                                    key={post.id}
                                    className="grid grid-cols-[45px_minmax(0,1fr)_minmax(120px,0.9fr)] items-center gap-2.5 border-t border-[#f0f0f3] py-2.5 md:grid-cols-[45px_minmax(0,1.2fr)_minmax(160px,1fr)_130px_85px_70px]"
                                >
                                    <div
                                        className="relative h-12 overflow-hidden rounded-lg bg-gradient-to-br from-[#b4c8df] via-[#5f6f9f] to-[#16181e]"
                                        style={post.thumbnail_url ? {
                                            backgroundImage: `url(${resolveAssetUrl(post.thumbnail_url)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        } : undefined}
                                    >
                                        <span className="absolute left-1/2 top-1/2 -translate-x-[35%] -translate-y-1/2 border-y-[5px] border-l-[7px] border-y-transparent border-l-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <strong className="block truncate text-[9px]">{post.original_filename || post.video_filename || 'reel.mp4'}</strong>
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
                                    <div className={`hidden rounded-full px-2 py-1 text-center text-[8px] font-bold md:block ${statusClass(status)}`}>
                                        {status}
                                    </div>
                                    <div className="hidden text-right md:block">
                                        {['draft', 'scheduled', 'failed'].includes(post.status) && (
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/creator/reel-studio?edit=${post.id}`)}
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
                </section>
            </div>
        </div>
    );
}
