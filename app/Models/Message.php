<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $donation_id
 * @property int $sender_id
 * @property string $content
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Donation $donation
 * @property-read User $sender
 */
class Message extends Model
{
    use HasFactory;

    protected $fillable = ['donation_id', 'sender_id', 'content'];

    /**
     * The donation this message belongs to.
     *
     * @return BelongsTo<Donation, $this>
     */
    public function donation(): BelongsTo
    {
        return $this->belongsTo(Donation::class);
    }

    /**
     * The user who sent this message.
     *
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
