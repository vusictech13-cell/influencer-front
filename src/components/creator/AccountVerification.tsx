import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Mail, Smartphone } from 'lucide-react';
import { getApiErrorMessage } from '@/api/axios';
import {
    useAuthUser,
    useSendEmailOtp,
    useSendPhoneOtp,
    useVerifyEmail,
    useVerifyPhone,
} from '@/hooks/useAuthUser';

function OtpInput({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}) {
    return (
        <input
            inputMode="numeric"
            maxLength={6}
            value={value}
            onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            disabled={disabled}
            className="h-10 w-36 rounded-xl border border-gray-200 px-3 text-sm tracking-[0.2em] outline-none focus:border-[#ff6a1a] focus:shadow-[0_0_0_3px_rgba(255,106,26,0.08)]"
        />
    );
}

function DevOtpHint({ otp }: { otp?: string }) {
    if (!otp) return null;
    return <p className="text-[11px] text-amber-600">Dev code: {otp}</p>;
}

export function AccountVerification() {
    const { data: user } = useAuthUser();
    const sendEmailOtp = useSendEmailOtp();
    const verifyEmail = useVerifyEmail();
    const sendPhoneOtp = useSendPhoneOtp();
    const verifyPhone = useVerifyPhone();

    const [emailOtp, setEmailOtp] = useState('');
    const [phoneOtp, setPhoneOtp] = useState('');
    const [phone, setPhone] = useState(user?.phone || '');

    useEffect(() => {
        if (user?.phone) setPhone(user.phone);
    }, [user?.phone]);
    const [emailHint, setEmailHint] = useState<string | undefined>();
    const [phoneHint, setPhoneHint] = useState<string | undefined>();
    const [emailError, setEmailError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const needsEmail = user?.email_verified === false;
    const needsPhone = user?.phone_verified === false;

    if (!user || (!needsEmail && !needsPhone)) {
        return null;
    }

    const handleSendEmail = async () => {
        setEmailError(null);
        try {
            const result = await sendEmailOtp.mutateAsync();
            setEmailHint(result.devOtp);
        } catch (error) {
            setEmailError(getApiErrorMessage(error, 'Could not send email code'));
        }
    };

    const handleVerifyEmail = async () => {
        setEmailError(null);
        try {
            await verifyEmail.mutateAsync(emailOtp);
            setEmailOtp('');
        } catch (error) {
            setEmailError(getApiErrorMessage(error, 'Could not verify email'));
        }
    };

    const handleSendPhone = async () => {
        setPhoneError(null);
        try {
            const result = await sendPhoneOtp.mutateAsync(phone);
            setPhoneHint(result.devOtp);
        } catch (error) {
            setPhoneError(getApiErrorMessage(error, 'Could not send mobile code'));
        }
    };

    const handleVerifyPhone = async () => {
        setPhoneError(null);
        try {
            await verifyPhone.mutateAsync(phoneOtp);
            setPhoneOtp('');
        } catch (error) {
            setPhoneError(getApiErrorMessage(error, 'Could not verify mobile'));
        }
    };

    return (
        <div className="mx-auto mb-6 max-w-[1420px] space-y-3">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Verify your account to keep campaigns, payouts and important updates secure.
            </div>

            {needsEmail && (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f6] text-[#ff6a1a]">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Verify your email</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                                {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
                                <DevOtpHint otp={emailHint} />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <OtpInput value={emailOtp} onChange={setEmailOtp} disabled={verifyEmail.isPending} />
                            <button
                                type="button"
                                onClick={handleVerifyEmail}
                                disabled={emailOtp.length !== 6 || verifyEmail.isPending}
                                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-orange px-3 text-xs font-bold text-white disabled:opacity-50"
                            >
                                {verifyEmail.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Verify
                            </button>
                            <button
                                type="button"
                                onClick={handleSendEmail}
                                disabled={sendEmailOtp.isPending}
                                className="h-10 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                {sendEmailOtp.isPending ? 'Sending...' : emailHint ? 'Resend' : 'Send code'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {needsPhone && (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0f6] text-[#ff6a1a]">
                                <Smartphone size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Verify your mobile</p>
                                <p className="text-xs text-gray-500">
                                    {user.phone ? `+91 ${user.phone}` : 'Add your mobile number to receive a code'}
                                </p>
                                {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
                                <DevOtpHint otp={phoneHint} />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-gray-400">+91</span>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="9876543210"
                                    className="h-10 w-40 rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#ff6a1a]"
                                />
                            </div> */}
                            <OtpInput value={phoneOtp} onChange={setPhoneOtp} disabled={verifyPhone.isPending} />
                            <button
                                type="button"
                                onClick={handleVerifyPhone}
                                disabled={phoneOtp.length !== 6 || verifyPhone.isPending}
                                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-orange px-3 text-xs font-bold text-white disabled:opacity-50"
                            >
                                {verifyPhone.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Verify
                            </button>
                            <button
                                type="button"
                                onClick={handleSendPhone}
                                disabled={sendPhoneOtp.isPending || phone.length !== 10}
                                className="h-10 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                {sendPhoneOtp.isPending ? 'Sending...' : phoneHint ? 'Resend' : 'Send code'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
