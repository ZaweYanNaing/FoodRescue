<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DonationController extends Controller
{
    /**
     * index(): Return all donations where status is 'available'.
     * Public – no auth required.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Donation::with(['donor:id,name,address'])->latest();

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('donor_id')) {
            $query->where('donor_id', $request->query('donor_id'));
        }

        return response()->json($query->get());
    }

    /**
     * store(): Create a new donation, auto-assigning the logged-in user as the donor.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'pickup_time_limit' => ['required', 'date', 'after:now'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $donation = Donation::create([
            ...$validated,
            'donor_id' => $user->id,
            'status' => 'available',
        ]);

        return response()->json($donation->load('donor:id,name,address'), 201);
    }

    /**
     * show(): Get a specific donation with its donor and volunteer details.
     */
    public function show(Donation $donation): JsonResponse
    {
        return response()->json(
            $donation->load(['donor:id,name,address', 'volunteer:id,name'])
        );
    }

    /**
     * update(): Allow only the original donor to edit title / description.
     */
    public function update(Request $request, Donation $donation): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($donation->donor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden. Only the donor can edit this donation.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $donation->update($validated);

        return response()->json($donation->fresh());
    }

    /**
     * updateStatus(): Allow a volunteer to claim or mark as delivered.
     *
     * Transitions allowed:
     *   available  → claimed    (volunteer claims it; sets volunteer_id)
     *   claimed    → picked_up  (volunteer marks as picked up)
     *   picked_up  → delivered  (volunteer marks as delivered)
     */
    public function updateStatus(Request $request, Donation $donation): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role !== 'volunteer') {
            return response()->json(['message' => 'Forbidden. Only volunteers can update the donation status.'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:claimed,picked_up,delivered'],
        ]);

        $newStatus = $validated['status'];

        // Guard valid transitions
        $allowedTransitions = [
            'available' => 'claimed',
            'claimed' => 'picked_up',
            'picked_up' => 'delivered',
        ];

        if (($allowedTransitions[$donation->status] ?? null) !== $newStatus) {
            return response()->json([
                'message' => "Cannot transition from '{$donation->status}' to '{$newStatus}'.",
            ], 422);
        }

        $updateData = ['status' => $newStatus];

        // Attach volunteer when claiming
        if ($newStatus === 'claimed') {
            $updateData['volunteer_id'] = $user->id;
        }

        $donation->update($updateData);

        return response()->json($donation->fresh()->load(['donor:id,name', 'volunteer:id,name']));
    }

    /**
     * destroy(): Allow the donor to cancel/delete their own donation.
     * Only donations with status 'available' or 'canceled' can be deleted.
     */
    public function destroy(Request $request, Donation $donation): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($donation->donor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden. Only the donor can delete this donation.'], 403);
        }

        if (! in_array($donation->status, ['available'])) {
            return response()->json([
                'message' => 'Cannot cancel a donation that has already been claimed or is in transit.',
            ], 422);
        }

        $donation->update(['status' => 'canceled']);

        return response()->json(['message' => 'Donation canceled successfully.', 'donation' => $donation->fresh()], 200);
    }
}
