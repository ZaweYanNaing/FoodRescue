import { Head, Link } from '@inertiajs/react';
import { HandHeart, Leaf, Truck } from 'lucide-react';
import { dashboard } from '@/routes';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex min-h-[calc(100vh-4rem)] flex-col">
                {/* Hero section */}
                <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 px-4 py-20 text-center sm:px-6 lg:px-8">
                    {/* Background decorations */}
                    <div className="pointer-events-none absolute inset-0 opacity-10">
                        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
                        <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
                        <div className="absolute left-1/2 top-1/4 h-48 w-48 rounded-full bg-yellow-300/20 blur-2xl" />
                    </div>

                    <div className="relative">
                        {/* Icon */}
                        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                            <Leaf className="size-10 text-white" />
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                            FoodRescue
                        </h1>
                        <p className="mx-auto mt-4 max-w-lg text-lg text-emerald-100/80">
                            Connecting donors with volunteers to reduce food waste and
                            fight hunger in your community.
                        </p>

                        {/* CTA cards */}
                        <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
                            <Link
                                href="/donor/dashboard"
                                className="glass group flex flex-col items-center gap-3 rounded-2xl p-8 text-white transition-all hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="flex size-14 items-center justify-center rounded-xl bg-white/20 transition-colors group-hover:bg-white/30">
                                    <HandHeart className="size-7" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">I'm a Donor</p>
                                    <p className="mt-1 text-sm text-white/70">
                                        Share surplus food with those in need
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="/volunteer/feed"
                                className="glass group flex flex-col items-center gap-3 rounded-2xl p-8 text-white transition-all hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="flex size-14 items-center justify-center rounded-xl bg-white/20 transition-colors group-hover:bg-white/30">
                                    <Truck className="size-7" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">I'm a Volunteer</p>
                                    <p className="mt-1 text-sm text-white/70">
                                        Pick up and deliver donated food
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
