<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['method', 'status', 'transaction_reference', 'amount', 'metadata'];

    protected $casts = ['amount' => 'integer', 'metadata' => 'array'];
}
