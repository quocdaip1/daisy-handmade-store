<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled', 'returned'];

    public const PAYMENT_STATUSES = ['unpaid', 'pending_verification', 'paid', 'failed', 'refunded'];

    protected $fillable = ['number', 'user_id', 'coupon_id', 'shipping_method_id', 'status', 'payment_method', 'payment_status', 'customer_name', 'customer_email', 'customer_phone', 'shipping_address', 'note', 'subtotal', 'discount', 'shipping_fee', 'total', 'tracking_number'];

    protected $casts = ['subtotal' => 'integer', 'discount' => 'integer', 'shipping_fee' => 'integer', 'total' => 'integer'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }
}
