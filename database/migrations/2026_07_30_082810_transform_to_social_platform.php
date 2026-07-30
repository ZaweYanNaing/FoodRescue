<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ── 1. Users: drop fixed role, add social fields ──────────────────
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
            $table->text('bio')->nullable()->after('address');
            $table->string('avatar_path')->nullable()->after('bio');
        });

        // ── 2. Drop old tables ────────────────────────────────────────────
        Schema::dropIfExists('messages');
        Schema::dropIfExists('donations');

        // ── 3. Donation Issues ────────────────────────────────────────────
        Schema::create('donation_issues', function (Blueprint $table) {
            $table->id();

            $table->foreignId('creator_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->dateTime('deadline');

            $table->enum('status', ['open', 'in_progress', 'completed', 'closed'])
                ->default('open');

            $table->string('cover_image_path')->nullable();

            $table->timestamps();

            $table->index(['status', 'deadline']);
        });

        // ── 4. Food Pledges ───────────────────────────────────────────────
        Schema::create('food_pledges', function (Blueprint $table) {
            $table->id();

            $table->foreignId('donation_issue_id')
                ->constrained('donation_issues')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('food_type');
            $table->string('quantity');

            $table->enum('status', ['pledged', 'delivered', 'cancelled'])
                ->default('pledged');

            $table->text('note')->nullable();

            $table->timestamps();
        });

        // ── 5. Issue Comments ─────────────────────────────────────────────
        Schema::create('issue_comments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('donation_issue_id')
                ->constrained('donation_issues')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->text('body');
            $table->string('image_path')->nullable();

            $table->timestamps();
        });

        // ── 6. Friendships ────────────────────────────────────────────────
        Schema::create('friendships', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sender_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('receiver_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('status', ['pending', 'accepted', 'rejected'])
                ->default('pending');

            $table->timestamps();

            $table->unique(['sender_id', 'receiver_id']);
        });

        // ── 7. Private Messages ───────────────────────────────────────────
        Schema::create('private_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sender_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('receiver_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->text('body');
            $table->string('image_path')->nullable();
            $table->dateTime('read_at')->nullable();

            $table->timestamps();

            $table->index(['sender_id', 'receiver_id', 'created_at']);
        });

        // ── 8. Polymorphic Images ─────────────────────────────────────────
        Schema::create('images', function (Blueprint $table) {
            $table->id();

            $table->morphs('imageable');

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('path');
            $table->string('caption')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('images');
        Schema::dropIfExists('private_messages');
        Schema::dropIfExists('friendships');
        Schema::dropIfExists('issue_comments');
        Schema::dropIfExists('food_pledges');
        Schema::dropIfExists('donation_issues');

        // Re-create old tables
        Schema::create('donations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('volunteer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('pickup_time_limit');
            $table->enum('status', ['available', 'claimed', 'picked_up', 'delivered', 'canceled'])->default('available');
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'avatar_path']);
            $table->enum('role', ['donor', 'volunteer'])->default('donor')->after('password');
        });
    }
};
