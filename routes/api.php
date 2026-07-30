<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DonationController;
use App\Http\Controllers\Api\MessageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All routes here are automatically prefixed with /api and have the
| 'api' middleware group applied (throttle, stateless, etc.)
|
*/

// ──────────────────────────────────────────────────────────────────────────
// Public routes (no authentication required)
// ──────────────────────────────────────────────────────────────────────────

// Auth
Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');

// Browse available donations without logging in
Route::get('/donations', [DonationController::class, 'index'])->name('api.donations.index');
Route::get('/donations/{donation}', [DonationController::class, 'show'])->name('api.donations.show');

// ──────────────────────────────────────────────────────────────────────────
// Protected routes (Sanctum token required)
// ──────────────────────────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');

    // Donations – create / edit / delete (donor actions)
    Route::post('/donations', [DonationController::class, 'store'])->name('api.donations.store');
    Route::patch('/donations/{donation}', [DonationController::class, 'update'])->name('api.donations.update');
    Route::delete('/donations/{donation}', [DonationController::class, 'destroy'])->name('api.donations.destroy');

    // Donations – status transitions (volunteer actions)
    Route::patch('/donations/{donation}/status', [DonationController::class, 'updateStatus'])->name('api.donations.updateStatus');

    // Chat (donor and volunteer communication)
    Route::get('/donations/{donation}/messages', [MessageController::class, 'index'])->name('api.messages.index');
    Route::post('/donations/{donation}/messages', [MessageController::class, 'store'])->name('api.messages.store');
});
