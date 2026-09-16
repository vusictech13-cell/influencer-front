import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import api, { getApiErrorMessage } from '@/api/axios';
import { getPostAuthPath, getStoredUser, isAuthenticated, persistSession } from '@/utils/auth';
import { startGoogleAuth } from '@/hooks/useAuthUser';
import { AuthFieldLabel, AuthSplitShell, TrustPills } from '@/components/auth/AuthSplitShell';
import {
    AuthCheckbox,
    AuthDivider,
    AuthPasswordInput,
    AuthSocialButton,
    GoogleIcon,
    authCtaClassName,
    authInputClassName,
} from '@/components/auth/AuthFormControls';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(searchParams.get('error_description'));

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (isAuthenticated()) {
            const user = getStoredUser();
            navigate(getPostAuthPath(user), { replace: true });
        }
    }, [navigate]);

    const onSubmit = async (values: LoginFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', values);
            const { accessToken, refreshToken, user } = response.data.data;
            persistSession(accessToken, refreshToken, user);
            navigate(getPostAuthPath(user));
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthSplitShell mode="login">
            <h2 className="mb-1 font-outfit text-[28px] font-extrabold leading-[1.05] tracking-[-1.4px] text-brand-ink sm:mb-2.5 sm:text-[42px] sm:tracking-[-1.8px]">
                Welcome back.
            </h2>
            <p className="mb-3 min-h-[2.5rem] text-[13px] leading-snug text-brand-gray sm:mb-6 sm:min-h-0 sm:text-[15px] sm:leading-relaxed">
                Log in to see your opportunities, earnings and creator profile.
            </p>

            <div className="relative">
                <TrustPills className="relative z-30 hidden sm:flex" items={['Secure account', 'Creator verified']} />

                <div className="relative">
                    {/*
                      Same geometry at every size: fixed height + matching spacer.
                      Desktop values unchanged; mobile is a proportional scale of that layout
                      so arms always meet the email top border.
                    */}
                    <img
                        src="/images/auth-login-creator.png?v=3"
                        alt=""
                        className="pointer-events-none absolute left-[13%] top-[10px] z-[1] h-[128px] w-auto max-w-none select-none sm:left-[58px] sm:top-[20px] sm:h-[195px]"
                    />
                    <img
                        src="/images/auth-login-creator.png?v=3"
                        alt=""
                        className="pointer-events-none absolute left-[13%] top-[10px] z-20 h-[128px] w-auto max-w-none select-none sm:left-[58px] sm:top-[20px] sm:h-[195px]"
                        style={{ clipPath: 'polygon(0% 72%, 30% 72%, 30% 90%, 0% 90%)' }}
                    />
                    <img
                        src="/images/auth-login-creator.png?v=3"
                        alt=""
                        className="pointer-events-none absolute left-[13%] top-[10px] z-20 h-[128px] w-auto max-w-none select-none sm:left-[58px] sm:top-[20px] sm:h-[195px]"
                    />
                    <div className="h-[90px] sm:h-[148px]" aria-hidden="true" />

                    <form onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="relative z-30 mb-2 rounded-xl bg-red-500 px-3 py-2 text-[12px] text-white sm:mb-3.5 sm:py-2.5 sm:text-[13px]">
                            {error}
                        </div>
                    )}

                    <AuthFieldLabel htmlFor="email" className="relative z-30">
                        Email
                    </AuthFieldLabel>
                    <div className="relative z-10 mb-2.5 sm:mb-4">
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            className={cn(authInputClassName, 'relative z-10 bg-white')}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="relative z-30 mt-1 text-[11px] text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <AuthFieldLabel htmlFor="password">Password</AuthFieldLabel>
                    <div className="mb-2.5 sm:mb-4">
                        <AuthPasswordInput
                            id="password"
                            placeholder="Enter your password"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="mb-3.5 flex items-center justify-between gap-3 sm:mb-5">
                        <AuthCheckbox>Remember me</AuthCheckbox>
                        <Link to="/forgot-password" className="shrink-0 text-[12px] font-bold text-brand-orange hover:underline sm:text-[13px]">
                            Forgot password?
                        </Link>
                    </div>

                    <button type="submit" className={cn(authCtaClassName)} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            'Log in →'
                        )}
                    </button>
                </form>
                </div>
            </div>

            <AuthDivider>or continue with</AuthDivider>

            <div className="grid grid-cols-1">
                <AuthSocialButton
                    disabled={googleLoading}
                    onClick={async () => {
                        setGoogleLoading(true);
                        setError(null);
                        try {
                            await startGoogleAuth('login');
                        } catch (err: unknown) {
                            setGoogleLoading(false);
                            setError(getApiErrorMessage(err, 'Google sign-in is not available right now.'));
                        }
                    }}
                >
                    {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Google
                </AuthSocialButton>
            </div>

            <p className="mt-3 text-center text-[12px] leading-relaxed text-[#8b8e96] sm:mt-6 sm:text-[13px]">
                New to TapnLike?{' '}
                <Link to="/register" className="font-bold text-brand-orange no-underline hover:underline">
                    Create your creator account
                </Link>
            </p>
        </AuthSplitShell>
    );
}
