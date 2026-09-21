<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CheckoutPreview extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'payload_hash', 'snapshot', 'expires_at', 'consumed_at'];

    protected $casts = [
        'snapshot' => 'array',
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];
}
