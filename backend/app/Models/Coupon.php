<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    protected $fillable = ['code', 'type', 'value', 'minimum_amount', 'starts_at', 'expires_at', 'usage_limit', 'per_user_limit', 'used_count', 'active'];

    protected $casts = ['active' => 'boolean', 'value' => 'integer', 'minimum_amount' => 'integer', 'starts_at' => 'datetime', 'expires_at' => 'datetime', 'usage_limit' => 'integer', 'per_user_limit' => 'integer', 'used_count' => 'integer'];

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    public function isAvailable(int $subtotal, ?User $user = null): bool
    {
        if (! $this->active || $subtotal < $this->minimum_amount) {
            return false;
        }

        if (($this->starts_at && now()->lt($this->starts_at)) || ($this->expires_at && now()->gt($this->expires_at))) {
            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return ! ($user && $this->per_user_limit !== null
            && $this->usages()->where('user_id', $user->id)->count() >= $this->per_user_limit);
    }

    public function discount(int $subtotal): int
    {
        $discount = match ($this->type) {
            'percent' => intdiv($subtotal * min($this->value, 100), 100),
            'fixed' => $this->value,
            default => 0,
        };

        return min($subtotal, $discount);
    }
}
