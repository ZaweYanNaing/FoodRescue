import type { StoredUser } from '@/types/auth';

const TOKEN_KEY = 'sanctum_token';
const USER_KEY = 'auth_user';

/**
 * Persist the Sanctum token and a minimal user object to localStorage.
 */
export function storeAuth(token: string, user: StoredUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Remove all auth data from localStorage (logout).
 */
export function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Retrieve the stored user object, or null if not authenticated.
 */
export function getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as StoredUser;
    } catch {
        return null;
    }
}

/**
 * Check whether a Sanctum token is currently stored.
 */
export function isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
}
