<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Get all messages for a donation.
     */
    public function index(Donation $donation, Request $request): JsonResponse
    {
        // Authorization: only the donor or the assigned volunteer can view messages
        if ($donation->donor_id !== $request->user()->id && $donation->volunteer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized access to this chat.'], 403);
        }

        $messages = $donation->messages()->with('sender:id,name')->orderBy('created_at', 'asc')->get();

        return response()->json($messages);
    }

    /**
     * Post a new message to a donation chat.
     */
    public function store(Donation $donation, Request $request): JsonResponse
    {
        // Authorization: only the donor or the assigned volunteer can post messages
        if ($donation->donor_id !== $request->user()->id && $donation->volunteer_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized access to this chat.'], 403);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $message = $donation->messages()->create([
            'sender_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Eager load the sender information to return it immediately
        $message->load('sender:id,name');

        return response()->json($message, 201);
    }
}
