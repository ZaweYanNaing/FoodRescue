import { router } from '@inertiajs/react';
import { Form, Head } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import api from '@/lib/api';
import { storeAuth } from '@/lib/auth';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import type { AuthApiResponse } from '@/types/auth';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    const [apiError, setApiError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    /**
     * Handle direct API login (Sanctum token flow).
     * This is separate from the Inertia/Fortify session flow below.
     */
    async function handleApiLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setApiError(null);
        setProcessing(true);

        const form = e.currentTarget;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;

        try {
            const { data } = await api.post<AuthApiResponse>('/login', { email, password });

            storeAuth(data.token, {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
            });

            // Redirect based on role using Inertia's router
            if (data.user.role === 'donor') {
                router.visit('/donor/dashboard');
            } else {
                router.visit('/volunteer/feed');
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 422) {
                const messages = err.response.data?.errors?.email ?? ['Invalid credentials.'];
                setApiError(messages[0] as string);
            } else {
                setApiError('Something went wrong. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <>
            <Head title="Log in" />

            <PasskeyVerify />

            {/* ── API Login Form (Sanctum token) ── */}
            <form onSubmit={handleApiLogin} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder="email@example.com"
                        />
                        {apiError && <InputError message={apiError} />}
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={request()}
                                    className="ml-auto text-sm"
                                    tabIndex={5}
                                >
                                    Forgot your password?
                                </TextLink>
                            )}
                        </div>
                        <PasswordInput
                            id="password"
                            name="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder="Password"
                        />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember" name="remember" tabIndex={3} />
                        <Label htmlFor="remember">Remember me</Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        tabIndex={4}
                        disabled={processing}
                        data-test="login-button"
                    >
                        {processing && <Spinner />}
                        Log in
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <TextLink href={register()} tabIndex={5}>
                        Sign up
                    </TextLink>
                </div>
            </form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
