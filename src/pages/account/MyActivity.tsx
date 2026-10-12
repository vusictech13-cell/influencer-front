import { useState } from 'react';
import { getApiErrorMessage } from '@/api/axios';
import { useMyActivity, type MyActivityChange } from '@/hooks/useMyActivity';

function formatWhen(value?: string | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function titleFor(action: string) {
    return action.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fieldTitle(field: string) {
    return field.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ChangeList({ changes }: { changes: MyActivityChange[] }) {
    if (!changes.length) return null;
    return (
        <div className="mt-3 space-y-2">
            {changes.map((change) => (
                <div key={change.field}>
                    <p className="text-[11px] font-bold text-[#5c6570]">{fieldTitle(change.field)}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                        {change.added.map((item) => (
                            <span key={`add-${item}`} className="rounded-full bg-[#eefbf3] px-2 py-0.5 text-[11px] font-semibold text-[#147a4b]">
                                Added {item}
                            </span>
                        ))}
                        {change.removed.map((item) => (
                            <span key={`remove-${item}`} className="rounded-full bg-[#fff1f1] px-2 py-0.5 text-[11px] font-semibold text-[#b4232c]">
                                Removed {item}
                            </span>
                        ))}
                        {!change.added.length && !change.removed.length && (change.before || change.after) && (
                            <span className="text-[12px] text-[#5c6570]">
                                {change.before || 'Not set'} → {change.after || 'Not set'}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function MyActivity() {
    const [page, setPage] = useState(1);
    const activity = useMyActivity(page);
    const items = activity.data?.items || [];
    const total = activity.data?.total || 0;
    const pages = Math.max(1, Math.ceil(total / 20));

    return (
        <div className="w-full">
            <div className="mb-5">
                <h1 className="mb-1.5 text-[31px] font-extrabold leading-[1.06] tracking-[-1.3px]">Activity</h1>
                <p className="m-0 text-[13px] text-[#777a83]">Your profile and campaign changes on this account.</p>
            </div>

            {activity.isLoading ? (
                <p className="text-sm text-[#8b8d95]">Loading your activity…</p>
            ) : activity.isError ? (
                <p className="rounded-[13px] border border-[#f3d0d0] bg-[#fff7f7] px-4 py-3 text-[12px] text-[#b4232c]">
                    {getApiErrorMessage(activity.error, 'Could not load your activity.')}
                </p>
            ) : items.length === 0 ? (
                <div className="rounded-[18px] border border-[#dce8f0] bg-white px-5 py-10 text-center text-sm text-[#8b8d95]">
                    No activity yet. Profile and campaign changes you make will show up here.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <article key={item.id} className="rounded-[18px] border border-[#dce8f0] bg-white px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-bold text-[#1c1e21]">{item.description || titleFor(item.action)}</p>
                                <p className="shrink-0 text-[11px] text-[#8b8d95]">{formatWhen(item.createdAt)}</p>
                            </div>
                            <ChangeList changes={item.changes} />
                        </article>
                    ))}
                </div>
            )}

            {total > 20 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                        className="rounded-full border border-[#dce8f0] bg-white px-4 py-2 text-xs font-bold disabled:opacity-40"
                    >
                        Newer
                    </button>
                    <span className="text-[12px] text-[#8b8d95]">{page} of {pages}</span>
                    <button
                        type="button"
                        disabled={page >= pages}
                        onClick={() => setPage((current) => current + 1)}
                        className="rounded-full border border-[#dce8f0] bg-white px-4 py-2 text-xs font-bold disabled:opacity-40"
                    >
                        Older
                    </button>
                </div>
            )}
        </div>
    );
}
