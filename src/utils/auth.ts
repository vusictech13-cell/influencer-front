import type { NavigateFunction } from 'react-router-dom';

export type UserRole = 'admin' | 'creator' | 'brand';

const VALID_ROLES: UserRole[] = ['creator', 'brand', 'admin'];

export type StoredUser = {
    id?: string | number;
    name?: string;
    email?: string;
    phone?: string | null;
    role?: UserRole | string;
    auth_provider?: 'local' | 'google' | string;
    email_verified?: boolean;
    phone_verified?: boolean;
    profile_image?: string | null;
    onboarding_completed?: boolean;
    onboarding_step?: number;
    onboarding_data?: OnboardingData | null;
    features?: string[];
    permissions?: string[];
    is_super_admin?: boolean;
    admin_roles?: { id?: number; name: string; code: string }[];
    impersonating?: boolean;
};

export function hasFeature(user: StoredUser | null | undefined, key: string) {
    return !!user?.features?.includes(key);
}

export type CreatorRates = {
    reel?: number;
    story?: number;
    post?: number;
};

export type OnboardingData = {
    creatorType?: string;
    creatorTypeOther?: string;
    contentCategories?: string[];
    opportunities?: string[];
    brandInterests?: string[];
    location?: string;
    languages?: string[];
    earningGoal?: string;
    rates?: CreatorRates;
};

export function isValidRole(role?: string): role is UserRole {
    return VALID_ROLES.includes(role as UserRole);
}

export function getStoredUser(): StoredUser | null {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export const AUTH_CHANGED_EVENT = 'tapnlike-auth-changed';

function notifyAuthChanged() {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function readSessionId(token?: string | null): string | null {
    if (!token) return null;
    const part = token.split('.')[1];
    if (!part) return null;
    try {
        const padded = part.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(padded)) as { sessionId?: string };
        return typeof payload.sessionId === 'string' ? payload.sessionId : null;
    } catch {
        return null;
    }
}

export type AuthRealm = 'user' | 'admin';

export const AUTH_REALM_KEY = 'authRealm';

export function getAuthRealm(): AuthRealm {
    return localStorage.getItem(AUTH_REALM_KEY) === 'admin' ? 'admin' : 'user';
}

export function isAdminSession(): boolean {
    return getAuthRealm() === 'admin' && getStoredUser()?.role === 'admin' && !!localStorage.getItem('accessToken');
}

export function getLoginPath(realm: AuthRealm = getAuthRealm()): string {
    return realm === 'admin' ? '/admin' : '/login';
}

export function getRefreshPath(realm: AuthRealm = getAuthRealm()): string {
    return realm === 'admin' ? '/admin/auth/refresh-token' : '/auth/refresh-token';
}

export function getLogoutPath(realm: AuthRealm = getAuthRealm()): string {
    return realm === 'admin' ? '/admin/auth/logout' : '/auth/logout';
}

const ADMIN_RETURN_KEY = 'tapnlike-admin-return';

let returningToAdmin = false;

/** True while the impersonation session is ending and the admin session is being restored. */
export function isReturningToAdmin(): boolean {
    return returningToAdmin;
}

export function stashAdminSession(): void {
    if (getAuthRealm() !== 'admin') return;
    sessionStorage.setItem(ADMIN_RETURN_KEY, JSON.stringify({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        user: localStorage.getItem('user'),
    }));
}

export async function returnToAdmin(): Promise<void> {
    if (returningToAdmin) return;
    returningToAdmin = true;
    const raw = sessionStorage.getItem(ADMIN_RETURN_KEY);
    sessionStorage.removeItem(ADMIN_RETURN_KEY);
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    if (accessToken) {
        await fetch(`${base}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ refreshToken }),
        }).catch(() => undefined);
    }
    if (!raw) {
        clearAuth();
        window.location.assign('/admin');
        return;
    }
    const data = JSON.parse(raw) as { accessToken?: string; refreshToken?: string; user?: string };
    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.user) localStorage.setItem('user', data.user);
    localStorage.setItem(AUTH_REALM_KEY, 'admin');
    notifyAuthChanged();
    window.location.assign('/admin/dashboard');
}

export function persistSession(
    accessToken: string,
    refreshToken: string,
    user: StoredUser,
    realm: AuthRealm = 'user',
): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem(AUTH_REALM_KEY, realm);
    notifyAuthChanged();
}

export function withImpersonationFlag(user: StoredUser): StoredUser {
    if (user.impersonating != null) return user;
    const stored = getStoredUser();
    if (!stored?.impersonating) return user;
    if (stored.id != null && user.id != null && String(stored.id) !== String(user.id)) return user;
    return { ...user, impersonating: true };
}

export function updateStoredUser(user: StoredUser): void {
    localStorage.setItem('user', JSON.stringify(withImpersonationFlag(user)));
}

export function clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem(AUTH_REALM_KEY);
    notifyAuthChanged();
}

let sessionEndInFlight = false;

export function forceSessionEnd(reason: 'session_revoked' | 'session_expired') {
    if (returningToAdmin || sessionEndInFlight) return;
    sessionEndInFlight = true;
    const loginPath = getLoginPath();
    clearAuth();
    import('@/lib/supportSocket')
        .then((mod) => mod.disconnectSupportSocket())
        .catch(() => undefined)
        .finally(() => {
            if (window.location.pathname !== loginPath) {
                window.location.assign(`${loginPath}?reason=${reason}`);
                return;
            }
            sessionEndInFlight = false;
        });
}

/** Remove partial or invalid auth left in localStorage (e.g. token without user/role). */
export function normalizeAuthState(): void {
    const hasToken = !!localStorage.getItem('accessToken');
    if (hasToken && !isAuthenticated()) {
        clearAuth();
    }
}

export function isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken') && isValidRole(getStoredUser()?.role);
}

export function needsOnboarding(user?: StoredUser | null): boolean {
    return user?.role === 'creator' && user.onboarding_completed === false;
}

export function getPostAuthPath(user?: StoredUser | null): string {
    if (needsOnboarding(user)) return '/onboarding';
    return getRoleDashboardPath(user?.role);
}

export function getRoleDashboardPath(role?: string): string {
    switch (role) {
        case 'creator':
            return '/creator/dashboard';
        case 'admin':
            return '/admin/dashboard';
        case 'brand':
            return '/brand/dashboard';
        default:
            return '/';
    }
}

export function logout(navigate: NavigateFunction) {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');
    const realm = getAuthRealm();
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    if (accessToken) {
        fetch(`${base}${getLogoutPath(realm)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ refreshToken }),
        }).catch(() => undefined);
    }
    clearAuth();
    import('@/lib/supportSocket')
        .then((mod) => mod.disconnectSupportSocket())
        .catch(() => undefined);
    navigate(getLoginPath(realm));
}
