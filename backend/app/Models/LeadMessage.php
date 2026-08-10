<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadMessage extends Model
{
    public const SENDER_TEAM = 'team';
    public const SENDER_CUSTOMER = 'customer';
    public const SENDER_SYSTEM = 'system';

    public const SENDER_TYPES = [
        self::SENDER_TEAM,
        self::SENDER_CUSTOMER,
        self::SENDER_SYSTEM,
    ];

    protected $fillable = [
        'lead_id',
        'user_id',
        'sender_type',
        'sender_name',
        'message',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
