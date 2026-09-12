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
            <h2 className="mb-2 font-manrope text-[28px] font-extrabold tracking-[-1.5px] text-[#121318] sm:text-[34px]">
                Welcome back.
            </h2>
            <p className="mb-[26px] text-[13px] leading-relaxed text-[#7c7f88]">
                Log in to see your opportunities, earnings and creator profile.
            </p>

            <TrustPills items={['Secure account', 'Creator verified']} />

            <form onSubmit={handleSubmit(onSubmit)}>
                {error && (
                    <div className="mb-3.5 rounded-xl bg-red-500 px-3 py-2.5 text-[13px] text-white">
                        {error}
                    </div>
                )}

                <AuthFieldLabel htmlFor="email">Email</AuthFieldLabel>
                <div className="mb-3.5">
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className={authInputClassName}
                        {...register('email')}
                    />
                    {errors.email && (
                        <p className="mt-1.5 text-[11px] text-red-500">{errors.email.message}</p>
                    )}
                </div>

                <AuthFieldLabel htmlFor="password">Password</AuthFieldLabel>
                <div className="mb-3.5">
                    <AuthPasswordInput
                        id="password"
                        placeholder="Enter your password"
                        {...register('password')}
                    />
                    {errors.password && (
                        <p className="mt-1.5 text-[11px] text-red-500">{errors.password.message}</p>
                    )}
                </div>

                <div className="mb-[18px] mt-0.5 flex items-center justify-between">
                    <label className="flex items-center gap-[7px] text-[10px] text-[#777a83]">
                        <input type="checkbox" className="accent-[#e9408a]" />
                        Remember me
                    </label>
                    <Link to="/forgot-password" className="text-[10px] font-bold text-[#c12c6c] hover:underline">
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

            <p className="mt-[21px] text-center text-[10px] leading-relaxed text-[#8b8e96]">
                New to Buzooka?{' '}
                <Link to="/register" className="font-bold text-[#bd2b6b] no-underline hover:underline">
                    Create your creator account
                </Link>
            </p>
        </AuthSplitShell>
    );
}
