import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Check,
    Instagram,
    Lock,
    LogOut,
    Shield,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchDropdown } from '@/components/ui/SearchDropdown';
import Logo from '@/components/marketing/Logo';
import { formatCount } from '@/utils/creator';
import { getApiErrorMessage } from '@/api/axios';
import { getInstagramOAuthErrorMessage, clearInstagramOAuthSearchParams } from '@/utils/socialAccounts';
import { getRoleDashboardPath, getStoredUser, logout, needsOnboarding, type OnboardingData } from '@/utils/auth';
import { useSaveOnboarding } from '@/hooks/useOnboarding';
import { useLanguages, useLocations } from '@/hooks/useCatalog';
import { useConnectInstagram, useInstagramAccount, useSyncAccount } from '@/hooks/useSocialAccounts';
import {
    CONTENT_CATEGORIES,
    CREATOR_TYPES,
    ONBOARDING_FLOW,
    creatorTypeLabel,
} from '@/constants/onboarding';

const emptyData: OnboardingData = {
    creatorType: undefined,
    contentCategories: [],
    opportunities: [],
    brandInterests: [],
    location: undefined,
    languages: [],
    earningGoal: 'max_earn',
};

function ChoiceCard({
    selected,
    icon: Icon,
    title,
    desc,
    onClick,
}: {
    selected: boolean;
    icon: ComponentType<{ size?: number; className?: string }>;
    title: string;
    desc: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex min-h-[60px] items-center gap-3 rounded-2xl border bg-white px-3.5 py-3.5 text-left transition hover:-translate-y-px sm:min-h-[68px] sm:px-[18px] sm:py-[17px]',
                selected
                    ? 'border-[#ff6a1a] bg-[#eef7fc] shadow-[0_0_0_2px_rgba(255,106,26,0.07)]'
                    : 'border-[#dce8f0] hover:border-[#d7d7df]',
            )}
        >
            <div
                className={cn(
                    'grid h-9 w-9 flex-none place-items-center rounded-[11px]',
                    selected ? 'bg-white text-[#ff6a1a]' : 'bg-[#f4f4f7] text-[#4b4d55]',
                )}
            >
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <div className="text-sm font-bold text-brand-ink">{title}</div>
                <div className="mt-0.5 text-xs text-[#8a8c94]">{desc}</div>
            </div>
            <div
                className={cn(
                    'ml-auto grid h-5 w-5 flex-none place-items-center rounded-full border text-[11px]',
                    selected ? 'border-[#ff6a1a] bg-[#ff6a1a] text-white' : 'border-[#d7d7df] text-transparent',
                )}
            >
                ✓
            </div>
        </button>
    );
}

type ChipRect = { left: number; top: number; width: number; height: number };

type CategoryFlight = {
    id: number;
    label: string;
    from: ChipRect;
    to: ChipRect | null;
    run: boolean;
};

