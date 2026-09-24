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
};

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

export function persistSession(accessToken: string, refreshToken: string, user: StoredUser): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
}

export function updateStoredUser(user: StoredUser): void {
    localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
    clearAuth();
    navigate('/login');
}
