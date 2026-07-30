export type UserRole = 'donor' | 'volunteer';

export type User = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    address?: string | null;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

// ── Sanctum API response shapes ───────────────────────────────────────────

/** Shape returned by POST /api/login and POST /api/register */
export type AuthApiResponse = {
    user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'address'>;
    token: string;
};

/** Minimal stored user kept in localStorage */
export type StoredUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;


/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
