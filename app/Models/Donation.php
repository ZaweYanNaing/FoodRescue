<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $donor_id
 * @property int|null $volunteer_id
 * @property string $title
 * @property string|null $description
 * @property Carbon $pickup_time_limit
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $donor
 * @property-read User|null $volunteer
 */
class Donation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'donor_id',
        'volunteer_id',
        'title',
        'description',
        'pickup_time_limit',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pickup_time_limit' => 'datetime',
        ];
    }

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    /**
     * The donor (User) who posted this donation.
     *
     * @return BelongsTo<User, $this>
     */
    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    /**
     * The volunteer (User) who claimed this donation, if any.
     *
     * @return BelongsTo<User, $this>
     */
    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'volunteer_id');
    }

    /**
     * The messages associated with this donation.
     *
     * @return HasMany<Message, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
