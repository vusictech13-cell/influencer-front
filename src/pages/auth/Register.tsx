import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import api, { getApiErrorMessage } from '@/api/axios';
import { getPostAuthPath, persistSession } from '@/utils/auth';
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

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['creator', 'admin']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: 'creator',
        },
    });

    const onSubmit = async (values: RegisterFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/register', {
                name: values.name,
                email: values.email,
                phone: values.phone,
                password: values.password,
                role: values.role,
            });
            const { accessToken, refreshToken, user } = response.data.data;
            persistSession(accessToken, refreshToken, user);
            navigate(getPostAuthPath(user));
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthSplitShell mode="signup">
            <h2 className="mb-2 font-outfit text-[28px] font-extrabold tracking-[-1.5px] text-brand-ink sm:text-[34px]">
                Join TapnLike.
            </h2>
            <p className="mb-4 text-[13px] leading-relaxed text-brand-gray">
                Create your account in under a minute. We'll ask a few creator questions after you sign up.
            </p>

            <TrustPills className="mb-4" items={['Your data is protected', 'Free to join']} />

            <form onSubmit={handleSubmit(onSubmit)}>
                {error && (
                    <div className="mb-3.5 rounded-xl bg-red-500 px-3 py-2.5 text-[13px] text-white">
                        {error}
                    </div>
                )}

                <input type="hidden" {...register('role')} />

                <div className="mb-3.5 grid grid-cols-2 gap-x-3 gap-y-3.5">
                    <div>
                        <AuthFieldLabel htmlFor="name">Full name</AuthFieldLabel>
                        <input
                            id="name"
                            placeholder="Your name"
                            className={authInputClassName}
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="mt-1.5 text-[11px] text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <AuthFieldLabel htmlFor="email">Email address</AuthFieldLabel>
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

                    <div>
                        <AuthFieldLabel htmlFor="phone">Mobile number</AuthFieldLabel>
                        <div className="relative">
                            <div className="pointer-events-none absolute left-3.5 top-4 text-xs text-[#8a8d95]">+91</div>
                            <input
                                id="phone"
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="98765 43210"
                                className={cn(authInputClassName, 'pl-[50px]')}
                                {...register('phone')}
                            />
                        </div>
                        {errors.phone && (
                            <p className="mt-1.5 text-[11px] text-red-500">{errors.phone.message}</p>
                        )}
                    </div>

                    <div>
                        <AuthFieldLabel htmlFor="password">Create password</AuthFieldLabel>
                        <AuthPasswordInput
                            id="password"
                            placeholder="6+ characters"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="mt-1.5 text-[11px] text-red-500">{errors.password.message}</p>
                        )}
                    </div>
                </div>

                <p className="mb-4 text-[9px] leading-relaxed text-[#999ca4]">
                    By continuing, you agree to TapnLike's{' '}
                    <Link to="/terms-of-service" className="font-bold text-brand-orange hover:underline">
                        Terms of Use
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" className="font-bold text-brand-orange hover:underline">
                        Privacy Policy
                    </Link>
                    .
                </p>

                <button type="submit" className={cn(authCtaClassName)} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        'Create my account →'
                    )}
                </button>
            </form>

            <AuthDivider>or sign up with</AuthDivider>

            <div className="grid grid-cols-1">
                <AuthSocialButton
                    disabled={googleLoading}
                    onClick={async () => {
                        setGoogleLoading(true);
                        setError(null);
                        try {
                            await startGoogleAuth('creator');
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
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-brand-orange no-underline hover:underline">
                    Log in
                </Link>
            </p>
        </AuthSplitShell>
    );
}
