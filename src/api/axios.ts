import axios from 'axios';
import { clearAuth } from '@/utils/auth';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Let the browser set multipart boundary for file uploads
        if (config.data instanceof FormData) {
            config.headers.delete('Content-Type');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't try to refresh token for authentication endpoints
        const isAuthRequest =
            originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/register') ||
            originalRequest?.url?.includes('/auth/refresh-token') ||
            originalRequest?.url?.includes('/auth/google');

        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !isAuthRequest
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    clearAuth();
                    window.location.href = '/';
                    return Promise.reject(error);
                }

                const response = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh-token`,
                    { refreshToken }
                );

                const { accessToken } = response.data.data;

                localStorage.setItem('accessToken', accessToken);

                // Keep live support socket authenticated after silent token refresh.
                try {
                    const { getSupportSocket } = await import('@/lib/supportSocket');
                    const supportSocket = getSupportSocket();
                    if (supportSocket) {
                        supportSocket.auth = { token: accessToken };
                        if (supportSocket.connected) {
                            supportSocket.disconnect().connect();
                        }
                    }
                } catch {
                    // Socket module may be unused on some routes; ignore.
                }

                originalRequest.headers = {
                    ...originalRequest.headers,
                    Authorization: `Bearer ${accessToken}`,
                };

                return api(originalRequest);
            } catch (refreshError) {
                clearAuth();
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        return data?.message || error.message || fallback;
    }
    if (error instanceof Error) return error.message || fallback;
    return fallback;
}
