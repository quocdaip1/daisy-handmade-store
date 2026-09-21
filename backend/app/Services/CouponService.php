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

        if (! $coupon) {
            throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá không tồn tại.']);
        }
        if (! $coupon->active) {
            throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá hiện không hoạt động.']);
        }
        if ($coupon->starts_at && now()->lt($coupon->starts_at)) {
            throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá chưa đến thời gian sử dụng.']);
        }
        if ($coupon->expires_at && now()->gt($coupon->expires_at)) {
            throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá đã hết hạn.']);
        }
        if ($subtotal < $coupon->minimum_amount) {
            throw ValidationException::withMessages(['coupon_code' => 'Đơn hàng chưa đạt giá trị tối thiểu để sử dụng mã này.']);
        }
        if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
            throw ValidationException::withMessages(['coupon_code' => 'Mã giảm giá đã hết lượt sử dụng.']);
        }
        if ($user && $coupon->per_user_limit !== null
            && $coupon->usages()->where('user_id', $user->id)->count() >= $coupon->per_user_limit) {
            throw ValidationException::withMessages(['coupon_code' => 'Bạn đã sử dụng hết lượt cho mã giảm giá này.']);
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
