import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AccountVerification } from '@/components/creator/AccountVerification';
import { useAuthUser } from '@/hooks/useAuthUser';
import {
    useConnectInstagram,
    useConnectMeta,
    useDisconnectAccount,
    useInstagramAccounts,
    useMetaStatus,
} from '@/hooks/useSocialAccounts';
import { accountAvatarStyle } from '@/components/creator/CreatorInstagramAccounts';
import { formatCount } from '@/utils/creator';
import { logout } from '@/utils/auth';
import {
    accountHasMeta,
    clearInstagramOAuthSearchParams,
    getInstagramOAuthErrorMessage,
    getOAuthSuccessMessage,
} from '@/utils/socialAccounts';

export default function CreatorSettings() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: user } = useAuthUser();
    const { accounts } = useInstagramAccounts();
    const { data: metaStatus } = useMetaStatus();
    const { mutate: connectInstagram, isPending: isConnecting } = useConnectInstagram('settings');
    const { mutate: connectMeta, isPending: isConnectingMeta } = useConnectMeta('settings');
    const { mutate: disconnectAccount, isPending: isDisconnecting } = useDisconnectAccount();

    const [oauthNotice, setOauthNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
    const oauthError = getInstagramOAuthErrorMessage(
        searchParams.get('error'),
        searchParams.get('error_description'),
    );
    const oauthSuccess = getOAuthSuccessMessage(searchParams.get('success'));

    useEffect(() => {
        if (!oauthSuccess && !oauthError) return;
        if (oauthSuccess) setOauthNotice({ type: 'ok', text: oauthSuccess });
        if (oauthError) setOauthNotice({ type: 'error', text: oauthError });
        clearInstagramOAuthSearchParams(searchParams);
        setSearchParams(searchParams, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [oauthSuccess, oauthError]);

    return (
        <div className="mx-auto max-w-[760px]">
            <div className="mb-5">
                <h1 className="mb-1.5 text-[31px] font-extrabold leading-[1.06] tracking-[-1.3px]">Settings</h1>
                <p className="m-0 text-[13px] text-[#777a83]">Manage verification, connected accounts and your login.</p>
            </div>

            {oauthNotice && (
                <div className={`mb-4 rounded-[13px] border px-4 py-3 text-[12px] ${
                    oauthNotice.type === 'error'
                        ? 'border-[#f3d0d0] bg-[#fff7f7] text-[#b4232c]'
                        : 'border-[#d8efe3] bg-[#f3fbf6] text-[#147a4b]'
                }`}>
                    {oauthNotice.text}
                </div>
            )}

            <AccountVerification />

            <div className="space-y-4">
                <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                    <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[1.1px] text-[#8b8d95]">Account</div>
                    <p className="text-sm font-bold">{user?.name || 'Creator'}</p>
                    <p className="text-[12px] text-[#8b8d95]">{user?.email}</p>
                    {user?.phone && <p className="text-[12px] text-[#8b8d95]">+91 {user.phone}</p>}
                </div>

                <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[1.1px] text-[#8b8d95]">Instagram</div>
                            <p className="text-[12px] text-[#8b8d95]">Connect with Instagram Login. A Professional Instagram account (Business or Creator) is required. Facebook is not needed for campaigns, insights, or profile features.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => connectInstagram()}
                            disabled={isConnecting}
                            className="rounded-[9px] bg-brand-orange px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60"
                        >
                            {isConnecting ? 'Opening…' : '+ Add account'}
                        </button>
                    </div>
                    {accounts.length === 0 ? (
                        <p className="text-sm text-[#8b8d95]">No Instagram accounts connected yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {accounts.map((account, index) => (
                                <div key={account.id} className="flex items-center gap-3 rounded-[13px] border border-[#dce8f0] p-3">
                                    <div
                                        className="h-9 w-9 flex-none rounded-full"
                                        style={accountAvatarStyle(account, index)}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold">@{account.username}</p>
                                        <p className="text-[11px] text-[#8b8d95]">
                                            {formatCount(account.followers_count || 0)} followers · Connected
                                            {accountHasMeta(account) ? ' · Meta ready' : ''}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isDisconnecting}
                                        onClick={() => {
                                            if (window.confirm(`Disconnect @${account.username}?`)) {
                                                disconnectAccount(account.id);
                                            }
                                        }}
                                        className="rounded-[8px] border border-[#dce8f0] px-2.5 py-1.5 text-[10px] font-bold text-[#8a8c94]"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[1.1px] text-[#8b8d95]">Facebook (optional)</div>
                            <p className="text-[12px] text-[#8b8d95]">Required only for Reels Studio, bulk publishing, and Instagram audio search. Your Instagram Login connection stays independent.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => connectMeta()}
                            disabled={isConnectingMeta}
                            className="rounded-[9px] bg-brand-orange px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60"
                        >
                            {isConnectingMeta ? 'Opening…' : metaStatus?.connected ? 'Reconnect Facebook' : 'Connect Facebook Account'}
                        </button>
                    </div>
                    {metaStatus?.connected ? (
                        <div className="rounded-[13px] border border-[#d8efe3] bg-[#f3fbf6] px-3 py-3">
                            <p className="text-sm font-bold text-[#147a4b]">Connected ✓</p>
                            <p className="mt-1 text-[11px] text-[#147a4b]">
                                Instagram Professional Account {metaStatus.instagram_professional_account ? 'Connected ✓' : 'missing'}
                                {metaStatus.page_connected ? ' · Facebook Page Connected ✓' : ''}
                            </p>
                            <p className="mt-1 text-[11px] text-[#8b8d95]">
                                {metaStatus.accounts.map((account) => `@${account.username}`).join(', ')}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-[#8b8d95]">Connect Facebook Account to use Reels Studio.</p>
                    )}
                </div>

                <div className="rounded-[18px] border border-[#dce8f0] bg-white p-5">
                    <div className="mb-3 text-[10px] font-extrabold uppercase tracking-[1.1px] text-[#8b8d95]">Shortcuts</div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => navigate('/creator/reel-studio')} className="rounded-[9px] border border-[#dce8f0] px-3 py-2 text-[11px] font-bold">
                            Reel Studio
                        </button>
                        <button type="button" onClick={() => navigate('/creator/bulk-reels')} className="rounded-[9px] border border-[#dce8f0] px-3 py-2 text-[11px] font-bold">
                            Bulk upload
                        </button>
                        <button type="button" onClick={() => navigate('/creator/profile')} className="rounded-[9px] border border-[#dce8f0] px-3 py-2 text-[11px] font-bold">
                            Edit profile
                        </button>
                        <button type="button" onClick={() => navigate('/creator/media-kit')} className="rounded-[9px] border border-[#dce8f0] px-3 py-2 text-[11px] font-bold">
                            Media kit
                        </button>
                        <button type="button" onClick={() => navigate('/creator/payments')} className="rounded-[9px] border border-[#dce8f0] px-3 py-2 text-[11px] font-bold">
                            Earnings
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => logout(navigate)}
                    className="w-full rounded-[10px] bg-brand-orange py-3 text-[12px] font-extrabold text-white"
                >
                    Log out
                </button>
            </div>
        </div>
    );
}
