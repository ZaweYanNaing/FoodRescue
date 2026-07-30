import { Head } from '@inertiajs/react';
import {
    CalendarClock,
    Leaf,
    MapPin,
    MessageCircle,
    Search,
    User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import DonationChat from '@/components/DonationChat';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

type Donation = {
    id: number;
    title: string;
    description: string | null;
    pickup_time_limit: string;
    status: string;
    donor: { id: number; name: string; address: string | null };
};

export default function VolunteerFeed() {
    const user = getStoredUser();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [chatTarget, setChatTarget] = useState<Donation | null>(null);

    useEffect(() => {
        api.get<Donation[]>('/donations?status=available')
            .then(({ data }) => setDonations(data))
            .finally(() => setLoading(false));
    }, []);

    async function claimDonation(id: number) {
        setClaimingId(id);

        try {
            await api.patch(`/donations/${id}/status`, { status: 'claimed' });
            // Remove from feed once claimed
            setDonations((prev) => prev.filter((d) => d.id !== id));
        } catch {
            alert('Could not claim donation. Please try again.');
        } finally {
            setClaimingId(null);
        }
    }

    const filteredDonations = donations.filter((donation) => {
        const query = searchQuery.toLowerCase();
        return (
            donation.title.toLowerCase().includes(query) ||
            donation.description?.toLowerCase().includes(query)
        );
    });

    return (
        <>
            <Head title="Volunteer Feed" />

            <div className="flex min-h-[calc(100vh-4rem)] flex-col">
                {/* ── Hero Banner ── */}
                <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 px-4 py-12 sm:px-6 lg:px-8">
                    {/* Background pattern */}
                    <div className="pointer-events-none absolute inset-0 opacity-10">
                        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
                        <div className="absolute -bottom-8 -left-8 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
                        <div className="absolute left-1/3 top-1/3 h-32 w-32 rounded-full bg-yellow-300/20 blur-2xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl">
                        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-emerald-100/80">
                            Volunteer Feed
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Available Donations{' '}
                            <span className="inline-block">🌱</span>
                        </h1>
                        <p className="mt-2 max-w-xl text-base text-emerald-100/70">
                            Hey {user?.name ?? 'Volunteer'}! Claim a donation to start the
                            pickup &amp; delivery process and make an impact.
                        </p>

                        {/* Search bar */}
                        <div className="relative mt-8 max-w-lg">
                            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/50" />
                            <input
                                type="text"
                                placeholder="Search by title or description..."
                                className="w-full rounded-2xl border border-white/20 bg-white/15 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/50 backdrop-blur-md transition-all focus:border-white/40 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* ── Main Content ── */}
                <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                    {/* Section heading */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold tracking-tight">
                            {loading
                                ? 'Loading...'
                                : `${filteredDonations.length} donation${filteredDonations.length !== 1 ? 's' : ''} available`}
                        </h2>
                        {searchQuery && !loading && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Showing results for "{searchQuery}"
                            </p>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-56 rounded-2xl" />
                            ))}
                        </div>
                    ) : donations.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 py-20 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <Leaf className="size-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-medium">
                                    No available donations right now
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Check back soon — new donations appear frequently!
                                </p>
                            </div>
                        </div>
                    ) : filteredDonations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-16 text-center">
                            <Search className="size-10 text-muted-foreground/40" />
                            <p className="text-muted-foreground">
                                No donations found matching "{searchQuery}".
                            </p>
                        </div>
                    ) : (
                        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredDonations.map((donation) => (
                                <li
                                    key={donation.id}
                                    className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    {/* Title */}
                                    <div>
                                        <p className="text-base font-semibold leading-snug">
                                            {donation.title}
                                        </p>
                                        {donation.description && (
                                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                                {donation.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Meta info */}
                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <User className="size-3.5 text-primary/60" />
                                            <span>
                                                Donor:{' '}
                                                <span className="font-medium text-foreground">
                                                    {donation.donor.name}
                                                </span>
                                            </span>
                                        </div>
                                        {donation.donor.address && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="size-3.5 text-primary/60" />
                                                <span>{donation.donor.address}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <CalendarClock className="size-3.5 text-primary/60" />
                                            <span>
                                                Pick up by{' '}
                                                <span className="font-medium text-foreground">
                                                    {new Date(donation.pickup_time_limit).toLocaleString()}
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto flex gap-2 border-t border-border/40 pt-3">
                                        <button
                                            onClick={() => claimDonation(donation.id)}
                                            disabled={claimingId === donation.id}
                                            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-green-700 hover:shadow-md disabled:opacity-50"
                                        >
                                            {claimingId === donation.id
                                                ? 'Claiming…'
                                                : '🤝 Claim Donation'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

VolunteerFeed.layout = {
    breadcrumbs: [{ title: 'Volunteer Feed', href: '/volunteer/feed' }],
};
