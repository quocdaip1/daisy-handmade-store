<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ValidateCouponRequest;
use App\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CouponController extends Controller
{
    public function __construct(private readonly CouponService $coupons) {}

    public function validateCoupon(ValidateCouponRequest $request): JsonResponse
    {
        $data = $request->validated();
        try {
            $coupon = $this->coupons->validate(
                $data['code'],
                $data['subtotal'],
                auth('sanctum')->user(),
            );
        } catch (ValidationException) {
            return response()->json(['message' => 'Mã giảm giá không hợp lệ.'], 422);
        }

        return response()->json(['data' => [
            'code' => $coupon->code,
            'discount' => $coupon->discount($data['subtotal']),
        ]]);
    }
}
