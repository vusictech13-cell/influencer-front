import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSaveOnboarding } from '@/hooks/useOnboarding';
import { useAuthUser } from '@/hooks/useAuthUser';
import { getApiErrorMessage } from '@/api/axios';
import {
    CONTENT_CATEGORIES,
    LANGUAGES,
    LOCATIONS,
    creatorTypeLabel,
} from '@/constants/onboarding';
import { computeProfileStrength, hasCreatorRates } from '@/utils/creator';
import { useInstagramAccount } from '@/hooks/useSocialAccounts';
import type { CreatorRates, OnboardingData } from '@/utils/auth';

function FieldLabel({ children }: { children: string }) {
    return <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[1.1px] text-[#8b8d95]">{children}</label>;
}

function Chip({
    selected,
    children,
    onClick,
}: {
    selected: boolean;
    children: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                selected ? 'bg-brand-orange text-white' : 'border border-[#dce8f0] bg-white text-[#6f727b]'
            }`}
        >
            {children}
        </button>
    );
}

export default function CreatorProfile() {
    const navigate = useNavigate();
    const { data: user } = useAuthUser();
    const { instagram } = useInstagramAccount();
    const saveOnboarding = useSaveOnboarding();
    const current = user?.onboarding_data;

    const [location, setLocation] = useState(current?.location || '');
    const [categories, setCategories] = useState<string[]>(current?.contentCategories || []);
    const [languages, setLanguages] = useState<string[]>(current?.languages || []);
    const [rates, setRates] = useState<CreatorRates>({
        reel: current?.rates?.reel,
        story: current?.rates?.story,
        post: current?.rates?.post,
    });
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!current) return;
        setLocation(current.location || '');
        setCategories(current.contentCategories || []);
        setLanguages(current.languages || []);
        setRates({
            reel: current.rates?.reel,
            story: current.rates?.story,
            post: current.rates?.post,
        });
    }, [current]);

    useEffect(() => {
        if (window.location.hash === '#rates') {
            document.getElementById('rates')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    const hasRates = hasCreatorRates(rates);
    const strength = computeProfileStrength({
        connected: Boolean(instagram),
        creatorType: current?.creatorType,
        categories: categories.length,
        opportunities: current?.opportunities?.length,
        location,
        languages: languages.length,
        earningGoal: current?.earningGoal,
        rates: hasRates,
    });

    const payload: OnboardingData = useMemo(
        () => ({
            ...current,
            location: location || undefined,
            contentCategories: categories,
            languages,
            rates: {
                reel: Number(rates.reel) || undefined,
                story: Number(rates.story) || undefined,
                post: Number(rates.post) || undefined,
            },
        }),
        [categories, current, languages, location, rates],
    );

    const toggle = (list: string[], value: string, setter: (next: string[]) => void) => {
        setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
        setSaved(false);
    };

    const save = async () => {
        setError('');
        try {
            await saveOnboarding.mutateAsync({ data: payload, completed: true });
            setSaved(true);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Could not save profile'));
        }
    };

    return (
        <div className="mx-auto max-w-[1420px]">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-1.5 text-[31px] font-extrabold leading-[1.06] tracking-[-1.3px]">Profile</h1>
                    <p className="m-0 text-[13px] text-[#777a83]">
                        Keep this current so brands can match you with the right campaigns.
                    </p>
                </div>
                <div className="rounded-[13px] border border-[#dce8f0] bg-white px-3 py-2 text-xs">
                    Profile strength <strong className="text-[#ff6a1a]">{strength}%</strong>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_.85fr]">
                <div className="space-y-4">
                    <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                        <FieldLabel>Creator type</FieldLabel>
                        <p className="text-sm font-bold">{creatorTypeLabel(current?.creatorType)}</p>
                        <p className="mt-1 text-[11px] text-[#8b8d95]">
                            {instagram ? `@${instagram.username}` : 'Connect Instagram from Home to complete matching.'}
                        </p>
                    </div>

                    <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                        <FieldLabel>Location</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                            {LOCATIONS.map((item) => (
                                <Chip key={item} selected={location === item} onClick={() => { setLocation(item); setSaved(false); }}>
                                    {item}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                        <FieldLabel>Content categories</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                            {CONTENT_CATEGORIES.map((item) => (
                                <Chip key={item} selected={categories.includes(item)} onClick={() => toggle(categories, item, setCategories)}>
                                    {item}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                        <FieldLabel>Languages</FieldLabel>
                        <div className="flex flex-wrap gap-2">
                            {LANGUAGES.map((item) => (
                                <Chip key={item} selected={languages.includes(item)} onClick={() => toggle(languages, item, setLanguages)}>
                                    {item}
                                </Chip>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div id="rates" className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                        <FieldLabel>Collaboration rates</FieldLabel>
                        <p className="mb-4 text-[11px] text-[#8b8d95]">
                            These rates help TapnLike estimate your earning potential for brands.
                        </p>
                        {[
                            { key: 'reel' as const, label: 'Reel' },
                            { key: 'story' as const, label: 'Story' },
                            { key: 'post' as const, label: 'Post' },
                        ].map((item) => (
                            <label key={item.key} className="mb-3 block">
                                <span className="mb-1 block text-[11px] font-bold text-[#6f727b]">{item.label} rate (₹)</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={rates[item.key] ?? ''}
                                    onChange={(event) => {
                                        setRates((prev) => ({ ...prev, [item.key]: Number(event.target.value) || undefined }));
                                        setSaved(false);
                                    }}
                                    className="h-11 w-full rounded-xl border border-[#dce8f0] px-3 text-sm outline-none focus:border-[#ff6a1a]"
                                    placeholder="0"
                                />
                            </label>
                        ))}
                    </div>

                    <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
                        {saved && <p className="mb-3 text-xs text-[#168d58]">Profile saved.</p>}
                        <button
                            type="button"
                            onClick={save}
                            disabled={saveOnboarding.isPending}
                            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-brand-orange py-3 text-[12px] font-extrabold text-white disabled:opacity-60"
                        >
                            {saveOnboarding.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save profile'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/creator/media-kit')}
                            className="mt-2 w-full rounded-[10px] border border-[#dce8f0] py-3 text-[12px] font-bold"
                        >
                            Preview media kit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
