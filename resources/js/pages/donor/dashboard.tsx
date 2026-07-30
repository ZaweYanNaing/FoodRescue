import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    CalendarClock,
    HandHeart,
    MessageCircle,
    Package,
    Pencil,
    PlusCircle,
    Sparkles,
    Trash2,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DonationChat from '@/components/DonationChat';
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
// Status badge config
// ──────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    Donation['status'],
    { label: string; classes: string; icon: React.ElementType }
> = {
    available: {
        label: 'Available',
        classes: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-400/20',
        icon: Sparkles,
    },
    claimed: {
        label: 'Claimed',
        classes: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400 dark:ring-sky-400/20',
        icon: HandHeart,
    },
    picked_up: {
        label: 'Picked Up',
        classes: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400 dark:ring-amber-400/20',
        icon: Package,
    },
    delivered: {
        label: 'Delivered',
        classes: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-400 dark:ring-violet-400/20',
        icon: TrendingUp,
    },
    canceled: {
        label: 'Canceled',
        classes: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-400 dark:ring-red-400/20',
        icon: XCircle,
    },
};

// ──────────────────────────────────────────────────────────────────────────────
// Stat card config
// ──────────────────────────────────────────────────────────────────────────────

const STAT_CARDS: {
    status: Donation['status'];
    gradient: string;
    iconBg: string;
}[] = [
    {
        status: 'available',
        gradient: 'from-emerald-500 to-green-600',
        iconBg: 'bg-white/20',
    },
    {
        status: 'claimed',
        gradient: 'from-sky-500 to-blue-600',
        iconBg: 'bg-white/20',
    },
    {
        status: 'delivered',
        gradient: 'from-violet-500 to-purple-600',
        iconBg: 'bg-white/20',
    },
    {
        status: 'canceled',
        gradient: 'from-rose-500 to-red-600',
        iconBg: 'bg-white/20',
    },
];

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
                    className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
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

    // Chat modal
    const [chatTarget, setChatTarget] = useState<Donation | null>(null);

    // Delete
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // ── Fetch donor's own donations on mount ──────────────────────────────
    useEffect(() => {
        if (!user) return;

        api.get<Donation[]>(`/donations?donor_id=${user.id}`)
            .then(({ data }) => {
                setDonations(data);
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
            // Update status to canceled instead of removing from UI
            setDonations((prev) =>
                prev.map((d) => (d.id === donation.id ? { ...d, status: 'canceled' } : d))
            );
        } catch (err) {
            alert(extractApiError(err, 'Could not delete the donation. Please try again.'));
        } finally {
            setDeletingId(null);
        }
    }

    const totalDonations = donations.length;

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <>
            <Head title="Donor Dashboard" />

            <div className="flex min-h-[calc(100vh-4rem)] flex-col">
                {/* ── Hero Banner ── */}
                <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 px-4 py-12 sm:px-6 lg:px-8">
                    {/* Background pattern */}
                    <div className="pointer-events-none absolute inset-0 opacity-10">
                        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-white/15 blur-2xl" />
                        <div className="absolute right-1/4 top-1/2 h-40 w-40 rounded-full bg-yellow-300/20 blur-2xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl">
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <p className="mb-2 text-sm font-medium uppercase tracking-wider text-emerald-100/80">
                                    Donor Dashboard
                                </p>
                                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                    Welcome back, {user?.name ?? 'Donor'}{' '}
                                    <span className="inline-block animate-bounce">👋</span>
                                </h1>
                                <p className="mt-2 max-w-xl text-base text-emerald-100/70">
                                    Manage your food donations and help reduce waste in your
                                    community. Every donation counts!
                                </p>
                            </div>

                            {/* Create Donation button */}
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        id="create-donation-btn"
                                        size="lg"
                                        className="gap-2 rounded-xl bg-white text-emerald-700 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl"
                                    >
                                        <PlusCircle className="size-5" />
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

                        {/* Stats row inside hero */}
                        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                            {STAT_CARDS.map(({ status, gradient, iconBg }) => {
                                const config = STATUS_CONFIG[status];
                                const Icon = config.icon;
                                const count = donations.filter((d) => d.status === status).length;

                                return (
                                    <div
                                        key={status}
                                        className="glass group relative overflow-hidden rounded-2xl p-4 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                                                    {config.label}
                                                </p>
                                                <p className="mt-1 text-3xl font-bold text-white">
                                                    {count}
                                                </p>
                                            </div>
                                            <div className={`rounded-xl ${iconBg} p-2.5`}>
                                                <Icon className="size-5 text-white/80" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Main Content ── */}
                <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                    {/* Section heading */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                Your Donations
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {totalDonations} donation{totalDonations !== 1 ? 's' : ''} total
                            </p>
                        </div>
                    </div>

                    {/* Donation cards */}
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-52 rounded-2xl" />
                            ))}
                        </div>
                    ) : donations.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 py-20 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <HandHeart className="size-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-medium">No donations yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Create your first donation and start rescuing food!
                                </p>
                            </div>
                            <Button
                                onClick={() => setCreateOpen(true)}
                                id="create-donation-empty-btn"
                                className="gap-2 rounded-xl"
                            >
                                <PlusCircle className="size-4" />
                                Create your first donation
                            </Button>
                        </div>
                    ) : (
                        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {donations.map((donation) => {
                                const statusCfg = STATUS_CONFIG[donation.status];
                                const StatusIcon = statusCfg.icon;

                                return (
                                    <li
                                        key={donation.id}
                                        className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        {/* Card header */}
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-base font-semibold leading-snug">
                                                {donation.title}
                                            </p>
                                            <span
                                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusCfg.classes}`}
                                            >
                                                <StatusIcon className="size-3" />
                                                {statusCfg.label}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        {donation.description && (
                                            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                {donation.description}
                                            </p>
                                        )}

                                        {/* Pickup deadline */}
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <CalendarClock className="size-3.5 text-primary/60" />
                                            <span>
                                                Pickup by{' '}
                                                <span className="font-medium text-foreground">
                                                    {new Date(donation.pickup_time_limit).toLocaleString()}
                                                </span>
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto flex flex-wrap gap-2 border-t border-border/40 pt-3">
                                            {/* Chat Dialog */}
                                            <Dialog
                                                open={chatTarget?.id === donation.id}
                                                onOpenChange={(open) => {
                                                    if (!open) setChatTarget(null);
                                                }}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={!['claimed', 'picked_up'].includes(donation.status)}
                                                        onClick={() => setChatTarget(donation)}
                                                        id={`chat-donation-${donation.id}`}
                                                        className="gap-1.5 rounded-lg"
                                                    >
                                                        <MessageCircle className="size-3.5" />
                                                        Chat
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-md">
                                                    {chatTarget?.id === donation.id && (
                                                        <DonationChat donationId={donation.id} />
                                                    )}
                                                </DialogContent>
                                            </Dialog>

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
                                                        className="gap-1.5 rounded-lg"
                                                    >
                                                        <Pencil className="size-3.5" />
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
                                                className="gap-1.5 rounded-lg"
                                            >
                                                {deletingId === donation.id ? (
                                                    <Spinner />
                                                ) : (
                                                    <Trash2 className="size-3.5" />
                                                )}
                                                {deletingId === donation.id ? 'Deleting…' : 'Cancel'}
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

DonorDashboard.layout = {
    breadcrumbs: [{ title: 'Donor Dashboard', href: '/donor/dashboard' }],
};
