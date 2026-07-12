<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CheckoutPreviewService
{
    public function __construct(private readonly CouponService $coupons) {}

    public function preview(User $user, array $data): array
    {
        $address = $this->address($user, $data);
        $items = ! empty($data['items'])
            ? $this->requestItems($data['items'])
            : $user->cartItems()->with('product')->orderBy('id')->get();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Giỏ hàng đang trống.']);
        }

        $subtotal = 0;
        foreach ($items as $item) {
            if (! $item->product || $item->product->status !== 'published' || $item->quantity > $item->product->stock) {
                throw ValidationException::withMessages([
                    'cart' => 'Một sản phẩm trong giỏ không còn bán hoặc không đủ tồn kho.',
                ]);
            }
            $subtotal += $item->product->price * $item->quantity;
        }

        $coupon = ! empty($data['coupon_code'])
            ? $this->coupons->validate($data['coupon_code'], $subtotal, $user)
            : null;
        $discount = $coupon?->discount($subtotal) ?? 0;
        $shipping = ShippingMethod::query()
            ->whereKey($data['shipping_method_id'])
            ->where('active', true)
            ->first();

        if (! $shipping) {
            throw ValidationException::withMessages(['shipping_method_id' => 'Phương thức vận chuyển không hợp lệ.']);
        }

        $shippingFee = $shipping->quote($subtotal - $discount);

        return [
            'items' => $items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'name' => $item->product->name,
                'quantity' => $item->quantity,
                'unit_price' => $item->product->price,
                'line_total' => $item->product->price * $item->quantity,
            ])->values(),
            'address' => $address,
            'shipping_method' => [
                'id' => $shipping->id,
                'code' => $shipping->code,
                'name' => $shipping->name,
            ],
            'coupon' => $coupon ? ['code' => $coupon->code] : null,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'shipping_fee' => $shippingFee,
            'grand_total' => $subtotal - $discount + $shippingFee,
        ];
    }

    private function requestItems(array $requestedItems)
    {
        $products = Product::query()->whereIn('id', collect($requestedItems)->pluck('product_id'))->get()->keyBy('id');

        return collect($requestedItems)->map(fn (array $item) => (object) [
            'product_id' => $item['product_id'],
            'quantity' => $item['quantity'],
            'product' => $products->get($item['product_id']),
        ]);
    }

    private function address(User $user, array $data): array
    {
        if (! empty($data['address_id'])) {
            $address = Address::query()->whereKey($data['address_id'])->where('user_id', $user->id)->first();
            if (! $address) {
                throw ValidationException::withMessages(['address_id' => 'Địa chỉ không hợp lệ.']);
            }

            return $address->only(['id', 'name', 'phone', 'city', 'district', 'address']);
        }

        return $data['address'];
    }
}
