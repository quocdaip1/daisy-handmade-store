<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function validate(string $code, int $subtotal, ?User $user = null, bool $lock = false): Coupon
    {
        $query = Coupon::query()->where('code', strtoupper(trim($code)));
        $coupon = ($lock ? $query->lockForUpdate() : $query)->first();

        if (! $coupon || ! $coupon->isAvailable($subtotal, $user)) {
            throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá không hợp lệ.']);
        }

        return $coupon;
    }

    public function track(Coupon $coupon, User $user, Order $order): void
    {
        $coupon->usages()->create(['user_id' => $user->id, 'order_id' => $order->id]);
        $coupon->increment('used_count');
    }

    public function release(Coupon $coupon, Order $order): void
    {
        $deleted = $coupon->usages()->where('order_id', $order->id)->delete();
        if ($deleted && $coupon->used_count > 0) {
            $coupon->decrement('used_count');
        }
    }
}
