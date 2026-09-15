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
            <h2 className="mb-2.5 font-outfit text-[32px] font-extrabold leading-[1.05] tracking-[-1.8px] text-brand-ink sm:text-[42px]">
                Welcome back.
            </h2>
            <p className="mb-6 text-[15px] leading-relaxed text-brand-gray">
                Log in to see your opportunities, earnings and creator profile.
            </p>

            <div className="relative">
                <TrustPills className="relative z-30" items={['Secure account', 'Creator verified']} />

                <div className="relative">
                    {/* Body sits behind the email field, like the mockup ledge. */}
                    <img
                        src="/images/auth-login-creator.png?v=3"
                        alt=""
                        className="pointer-events-none absolute left-[58px] top-[20px] z-[1] hidden w-[calc(80%+30px)] max-w-none select-none sm:block"
                    />
                    {/* Left elbow/forearm rests on top of the field. */}
                    <img
                        src="/images/auth-login-creator.png?v=3"
                        alt=""
                        className="pointer-events-none absolute left-[58px] top-[20px] z-20 hidden w-[calc(80%+30px)] max-w-none select-none sm:block"
                        style={{ clipPath: 'polygon(0% 72%, 30% 72%, 30% 90%, 0% 90%)' }}
                    />
                    {/* Pointing finger + spark marks stay in front of the field. */}
                    <img
                        src="/images/auth-login-creator.png?v=3"
                        alt=""
                        className="pointer-events-none absolute left-[58px] top-[20px] z-20 hidden w-[calc(80%+30px)] max-w-none select-none sm:block"
                        // style={{ clipPath: 'polygon(50% 72%, 66% 72%, 66% 100%, 50% 100%)' }}
                    />
                    <div className="hidden h-[148px] sm:block" aria-hidden="true" />

                    <form onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="relative z-30 mb-3.5 rounded-xl bg-red-500 px-3 py-2.5 text-[13px] text-white">
                            {error}
                        </div>
                    )}

                    <AuthFieldLabel htmlFor="email" className="relative z-30">
                        Email
                    </AuthFieldLabel>
                    <div className="relative z-10 mb-4">
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            className={cn(authInputClassName, 'relative z-10 bg-white')}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="relative z-30 mt-1.5 text-[11px] text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <AuthFieldLabel htmlFor="password">Password</AuthFieldLabel>
                    <div className="mb-4">
                        <AuthPasswordInput
                            id="password"
                            placeholder="Enter your password"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="mt-1.5 text-[11px] text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="mb-5 flex items-center justify-between gap-3">
                        <AuthCheckbox>Remember me</AuthCheckbox>
                        <Link to="/forgot-password" className="shrink-0 text-[13px] font-bold text-brand-orange hover:underline">
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

            <p className="mt-6 text-center text-[13px] leading-relaxed text-[#8b8e96]">
                New to TapnLike?{' '}
                <Link to="/register" className="font-bold text-brand-orange no-underline hover:underline">
                    Create your creator account
                </Link>
            </p>
        </AuthSplitShell>
    );
}
