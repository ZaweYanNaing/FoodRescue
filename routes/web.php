<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Donor pages
    Route::inertia('donor/dashboard', 'donor/dashboard')->name('donor.dashboard');

    // Volunteer pages
    Route::inertia('volunteer/feed', 'volunteer/feed')->name('volunteer.feed');
});

require __DIR__.'/settings.php';
