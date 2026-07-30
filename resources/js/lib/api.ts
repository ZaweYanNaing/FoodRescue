import axios from 'axios';

/**
 * Configured Axios instance for the Food Rescue API.
 *
 * - Base URL points to the Laravel backend.
 * - Automatically attaches the Sanctum Bearer token from localStorage.
 * - Sends JSON and accepts JSON by default.
 */
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// ── Request interceptor: attach token if present ──────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sanctum_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ── Response interceptor: clear token on 401 Unauthorized ────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('sanctum_token');
            localStorage.removeItem('auth_user');
        }

        return Promise.reject(error);
    },
);

export default api;
