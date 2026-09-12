import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Check,
    Instagram,
    List,
    LogOut,
    MessageSquareOff,
    Shield,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/marketing/Logo';
import { formatCount } from '@/utils/creator';
import { getApiErrorMessage } from '@/api/axios';
import { getInstagramOAuthErrorMessage, clearInstagramOAuthSearchParams } from '@/utils/socialAccounts';
import { getRoleDashboardPath, getStoredUser, logout, needsOnboarding, type OnboardingData } from '@/utils/auth';
import { useSaveOnboarding } from '@/hooks/useOnboarding';
import { useConnectInstagram, useInstagramAccount, useSyncAccount } from '@/hooks/useSocialAccounts';
import {
    CONTENT_CATEGORIES,
    CREATOR_TYPES,
    LANGUAGES,
    LOCATIONS,
    ONBOARDING_STEPS,
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

function Pill({
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
            className={cn(
                'rounded-[11px] border px-3 py-2 text-[13px] transition sm:px-3.5 sm:py-2.5',
                selected
                    ? 'border-[#ff6a1a] bg-[#e8f8fe] font-bold text-[#f05a0c]'
                    : 'border-[#dce8f0] bg-white text-brand-ink',
            )}
        >
            {children}
        </button>
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
    if (saved <= 4) return Math.max(saved, 1);
    if (saved === 5) return 4;
    if (saved === 6) return 5;
    return 6;
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
        title: 'Official Instagram authorization',
        body: 'Instagram is connected through Instagram Login — TapnLike never asks you for your Instagram password. Facebook Login is optional later for Reels Studio.',
    },
    {
        icon: List,
        title: 'Only approved permissions',
        body: 'You choose what to authorize. We only request the permissions needed for the creator features you use.',
    },
    {
        icon: MessageSquareOff,
        title: 'No password or private messages',
        body: 'TapnLike cannot see your Instagram password. We do not request access to your private messages through this connection.',
    },
    {
        icon: ShieldCheck,
        title: 'You stay in control',
        body: "You can review, approve or cancel the connection on Instagram's screen before access is granted.",
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
    const { instagram } = useInstagramAccount();
    const { mutate: connectInstagram, isPending: isConnecting } = useConnectInstagram('onboarding');
    const { data: syncData } = useSyncAccount(instagram?.id);

    const oauthError = getInstagramOAuthErrorMessage(
        searchParams.get('error'),
        searchParams.get('error_description'),
    );
    const oauthSuccess = searchParams.get('success') === 'connected';

    const [step, setStep] = useState(() => (oauthError ? 4 : mapSavedStep(stored?.onboarding_step || 1)));
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
            setStep(5);
            saveOnboarding.mutate({ step: 5, data });
        } else {
            setConnecting(false);
            setConnectError(oauthError);
            setStep(4);
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
        data.creatorType ? creatorTypeLabel(data.creatorType) : null,
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
        saveOnboarding.mutate({ step: 4, data });
        connectInstagram(undefined, {
            onError: (err) => {
                setConnecting(false);
                setConnectError(getApiErrorMessage(err, 'Could not start Instagram connection. Please try again.'));
            },
        });
    };

    const toggleList = (key: 'contentCategories' | 'opportunities' | 'brandInterests' | 'languages', value: string, max?: number) => {
        const current = data[key] || [];
        const exists = current.includes(value);
        if (!exists && max && current.length >= max) return;
        setData({
            ...data,
            [key]: exists ? current.filter((item) => item !== value) : [...current, value],
        });
    };

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
                            Step {step} of {ONBOARDING_STEPS.length}
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
                        {ONBOARDING_STEPS.map((label, index) => {
                            const number = index + 1;
                            const active = number === step;
                            const done = number < step;
                            return (
                                <div
                                    key={label}
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
                                    {label}
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
                                        Welcome to TapnLike
                                    </p>
                                    <h1 className={headingClass}>
                                        Let's build your creator profile.
                                    </h1>
                                    <p className={bodyClass}>
                                        A few quick questions help us match you with better brands, campaigns and opportunities.
                                    </p>
                                    <div className="mb-5 flex items-center gap-3 rounded-[19px] border border-[#dce8f0] p-3.5 sm:mb-7 sm:gap-4 sm:p-5">
                                        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-brand-orange text-white sm:h-[54px] sm:w-[54px]">
                                            <Sparkles size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold sm:text-base">Built for creators</div>
                                            <div className="mt-1 text-[13px] text-[#858791]">
                                                Tell us what you create. We'll handle the rest.
                                            </div>
                                        </div>
                                    </div>
                                    <PrimaryButton className="w-full sm:w-auto" onClick={() => go(2)}>Let's get started →</PrimaryButton>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[1.5px] text-[#ff6a1a]">About you</p>
                                    <h1 className={headingClass}>
                                        What best describes you?
                                    </h1>
                                    <p className={bodyClass}>
                                        Choose the option that fits your creator identity.
                                    </p>
                                    <Progress value={28} />
                                    <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {CREATOR_TYPES.map((item) => (
                                            <ChoiceCard
                                                key={item.id}
                                                selected={data.creatorType === item.id}
                                                icon={item.icon}
                                                title={item.title}
                                                desc={item.desc}
                                                onClick={() => setData({ ...data, creatorType: item.id })}
                                            />
                                        ))}
                                    </div>
                                    <ActionRow>
                                        <SecondaryButton onClick={() => setStep(1)}>Back</SecondaryButton>
                                        <PrimaryButton className="w-full sm:flex-1" disabled={!data.creatorType} onClick={() => go(3)}>
                                            Continue →
                                        </PrimaryButton>
                                    </ActionRow>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[1.5px] text-[#ff6a1a]">Your content</p>
                                    <h1 className={headingClass}>
                                        What do you create?
                                    </h1>
                                    <p className={bodyClass}>
                                        Pick up to 5 categories. This helps brands find the right creators.
                                    </p>
                                    <Progress value={42} />
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        {CONTENT_CATEGORIES.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => toggleList('contentCategories', item, 5)}
                                                className={cn(
                                                    'rounded-full border px-3 py-2 text-[13px] transition sm:px-3.5 sm:py-2.5',
                                                    data.contentCategories?.includes(item)
                                                        ? 'border-[#ff6a1a] bg-[#e8f8fe] font-bold text-[#f05a0c]'
                                                        : 'border-[#dce8f0] bg-white',
                                                )}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mb-6 text-xs text-[#8b8d96]">
                                        {data.contentCategories?.length || 0} of 5 selected
                                    </p>
                                    <ActionRow>
                                        <SecondaryButton onClick={() => setStep(2)}>Back</SecondaryButton>
                                        <PrimaryButton
                                            className="w-full sm:flex-1"
                                            disabled={!data.contentCategories?.length}
                                            onClick={() => go(4)}
                                        >
                                            Continue →
                                        </PrimaryButton>
                                    </ActionRow>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    <p className="mb-2.5 text-xs font-extrabold uppercase tracking-[1.5px] text-[#ff6a1a]">
                                        Connect account
                                    </p>
                                    <h1 className={headingClass}>
                                        Connect Instagram.<br />
                                        Get discovered. Get paid.
                                    </h1>
                                    <p className={bodyClass}>
                                        Connect your Instagram with Instagram Login. You need a Professional Instagram account (Business or Creator) so we can read your profile, insights, and campaign activity. Facebook Login is not required for this step.
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
                                                Secure professional account connection
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold">
                                        <ShieldCheck size={14} className="text-[#168d58]" />
                                        Private & secure
                                    </p>
                                    <div className="mb-7">
                                        <InfoList items={INSTAGRAM_SECURITY} />
                                    </div>
                                    <ActionRow>
                                        <SecondaryButton onClick={() => setStep(3)}>Back</SecondaryButton>
                                        <PrimaryButton
                                            className="w-full sm:flex-1"
                                            disabled={!instagram && (isConnecting || connecting)}
                                            onClick={() => (instagram ? go(5) : startInstagram())}
                                        >
                                            {instagram
                                                ? 'Continue →'
                                                : isConnecting || connecting
                                                    ? 'Opening Instagram...'
                                                    : 'Connect Instagram →'}
                                        </PrimaryButton>
                                    </ActionRow>
                                    <p className="mt-4 text-xs leading-relaxed text-[#8b8d96]">
                                        You'll be redirected to Instagram's official authorization flow. TapnLike does not collect your Instagram password. Access is granted by Instagram using the permissions you approve.
                                    </p>
                                </>
                            )}

                            {step === 5 && (
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
                                                <div className="mt-1 truncate text-[13px] text-[#858791]">{profileMeta}</div>
                                            )}
                                        </div>
                                        <div className="w-full text-[13px] font-bold text-[#ee3c89] sm:ml-auto sm:w-auto">
                                            ✓ Instagram connected
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="mb-2.5 block text-[13px] font-bold">Where are you based?</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {LOCATIONS.map((item) => (
                                                <Pill
                                                    key={item}
                                                    selected={data.location === item}
                                                    onClick={() => setData({ ...data, location: item })}
                                                >
                                                    {item}
                                                </Pill>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-8">
                                        <label className="mb-2.5 block text-[13px] font-bold">What languages do you create in?</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {LANGUAGES.map((item) => (
                                                <Pill
                                                    key={item}
                                                    selected={!!data.languages?.includes(item)}
                                                    onClick={() => toggleList('languages', item)}
                                                >
                                                    {item}
                                                </Pill>
                                            ))}
                                        </div>
                                    </div>
                                    <ActionRow>
                                        <SecondaryButton onClick={() => setStep(4)}>Back</SecondaryButton>
                                        <PrimaryButton
                                            className="w-full sm:flex-1"
                                            disabled={!data.location || !data.languages?.length}
                                            onClick={() => go(6)}
                                        >
                                            Create my profile →
                                        </PrimaryButton>
                                    </ActionRow>
                                </>
                            )}

                            {step === 6 && (
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
                                                    {creatorTypeLabel(data.creatorType)}
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
                                    <PrimaryButton className="mt-5 w-full sm:mt-[22px] sm:w-auto" onClick={() => go(6, undefined, true)}>
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
