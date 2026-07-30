import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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

    useEffect(() => {
        api.get<Donation[]>('/donations')
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

    return (
        <>
            <Head title="Volunteer Feed" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Available Donations, {user?.name ?? 'Volunteer'} 🌱
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Claim a donation to start the pickup &amp; delivery process.
                    </p>
                </div>

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading donations…</p>
                ) : donations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No available donations right now. Check back soon!
                    </p>
                ) : (
                    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {donations.map((donation) => (
                            <li
                                key={donation.id}
                                className="flex flex-col gap-3 rounded-xl border border-sidebar-border/70 p-4 shadow-xs dark:border-sidebar-border"
                            >
                                <div>
                                    <p className="font-medium">{donation.title}</p>
                                    {donation.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {donation.description}
                                        </p>
                                    )}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    <p>
                                        Donor:{' '}
                                        <span className="font-medium text-foreground">
                                            {donation.donor.name}
                                        </span>
                                    </p>
                                    {donation.donor.address && (
                                        <p>📍 {donation.donor.address}</p>
                                    )}
                                    <p>
                                        Pick up by:{' '}
                                        {new Date(donation.pickup_time_limit).toLocaleString()}
                                    </p>
                                </div>

                                <button
                                    onClick={() => claimDonation(donation.id)}
                                    disabled={claimingId === donation.id}
                                    className="mt-auto rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                                >
                                    {claimingId === donation.id ? 'Claiming…' : 'Claim Donation'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

VolunteerFeed.layout = {
    breadcrumbs: [{ title: 'Volunteer Feed', href: '/volunteer/feed' }],
};
