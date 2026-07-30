import { router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import api from '@/lib/api';
import { storeAuth } from '@/lib/auth';
import { login } from '@/routes';
import type { AuthApiResponse, UserRole } from '@/types/auth';

type Props = {
    passwordRules: string;
};

type FormErrors = Partial<Record<'name' | 'email' | 'password' | 'password_confirmation' | 'role' | 'address' | 'general', string>>;

export default function Register({ passwordRules }: Props) {
    const [errors, setErrors] = useState<FormErrors>({});
    const [processing, setProcessing] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});
        setProcessing(true);

        const form = e.currentTarget;
        const getValue = (name: string) =>
            (form.elements.namedItem(name) as HTMLInputElement)?.value ?? '';

        const payload = {
            name: getValue('name'),
            email: getValue('email'),
            password: getValue('password'),
            password_confirmation: getValue('password_confirmation'),
            role: getValue('role') as UserRole,
            address: getValue('address') || undefined,
        };

        try {
            const { data } = await api.post<AuthApiResponse>('/register', payload);

            storeAuth(data.token, {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
            });

            if (data.user.role === 'donor') {
                router.visit('/donor/dashboard');
            } else {
                router.visit('/volunteer/feed');
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 422) {
                // Map Laravel validation errors (each field is an array)
                const raw = err.response.data?.errors ?? {};
                const mapped: FormErrors = {};

                for (const [field, messages] of Object.entries(raw)) {
                    mapped[field as keyof FormErrors] = (messages as string[])[0];
                }

                setErrors(mapped);
            } else {
                setErrors({ general: 'Something went wrong. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <>
            <Head title="Register" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    {/* Role */}
                    <div className="grid gap-2">
                        <Label htmlFor="role">I want to join as</Label>
                        <select
                            id="role"
                            name="role"
                            required
                            tabIndex={3}
                            defaultValue="donor"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="donor">Donor — I want to donate food</option>
                            <option value="volunteer">Volunteer — I want to collect &amp; deliver</option>
                        </select>
                        <InputError message={errors.role} />
                    </div>

                    {/* Address */}
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address (optional)</Label>
                        <Input
                            id="address"
                            type="text"
                            name="address"
                            tabIndex={4}
                            autoComplete="street-address"
                            placeholder="123 Main St, City"
                        />
                        <InputError message={errors.address} />
                    </div>

                    {/* Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            required
                            tabIndex={5}
                            autoComplete="new-password"
                            placeholder="Password"
                            passwordrules={passwordRules}
                        />
                        <InputError message={errors.password} />
                    </div>

                    {/* Confirm Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            required
                            tabIndex={6}
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            passwordrules={passwordRules}
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    {errors.general && (
                        <p className="text-sm text-destructive">{errors.general}</p>
                    )}

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={7}
                        disabled={processing}
                        data-test="register-user-button"
                    >
                        {processing && <Spinner />}
                        Create account
                    </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={login()} tabIndex={8}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
