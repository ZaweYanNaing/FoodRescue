import { Head } from '@inertiajs/react';
import axios from 'axios';
import { CalendarClock, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface Donation {
    id: number;
    donor_id: number;
    volunteer_id: number | null;
    title: string;
    description: string | null;
    pickup_time_limit: string; // ISO 8601 datetime
    status: 'available' | 'claimed' | 'picked_up' | 'delivered' | 'canceled';
    created_at: string;
    updated_at: string;
}

type DonationFormData = {
    title: string;
    description: string;
    pickup_time_limit: string; // local datetime-local string
};

type FormErrors = Partial<Record<keyof DonationFormData | 'general', string>>;

// ──────────────────────────────────────────────────────────────────────────────
// Status badge colours
// ──────────────────────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<Donation['status'], string> = {
    available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    claimed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    picked_up: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    delivered: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
    canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABEL: Record<Donation['status'], string> = {
    available: 'Available',
    claimed: 'Claimed',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    canceled: 'Canceled',
};

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Convert an ISO datetime string to the value format required by <input type="datetime-local"> */
function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Return a clean API error message from an Axios error. */
function extractApiError(err: unknown, fallback = 'Something went wrong.'): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data?.message === 'string') {
            return data.message;
        }
    }

    return fallback;
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-component: Donation Form (shared by Create & Edit dialogs)
// ──────────────────────────────────────────────────────────────────────────────

interface DonationFormProps {
    initial?: Partial<DonationFormData>;
    errors: FormErrors;
    processing: boolean;
    onSubmit: (data: DonationFormData) => void;
    onCancel: () => void;
    submitLabel: string;
}

