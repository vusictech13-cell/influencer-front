import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Shield } from 'lucide-react';
import api, { getApiErrorMessage } from '@/api/axios';
import { AuthFieldLabel } from '@/components/auth/AuthSplitShell';
import { AuthPasswordInput, authCtaClassName, authInputClassName } from '@/components/auth/AuthFormControls';
import { isAdminSession, persistSession } from '@/utils/auth';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const revokedNotice = searchParams.get('reason') === 'session_revoked'
        ? 'Your session was revoked. Please login again.'
        : searchParams.get('reason') === 'session_expired'
            ? 'Your session has expired. Please login again.'
            : null;
    const [error, setError] = useState<string | null>(revokedNotice);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (isAdminSession()) {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [navigate]);

    const onSubmit = async (values: LoginFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/admin/auth/login', values);
            const { accessToken, refreshToken, admin } = response.data.data;
            persistSession(accessToken, refreshToken, {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                role: 'admin',
                permissions: admin.permissions,
                is_super_admin: admin.is_super_admin,
                admin_roles: admin.roles,
            }, 'admin');
            navigate('/admin/dashboard');
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-svh items-center justify-center bg-[#f4f7fb] px-4 py-10 font-jakarta text-brand-ink">
            <div className="w-full max-w-[420px] rounded-[28px] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(11,39,68,0.08)] sm:px-8 sm:py-10">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-navy text-white">
                        <Shield className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-gray">TapnLike</p>
                        <h1 className="font-outfit text-[28px] font-extrabold leading-none tracking-[-0.04em]">Admin</h1>
                    </div>
                </div>
                <p className="mb-6 text-[14px] leading-relaxed text-brand-gray">
                    Staff, admin, and super admin accounts sign in here. Creator and brand accounts use the main login.
                </p>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="mb-4 rounded-xl bg-red-500 px-3 py-2.5 text-[13px] text-white">
                            {error}
                        </div>
                    )}

                    <AuthFieldLabel htmlFor="admin-email">Email</AuthFieldLabel>
                    <input
                        id="admin-email"
                        type="email"
                        placeholder="admin@tapnlike.com"
                        className={cn(authInputClassName, 'mb-4')}
                        {...register('email')}
                    />
                    {errors.email && <p className="-mt-3 mb-3 text-[11px] text-red-500">{errors.email.message}</p>}

                    <AuthFieldLabel htmlFor="admin-password">Password</AuthFieldLabel>
                    <div className="mb-6">
                        <AuthPasswordInput
                            id="admin-password"
                            placeholder="Enter your password"
                            {...register('password')}
                        />
                        {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
                    </div>

                    <button type="submit" className={authCtaClassName} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-[13px] text-[#8b8e96]">
                    Creator or brand?{' '}
                    <Link to="/login" className="font-bold text-brand-orange no-underline hover:underline">
                        Use the main login
                    </Link>
                </p>
            </div>
        </div>
    );
}
