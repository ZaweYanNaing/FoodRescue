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
};

export default function DonorDashboard() {
    const user = getStoredUser();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<Donation[]>('/donations')
            .then(({ data }) => setDonations(data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Head title="Donor Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Welcome back, {user?.name ?? 'Donor'} 👋
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your food donations below.
                    </p>
                </div>

                {loading ? (
                    <p className="text-sm text-muted-foreground">Loading donations…</p>
                ) : donations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        You have no active donations. Create one to get started!
                    </p>
                ) : (
                    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {donations.map((donation) => (
                            <li
                                key={donation.id}
                                className="rounded-xl border border-sidebar-border/70 p-4 shadow-xs dark:border-sidebar-border"
                            >
                                <p className="font-medium">{donation.title}</p>
                                {donation.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {donation.description}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Pick up by:{' '}
                                    {new Date(donation.pickup_time_limit).toLocaleString()}
                                </p>
                                <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    {donation.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

DonorDashboard.layout = {
    breadcrumbs: [{ title: 'Donor Dashboard', href: '/donor/dashboard' }],
};