function chipRect(el: HTMLElement): ChipRect {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ContentCategoryPicker({
    selected,
    onChange,
    limit = 5,
}: {
    selected: string[];
    onChange: (updater: (current: string[]) => string[]) => void;
    limit?: number;
}) {
    const [flights, setFlights] = useState<CategoryFlight[]>([]);
    const [leaving, setLeaving] = useState<string[]>([]);
    const [returning, setReturning] = useState<string | null>(null);
    const destRefs = useRef(new Map<string, HTMLButtonElement>());
    const flightId = useRef(0);
    const limitReached = selected.length >= limit;
    const arriving = new Set(flights.map((flight) => flight.label));

    const selectCategory = (label: string, el: HTMLButtonElement) => {
        if (limitReached || selected.includes(label)) return;
        if (prefersReducedMotion()) {
            onChange((current) => (current.includes(label) || current.length >= limit ? current : [...current, label]));
            return;
        }
        const id = ++flightId.current;
        setFlights((prev) => [...prev, { id, label, from: chipRect(el), to: null, run: false }]);
        onChange((current) => (current.includes(label) || current.length >= limit ? current : [...current, label]));
    };

    useLayoutEffect(() => {
        let changed = false;
        const next = flights.map((flight) => {
            if (flight.to) return flight;
            const node = destRefs.current.get(flight.label);
            if (!node) return flight;
            changed = true;
            return { ...flight, to: chipRect(node) };
        });
        if (changed) setFlights(next);
    }, [flights]);

    useEffect(() => {
        if (!flights.some((flight) => flight.to && !flight.run)) return;
        const frame = requestAnimationFrame(() => {
            setFlights((prev) => prev.map((flight) => (flight.to && !flight.run ? { ...flight, run: true } : flight)));
        });
        return () => cancelAnimationFrame(frame);
    }, [flights]);

    useEffect(() => {
        if (!flights.length) return;
        const timer = window.setTimeout(() => setFlights([]), 1100);
        return () => window.clearTimeout(timer);
    }, [flights]);

    const deselectCategory = (label: string) => {
        if (leaving.includes(label)) return;
        if (prefersReducedMotion()) {
            onChange((current) => current.filter((item) => item !== label));
            return;
        }
        setLeaving((prev) => (prev.includes(label) ? prev : [...prev, label]));
    };

    const finishLeave = (label: string) => {
        onChange((current) => current.filter((item) => item !== label));
        setLeaving((prev) => prev.filter((item) => item !== label));
        setReturning(label);
    };

    return (
        <>
            {selected.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {selected.map((item) => (
                        <button
                            key={item}
                            type="button"
                            ref={(node) => {
                                if (node) destRefs.current.set(item, node);
                                else destRefs.current.delete(item);
                            }}
                            onClick={() => deselectCategory(item)}
                            onAnimationEnd={(event) => {
                                if (event.animationName === 'category-chip-out') finishLeave(item);
                            }}
                            className={cn(
                                'rounded-full border border-[#ff6a1a] bg-[#e8f8fe] px-3 py-2 text-[13px] font-bold text-[#f05a0c] sm:px-3.5 sm:py-2.5',
                                arriving.has(item) && 'pointer-events-none invisible',
                                leaving.includes(item) && 'category-chip-out',
                            )}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
            <Progress value={42} />
            <div className="mb-4 flex flex-wrap gap-2">
                {CONTENT_CATEGORIES.filter((item) => !selected.includes(item)).map((item) => (
                    <button
                        key={item}
                        type="button"
                        disabled={limitReached}
                        onClick={(event) => selectCategory(item, event.currentTarget)}
                        onAnimationEnd={() => {
                            if (returning === item) setReturning(null);
                        }}
                        className={cn(
                            'rounded-full border border-[#dce8f0] bg-white px-3 py-2 text-[13px] sm:px-3.5 sm:py-2.5',
                            limitReached && 'cursor-not-allowed opacity-40',
                            returning === item && 'category-chip-return',
                        )}
                    >
                        {item}
                    </button>
                ))}
            </div>
            {createPortal(
                flights.map((flight) => (
                    <span
                        key={flight.id}
                        aria-hidden="true"
                        onAnimationEnd={(event) => {
                            if (event.animationName === 'category-chip-fly') {
                                setFlights((prev) => prev.filter((item) => item.id !== flight.id));
                            }
                        }}
                        className={cn(
                            'pointer-events-none fixed z-[80] box-border inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#dce8f0] bg-white px-3 text-[13px] font-bold text-[#1c1c1c] sm:px-3.5',
                            flight.run && flight.to && 'category-chip-fly',
                        )}
                        style={(() => {
                            if (!flight.run || !flight.to) {
                                return {
                                    left: flight.from.left,
                                    top: flight.from.top,
                                    width: flight.from.width,
                                    height: flight.from.height,
                                };
                            }
                            const sx = flight.to.width ? flight.from.width / flight.to.width : 1;
                            const sy = flight.to.height ? flight.from.height / flight.to.height : 1;
                            const invX = flight.from.left - flight.to.left - (flight.to.width * (1 - sx)) / 2;
                            const invY = flight.from.top - flight.to.top - (flight.to.height * (1 - sy)) / 2;
                            return {
                                left: flight.to.left,
                                top: flight.to.top,
                                width: flight.to.width,
                                height: flight.to.height,
                                ['--inv-x' as string]: `${invX}px`,
                                ['--inv-y' as string]: `${invY}px`,
                                ['--inv-sx' as string]: String(sx),
                                ['--inv-sy' as string]: String(sy),
                            };
                        })()}
                    >
                        {flight.label}
                    </span>
                )),
                document.body,
            )}
        </>
    );
}

function PrimaryButton({
    children,
    onClick,
    disabled,
    className,
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'rounded-xl bg-brand-orange px-4 py-3 text-sm font-bold text-white transition hover:bg-[#25262b] disabled:cursor-not-allowed disabled:opacity-45 sm:px-5 sm:py-3.5',
                className,
            )}
        >
            {children}
        </button>
    );
}

function SecondaryButton({ children, onClick, className }: { children: ReactNode; onClick: () => void; className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'w-full rounded-xl bg-[#f1f1f5] px-4 py-3 text-sm font-bold text-[#333] transition hover:bg-[#e8e8ee] sm:w-auto sm:px-5 sm:py-3.5',
                className,
            )}
        >
            {children}
        </button>
    );
}

function ActionRow({ children }: { children: ReactNode }) {
    return <div className="flex flex-col-reverse gap-2.5 sm:flex-row">{children}</div>;
}

function Progress({ value }: { value: number }) {
    return (
        <div className="mb-5 h-[5px] overflow-hidden rounded-full bg-[#eeeef3] sm:mb-[30px]">
            <span
                className="block h-full rounded-full bg-[linear-gradient(90deg,#ff6a1a,#ff8a3d)] transition-all"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function mapSavedStep(saved: number) {
    if (saved <= 1) return 1;
    if (saved >= ONBOARDING_FLOW.length) return ONBOARDING_FLOW.length;
    return saved;
}

function InfoList({
    items,
}: {
    items: { icon: ComponentType<{ size?: number }>; title: string; body: string }[];
}) {
    return (
        <ul className="m-0 list-none rounded-[18px] border border-[#dce8f0] bg-[#fbfbfd] px-3.5 py-1 sm:px-5">
            {items.map((item, index) => (
                <li
                    key={item.title}
                    className={cn('flex items-start gap-3 py-2.5', index > 0 && 'border-t border-[#ededf1]')}
                >
                    <div className="grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-[#eaf9f1] text-[#168d58]">
                        <item.icon size={15} />
                    </div>
                    <div>
                        <strong className="mb-0.5 block text-xs text-brand-ink">{item.title}</strong>
                        <span className="block text-[12px] leading-relaxed text-[#858891]">{item.body}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
}

const INSTAGRAM_SECURITY = [
    {
        icon: Shield,
        title: 'Official Instagram Login',
        body: 'Securely connect through Instagram.',
    },
    {
        icon: Lock,
        title: 'No password access',
        body: 'We never see or store your Instagram password.',
    },
    {
        icon: SlidersHorizontal,
        title: 'You control the connection',
        body: 'Choose the permissions you want to approve.',
    },
];

const headingClass =
    'mb-2.5 text-[25px] font-extrabold leading-[1.12] tracking-[-1.1px] sm:mb-3 sm:text-[31px] sm:leading-[1.08] sm:tracking-[-1.7px] lg:text-[30px]';
const bodyClass = 'mb-2 text-sm leading-relaxed text-[#70727b] sm:mb-7 sm:text-sm';

function profileStrength(data: OnboardingData, connected: boolean) {
    let score = 0;
    if (connected) score += 40;
    if (data.creatorType) score += 10;
    if ((data.contentCategories?.length || 0) > 0) score += 15;
    if ((data.opportunities?.length || 0) > 0) score += 10;
    if (data.location) score += 10;
    if ((data.languages?.length || 0) > 0) score += 10;
    if (data.earningGoal) score += 5;
    return score;
}

export default function Onboarding() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const stored = getStoredUser();
    const saveOnboarding = useSaveOnboarding();
    const [cityQuery, setCityQuery] = useState('');
    const { data: locationOptions = [], isFetching: locationsLoading } = useLocations(cityQuery);
    const { data: languageOptions = [], isLoading: languagesLoading } = useLanguages();
    const { instagram } = useInstagramAccount();
    const { mutate: connectInstagram, isPending: isConnecting } = useConnectInstagram('onboarding');
    const { data: syncData } = useSyncAccount(instagram?.id);

    const oauthError = getInstagramOAuthErrorMessage(
        searchParams.get('error'),
        searchParams.get('error_description'),
    );
    const oauthSuccess = searchParams.get('success') === 'connected';

    const [step, setStep] = useState(() => (oauthError ? 3 : mapSavedStep(stored?.onboarding_step || 1)));
    const [data, setData] = useState<OnboardingData>({
        ...emptyData,
        ...(stored?.onboarding_data || {}),
    });
    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(oauthError);

    useEffect(() => {
        if (!oauthSuccess && !oauthError) return;
        if (oauthSuccess) {
            setConnectError(null);
            setStep(4);
            saveOnboarding.mutate({ step: 4, data });
        } else {
            setConnecting(false);
            setConnectError(oauthError);
            setStep(3);
        }
        clearInstagramOAuthSearchParams(searchParams);
        setSearchParams(searchParams, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [oauthSuccess, oauthError]);

    const followers = syncData?.profile?.followers_count ?? instagram?.followers_count ?? 0;
    const engagement = syncData?.engagement_rate ?? instagram?.engagement_rate ?? 0;
    const displayName = syncData?.profile?.name || instagram?.display_name || instagram?.username || stored?.name;
    const username = instagram?.username;
    const strength = profileStrength(data, !!instagram);
    const avatarUrl = instagram?.profile_image || stored?.profile_image;
    const profileMeta = [
        instagram ? `${formatCount(followers)} followers` : null,
        data.creatorType ? creatorTypeLabel(data.creatorType, data.creatorTypeOther) : null,
        data.location || data.contentCategories?.[0],
    ]
        .filter(Boolean)
        .join(' · ');

    if (!stored) {
        return <Navigate to="/login" replace />;
    }
    if (stored.role !== 'creator') {
        return <Navigate to={getRoleDashboardPath(stored.role)} replace />;
    }
    if (!needsOnboarding(stored) && stored.onboarding_completed) {
        return <Navigate to="/creator/dashboard" replace />;
    }

    const go = async (next: number, extra?: OnboardingData, completed = false) => {
        const nextData = { ...data, ...extra };
        setData(nextData);
        setStep(next);
        await saveOnboarding.mutateAsync({ step: next, data: nextData, completed });
        if (completed) {
            navigate('/creator/dashboard', { replace: true });
        }
    };

    const startInstagram = () => {
        setConnecting(true);
        setConnectError(null);
        saveOnboarding.mutate({ step: 3, data });
        connectInstagram(undefined, {
            onError: (err) => {
                setConnecting(false);
                setConnectError(getApiErrorMessage(err, 'Could not start Instagram connection. Please try again.'));
            },
        });
    };

    const firstName = (stored.name || 'there').trim().split(/\s+/)[0];
    const displayStep = Math.max(1, ONBOARDING_FLOW.findIndex((item) => item.step === step) + 1);
    const creatorReady = Boolean(
        data.creatorType && (data.creatorType !== 'other' || data.creatorTypeOther?.trim()),
    );

    return (
        <div className="min-h-screen bg-white font-jakarta text-brand-ink sm:bg-brand-lightbg">
            <div className="mx-auto w-full max-w-[1180px] px-0 py-0 sm:px-7 sm:py-7">
                <div className="mb-4 flex items-center justify-between gap-3 px-4 pt-4 sm:mb-6 sm:px-0 sm:pt-0">
                    <Logo className="text-[1.2rem] text-brand-ink" />
                    <p className="hidden flex-1 px-4 text-center text-xs leading-relaxed text-[#777] lg:block">
                        Takes about <b className="font-semibold text-[#333]">2 minutes</b>.
                        {' '}Most information will be filled automatically from Instagram.
                    </p>
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="rounded-full border border-[#dce8f0] bg-white px-3 py-1.5 text-xs text-[#777] sm:px-3.5 sm:py-2 sm:text-[13px]">
                            Step {displayStep} of {ONBOARDING_FLOW.length}
                        </div>
                        <button
                            type="button"
                            onClick={() => logout(navigate)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#dce8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#555] transition hover:border-[#ff6a1a] hover:bg-[#eef7fc] hover:text-[#ff6a1a] sm:px-3.5 sm:py-2 sm:text-[13px]"
                        >
                            <LogOut size={13} />
                            Log out
                        </button>
                    </div>
                </div>

                <div className="grid min-h-0 overflow-hidden border-0 bg-white shadow-none sm:min-h-[720px] sm:rounded-3xl sm:border sm:border-[#e7e7ed] sm:shadow-[0_18px_60px_rgba(20,20,40,0.07)] lg:grid-cols-[250px_1fr]">
                    <aside className="hidden flex-col border-r border-[#ededf2] bg-[#f4fbff] px-5 py-7 lg:flex">
                        <p className="mb-[18px] ml-2.5 mt-1 text-xs uppercase tracking-[1px] text-[#999]">
                            Creator onboarding
                        </p>
                        {ONBOARDING_FLOW.map((item, index) => {
                            const number = index + 1;
                            const active = item.step === step;
                            const done = item.step < step;
                            return (
                                <div
                                    key={item.label}
                                    className={cn(
                                        'mb-1.5 flex items-center gap-3 rounded-xl px-2.5 py-3 text-sm',
                                        active ? 'bg-[#e8f8fe] text-[#111]' : done ? 'text-[#333]' : 'text-[#8a8c94]',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'grid h-[27px] w-[27px] place-items-center rounded-full text-xs font-bold',
                                            active
                                                ? 'bg-[#ff6a1a] text-white'
                                                : done
                                                    ? 'bg-[#e9f8f0] text-[#15945a]'
                                                    : 'bg-[#ececf2] text-[#8a8c94]',
                                        )}
                                    >
                                        {done ? '✓' : number}
                                    </span>
                                    {item.label}
                                </div>
                            );
                        })}
                        <div className="mt-auto border-t border-[#ededf2] pt-5">
                            {(stored.email || stored.name) && (
                                <p
                                    className="mb-1.5 truncate px-2.5 text-xs text-[#8a8c94]"
                                    title={stored.email || stored.name}
                                >
                                    {stored.email || stored.name}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => logout(navigate)}
                                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-semibold text-[#555] transition hover:bg-[#e8f8fe] hover:text-[#ff6a1a]"
                            >
                                <LogOut size={15} />
                                Log out
                            </button>
                        </div>
                    </aside>

                    <main className="flex items-start justify-center px-4 py-6 pb-10 sm:px-10 sm:py-8 lg:px-16">
                        <div className="w-full max-w-[650px]">
                            {step === 1 && (
                                <>
                                    <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[1.5px] text-[#ff6a1a]">
                                        Hi, {firstName}
                                    </p>
                                    {/* <h1 className={headingClass}>
                                        Let's build your creator profile.
                                    </h1>
                                    <p className={bodyClass}>
                                        A few quick questions help us match you with better brands, campaigns and opportunities.
                                    </p> */}
                                    <h2 className={headingClass}>
                                        What best describes you?
                                    </h2>
                                    <p className={bodyClass}>
                                        Choose the option that fits your creator identity.
                                    </p>
                                    <Progress value={28} />
                                    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', data.creatorType === 'other' ? 'mb-4' : 'mb-7')}>
                                        {CREATOR_TYPES.map((item) => (
                                            <ChoiceCard
                                                key={item.id}
                                                selected={data.creatorType === item.id}
                                                icon={item.icon}
                                                title={item.title}
                                                desc={item.desc}
                                                onClick={() => setData({
                                                    ...data,
                                                    creatorType: item.id,
                                                    creatorTypeOther: item.id === 'other' ? data.creatorTypeOther : '',
                                                })}
                                            />
                                        ))}
                                    </div>
                                    {data.creatorType === 'other' && (
                                        <input
                                            value={data.creatorTypeOther || ''}
                                            onChange={(event) => setData({ ...data, creatorTypeOther: event.target.value })}
                                            placeholder="Add your category"
                                            className="mb-7 w-full rounded-xl border border-[#dce8f0] px-3.5 py-3 text-sm outline-none focus:border-[#ff6a1a]"
                                        />
                                    )}
                                    <PrimaryButton className="w-full sm:w-auto" disabled={!creatorReady} onClick={() => go(2)}>
                                        Continue →
                                    </PrimaryButton>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[1.5px] text-[#ff6a1a]">So, {firstName}</p>
                                    <h1 className={headingClass}>
                                        What do you create?
                                    </h1>
                                    <p className={bodyClass}>
                                        Pick up to 5 categories. This helps brands find the right creators.
                                    </p>
                                    <ContentCategoryPicker
                                        selected={data.contentCategories || []}
                                        onChange={(updater) => setData((prev) => ({
                                            ...prev,
                                            contentCategories: updater(prev.contentCategories || []),
                                        }))}
                                    />
                                    <p className="mb-6 text-xs text-[#8b8d96]">
                                        {data.contentCategories?.length || 0} of 5 selected
                                    </p>
                                    <ActionRow>
                                        <SecondaryButton onClick={() => setStep(1)}>Back</SecondaryButton>
                                        <PrimaryButton
                                            className="w-full sm:flex-1"
                                            disabled={!data.contentCategories?.length}
                                            onClick={() => go(3)}
                                        >
                                            Continue →
                                        </PrimaryButton>
                                    </ActionRow>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[1.5px] text-[#ff6a1a]">
                                        Connect account
                                    </p>
                                    <h1 className={headingClass}>
                                        Connect Instagram.<br />
                                        Get discovered. Get paid.
                                    </h1>
                                    <p className={bodyClass}>
                                        Connect your Instagram Creator or Business account to join campaigns and earn rewards.
                                    </p>
                                    {connectError && (
                                        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3">
                                            <p className="text-sm font-medium text-red-600">{connectError}</p>
                                            <p className="mt-1.5 text-xs leading-relaxed text-[#8b8d96]">
                                                {/already connected|another (user|account)/i.test(connectError)
                                                    ? 'This Instagram is linked to a different TapnLike account. '
                                                    : 'If this account has an issue, '}
                                                <button
                                                    type="button"
                                                    onClick={() => logout(navigate)}
                                                    className="font-bold text-[#ff6a1a] underline-offset-2 hover:underline"
                                                >
                                                    log out
                                                </button>
                                                {' '}and sign in with another account, or try a different Instagram.
                                            </p>
                                        </div>
                                    )}
                                    <div className="mb-5 flex items-center gap-3 rounded-[19px] border border-[#dce8f0] p-3.5 sm:gap-4 sm:p-4">
                                        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-brand-orange text-white sm:h-[54px] sm:w-[54px]">
                                            <Instagram size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-bold sm:text-base">
                                                <span className="truncate">{instagram ? `@${instagram.username}` : 'Instagram'}</span>
                                                {instagram && (
                                                    <span className="rounded-full bg-[#eaf9f1] px-2 py-1 text-xs font-bold text-[#168d58]">
                                                        ✓ Connected
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 text-[13px] text-[#858791]">
                                                Secure creator account connection
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold">
                                        <ShieldCheck size={14} className="text-[#168d58]" />
                                        Safe & Secure
                                    </p>
                                    <div className="mb-7">
                                        <InfoList items={INSTAGRAM_SECURITY} />
                                    </div>
                                    <ActionRow>
                                        <SecondaryButton onClick={() => setStep(2)}>Back</SecondaryButton>
                                        <PrimaryButton
                                            className="w-full sm:flex-1"
                                            disabled={!instagram && (isConnecting || connecting)}
                                            onClick={() => (instagram ? go(4) : startInstagram())}
                                        >
                                            {instagram
                                                ? 'Continue →'
                                                : isConnecting || connecting
                                                    ? 'Opening Instagram...'
                                                    : 'Connect Instagram →'}
                                        </PrimaryButton>
                                    </ActionRow>
                                    <p className="mt-4 text-xs leading-relaxed text-[#8b8d96]">
                                        Powered by Instagram Login. We only access the creator information you approve.
                                    </p>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[1.5px] text-[#ff6a1a]">
                                        Your creator goals
                                    </p>
                                    <h1 className={headingClass}>
                                        Let's find the right opportunities for you.
                                    </h1>
                                    <p className={bodyClass}>
                                        Now that we know your content, tell us what you want to achieve. We’ll use your profile to match you with campaigns that fit your audience and creator style.
                                    </p>
                                    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[19px] border border-[#e2e3e9] bg-white px-3.5 py-3 sm:mb-7 sm:gap-[13px] sm:px-[17px] sm:py-3.5">
                                        <div
                                            className="h-11 w-11 flex-none overflow-hidden rounded-full bg-[linear-gradient(135deg,#222,#999)] bg-cover bg-center sm:h-[47px] sm:w-[47px]"
                                            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[15px] font-bold">
                                                {username ? `@${username}` : displayName || '@yourusername'}
                                            </div>
                                            {profileMeta && (
                                                <div className="mt-1 truncate text-sm font-semibold text-[#5c6570]">{profileMeta}</div>
                                            )}
                                        </div>
                                        <div className="w-full text-[13px] font-bold text-[#ee3c89] sm:ml-auto sm:w-auto">
                                            ✓ Instagram connected
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="mb-2.5 block text-[13px] font-bold">Where are you based?</label>
                                        <SearchDropdown
                                            options={locationOptions.map((item) => item.name)}
                                            value={data.location || ''}
                                            placeholder="Search for a city"
                                            searching={locationsLoading}
                                            onSearch={setCityQuery}
                                            onChange={(value) => setData({ ...data, location: String(value) })}
                                        />
                                    </div>
                                    <div className="mb-8">
                                        <label className="mb-2.5 block text-[13px] font-bold">What languages do you create in?</label>
                                        <SearchDropdown
                                            multiple
                                            options={languageOptions.map((item) => item.name)}
                                            value={data.languages || []}
                                            placeholder={languagesLoading ? 'Loading languages...' : 'Select languages'}
                                            onChange={(value) => setData({ ...data, languages: value as string[] })}
                                        />
                                    </div>
                                    <ActionRow>
                                        <SecondaryButton onClick={() => setStep(3)}>Back</SecondaryButton>
                                        <PrimaryButton
                                            className="w-full sm:flex-1"
                                            disabled={!data.location || !data.languages?.length}
                                            onClick={() => go(5)}
                                        >
                                            Create my profile →
                                        </PrimaryButton>
                                    </ActionRow>
                                </>
                            )}

                            {step === 5 && (
                                <div className="text-center">
                                    <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[#eaf9f1] text-[#15945a] sm:mb-[22px] sm:h-[78px] sm:w-[78px]">
                                        <Check size={28} />
                                    </div>
                                    <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[1.5px] text-[#ff6a1a]">
                                        Your TapnLike profile
                                    </p>
                                    <h1 className={headingClass}>
                                        You're ready to be discovered.
                                    </h1>
                                    <p className={bodyClass}>
                                        We've combined your answers with your Instagram data to build your creator profile.
                                    </p>
                                    <div className="mb-4 rounded-[20px] border border-[#dce8f0] p-3.5 text-left sm:p-5">
                                        <div className="flex items-center gap-3 sm:gap-3.5">
                                            <div
                                                className="h-11 w-11 flex-none rounded-full bg-[linear-gradient(145deg,#15161b,#6b6d77)] bg-cover bg-center sm:h-[54px] sm:w-[54px]"
                                                style={
                                                    instagram?.profile_image
                                                        ? { backgroundImage: `url(${instagram.profile_image})` }
                                                        : undefined
                                                }
                                            />
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-bold sm:text-base">
                                                    <span className="truncate">{username ? `@${username}` : displayName || 'Your profile'}</span>
                                                    {instagram && (
                                                        <span className="rounded-full bg-[#eaf9f1] px-2 py-1 text-xs font-bold text-[#168d58]">
                                                            ✓ Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 text-[13px] text-[#858791]">
                                                    {creatorTypeLabel(data.creatorType, data.creatorTypeOther)}
                                                    {data.contentCategories?.length
                                                        ? ` · ${data.contentCategories.slice(0, 2).join(' · ')}`
                                                        : ''}
                                                    {' · Brand ready'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:mt-[18px] sm:gap-3">
                                            <div className="rounded-[14px] bg-brand-lightbg p-3 sm:p-3.5">
                                                <strong className="block text-[13px]">{instagram ? formatCount(followers) : '—'}</strong>
                                                <span className="text-xs text-[#858791]">Followers</span>
                                            </div>
                                            <div className="rounded-[14px] bg-brand-lightbg p-3 sm:p-3.5">
                                                <strong className="block text-[13px]">
                                                    {instagram ? `${engagement.toFixed(1)}%` : '—'}
                                                </strong>
                                                <span className="text-xs text-[#858791]">Engagement</span>
                                            </div>
                                            <div className="rounded-[14px] bg-brand-lightbg p-3 sm:p-3.5">
                                                <strong className="block text-[13px]">{data.location || 'India'}</strong>
                                                <span className="text-xs text-[#858791]">Primary market</span>
                                            </div>
                                            <div className="rounded-[14px] bg-brand-lightbg p-3 sm:p-3.5">
                                                <strong className="block text-[13px]">
                                                    {data.languages?.length ? data.languages.slice(0, 2).join(' + ') : '—'}
                                                </strong>
                                                <span className="text-xs text-[#858791]">Content languages</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-[19px] border border-[#dce8f0] p-3.5 text-left sm:p-5">
                                        <div className="mb-2.5 flex items-center justify-between">
                                            <strong className="text-sm">Profile strength</strong>
                                            <b className="text-sm text-[#ff6a1a]">{strength}%</b>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-[#eeeef3]">
                                            <span
                                                className="block h-full rounded-full bg-[linear-gradient(90deg,#ff6a1a,#ff8a3d)]"
                                                style={{ width: `${strength}%` }}
                                            />
                                        </div>
                                        <p className="mt-3 text-xs text-[#8b8d96]">
                                            Add your rates, bio and portfolio later to reach 100%.
                                        </p>
                                    </div>
                                    <PrimaryButton className="mt-5 w-full sm:mt-[22px] sm:w-auto" onClick={() => go(5, undefined, true)}>
                                        Go to my dashboard →
                                    </PrimaryButton>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