function DonationForm({
    initial,
    errors,
    processing,
    onSubmit,
    onCancel,
    submitLabel,
}: DonationFormProps) {
    const formRef = useRef<HTMLFormElement>(null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formRef.current) {
            return;
        }

        const f = formRef.current;
        onSubmit({
            title: (f.elements.namedItem('title') as HTMLInputElement).value,
            description: (f.elements.namedItem('description') as HTMLTextAreaElement).value,
            pickup_time_limit: (f.elements.namedItem('pickup_time_limit') as HTMLInputElement).value,
        });
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5">
            {/* Title */}
            <div className="grid gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Fresh vegetables from the garden"
                    defaultValue={initial?.title ?? ''}
                    required
                    autoFocus
                />
                {errors.title && (
                    <p className="text-xs text-destructive">{errors.title}</p>
                )}
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                    id="description"
                    name="description"
                    placeholder="Describe the food items, quantity, condition…"
                    defaultValue={initial?.description ?? ''}
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                {errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                )}
            </div>

            {/* Pickup time limit */}
            <div className="grid gap-1.5">
                <Label htmlFor="pickup_time_limit">Pickup Deadline</Label>
                <Input
                    id="pickup_time_limit"
                    name="pickup_time_limit"
                    type="datetime-local"
                    defaultValue={initial?.pickup_time_limit ?? ''}
                    required
                />
                {errors.pickup_time_limit && (
                    <p className="text-xs text-destructive">{errors.pickup_time_limit}</p>
                )}
            </div>

            {errors.general && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {errors.general}
                </p>
            )}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing && <Spinner />}
                    {submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export default function DonorDashboard() {
    const user = getStoredUser();

    // State
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    // Create modal
    const [createOpen, setCreateOpen] = useState(false);
    const [createErrors, setCreateErrors] = useState<FormErrors>({});
    const [creating, setCreating] = useState(false);

    // Edit modal
    const [editTarget, setEditTarget] = useState<Donation | null>(null);
    const [editErrors, setEditErrors] = useState<FormErrors>({});
    const [editing, setEditing] = useState(false);

    // Delete
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // ── Fetch donor's own donations on mount ──────────────────────────────
    useEffect(() => {
        api.get<Donation[]>('/donations')
            .then(({ data }) => {
                // Filter client-side to only show this donor's donations
                const mine = user
                    ? data.filter((d) => d.donor_id === user.id)
                    : data;
                setDonations(mine);
            })
            .finally(() => setLoading(false));
    }, [user?.id]);

    // ── Create ────────────────────────────────────────────────────────────
    async function handleCreate(data: DonationFormData) {
        setCreateErrors({});
        setCreating(true);

        try {
            const { data: created } = await api.post<Donation>('/donations', {
                ...data,
                // Convert local datetime to ISO for the API
                pickup_time_limit: new Date(data.pickup_time_limit).toISOString(),
            });

            setDonations((prev) => [created, ...prev]);
            setCreateOpen(false);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 422) {
                const raw = err.response.data?.errors ?? {};
                const mapped: FormErrors = {};
                for (const [field, messages] of Object.entries(raw)) {
                    mapped[field as keyof FormErrors] = (messages as string[])[0];
                }
                setCreateErrors(mapped);
            } else {
                setCreateErrors({ general: extractApiError(err) });
            }
        } finally {
            setCreating(false);
        }
    }

    // ── Edit ──────────────────────────────────────────────────────────────
    async function handleEdit(data: DonationFormData) {
        if (!editTarget) {
            return;
        }

        setEditErrors({});
        setEditing(true);

        try {
            const { data: updated } = await api.patch<Donation>(`/donations/${editTarget.id}`, {
                title: data.title,
                description: data.description || null,
            });

            setDonations((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            setEditTarget(null);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 422) {
                const raw = err.response.data?.errors ?? {};
                const mapped: FormErrors = {};
                for (const [field, messages] of Object.entries(raw)) {
                    mapped[field as keyof FormErrors] = (messages as string[])[0];
                }
                setEditErrors(mapped);
            } else {
                setEditErrors({ general: extractApiError(err) });
            }
        } finally {
            setEditing(false);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────
    async function handleDelete(donation: Donation) {
        if (
            !window.confirm(
                `Are you sure you want to cancel "${donation.title}"? This cannot be undone.`,
            )
        ) {
            return;
        }

        setDeletingId(donation.id);

        try {
            await api.delete(`/donations/${donation.id}`);
            setDonations((prev) => prev.filter((d) => d.id !== donation.id));
        } catch (err) {
            alert(extractApiError(err, 'Could not delete the donation. Please try again.'));
        } finally {
            setDeletingId(null);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <>
            <Head title="Donor Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* ── Header ── */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome back, {user?.name ?? 'Donor'} 👋
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage your food donations below.
                        </p>
                    </div>

                    {/* Create Donation button */}
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button id="create-donation-btn">
                                <PlusCircle />
                                New Donation
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create a New Donation</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below and volunteers will be notified.
                                </DialogDescription>
                            </DialogHeader>
                            <DonationForm
                                errors={createErrors}
                                processing={creating}
                                onSubmit={handleCreate}
                                onCancel={() => setCreateOpen(false)}
                                submitLabel="Create Donation"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* ── Stats strip ── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {(['available', 'claimed', 'delivered', 'canceled'] as const).map((status) => (
                        <div
                            key={status}
                            className="flex flex-col gap-1 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                        >
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {STATUS_LABEL[status]}
                            </span>
                            <span className="text-2xl font-bold">
                                {donations.filter((d) => d.status === status).length}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── Donation cards ── */}
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-44 rounded-xl" />
                        ))}
                    </div>
                ) : donations.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-sidebar-border/70 py-16 text-center dark:border-sidebar-border">
                        <p className="text-muted-foreground">You have no donations yet.</p>
                        <Button
                            variant="outline"
                            onClick={() => setCreateOpen(true)}
                            id="create-donation-empty-btn"
                        >
                            <PlusCircle />
                            Create your first donation
                        </Button>
                    </div>
                ) : (
                    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {donations.map((donation) => (
                            <li
                                key={donation.id}
                                className="flex flex-col gap-3 rounded-xl border border-sidebar-border/70 bg-card p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-sidebar-border"
                            >
                                {/* Card header */}
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-semibold leading-snug">{donation.title}</p>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[donation.status]}`}
                                    >
                                        {STATUS_LABEL[donation.status]}
                                    </span>
                                </div>

                                {/* Description */}
                                {donation.description && (
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {donation.description}
                                    </p>
                                )}

                                {/* Pickup deadline */}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <CalendarClock className="size-3.5" />
                                    <span>
                                        Pickup by{' '}
                                        <span className="font-medium text-foreground">
                                            {new Date(donation.pickup_time_limit).toLocaleString()}
                                        </span>
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto flex gap-2 pt-2">
                                    {/* Edit – only allowed when still available */}
                                    <Dialog
                                        open={editTarget?.id === donation.id}
                                        onOpenChange={(open) => {
                                            if (!open) {
                                                setEditTarget(null);
                                                setEditErrors({});
                                            }
                                        }}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={donation.status !== 'available'}
                                                onClick={() => {
                                                    setEditErrors({});
                                                    setEditTarget(donation);
                                                }}
                                                id={`edit-donation-${donation.id}`}
                                            >
                                                <Pencil />
                                                Edit
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Donation</DialogTitle>
                                                <DialogDescription>
                                                    Update the title or description of this donation.
                                                </DialogDescription>
                                            </DialogHeader>
                                            {editTarget && (
                                                <DonationForm
                                                    initial={{
                                                        title: editTarget.title,
                                                        description: editTarget.description ?? '',
                                                        pickup_time_limit: toDatetimeLocal(
                                                            editTarget.pickup_time_limit,
                                                        ),
                                                    }}
                                                    errors={editErrors}
                                                    processing={editing}
                                                    onSubmit={handleEdit}
                                                    onCancel={() => {
                                                        setEditTarget(null);
                                                        setEditErrors({});
                                                    }}
                                                    submitLabel="Save Changes"
                                                />
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    {/* Delete / Cancel */}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={
                                            !['available', 'canceled'].includes(donation.status) ||
                                            deletingId === donation.id
                                        }
                                        onClick={() => handleDelete(donation)}
                                        id={`delete-donation-${donation.id}`}
                                    >
                                        {deletingId === donation.id ? (
                                            <Spinner />
                                        ) : (
                                            <Trash2 />
                                        )}
                                        {deletingId === donation.id ? 'Deleting…' : 'Cancel'}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ── Edit Dialog (portal-level fallback for TypeScript) ── */}
        </>
    );
}

DonorDashboard.layout = {
    breadcrumbs: [{ title: 'Donor Dashboard', href: '/donor/dashboard' }],
};
