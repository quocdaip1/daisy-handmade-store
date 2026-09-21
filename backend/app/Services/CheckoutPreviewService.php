<?php

namespace App\Services;

use App\Models\Address;
use App\Models\CheckoutPreview;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class CheckoutPreviewService
{
    private const EXPIRY_MINUTES = 15;

    public function __construct(private readonly CouponService $coupons) {}

    public function preview(User $user, array $data): array
    {
        CheckoutPreview::query()->where('expires_at', '<', now()->subDay())->delete();
        $address = $this->address($user, $data);
        $items = ! empty($data['items'])
            ? collect($data['items'])
            : $user->cartItems()->orderBy('id')->get(['product_id', 'quantity']);
        $pricing = $this->calculate($user, $items, $data['coupon_code'] ?? null);
        $payloadHash = $this->payloadHash([
            'items' => $items->all(),
            'customer_name' => $address['name'],
            'customer_email' => $data['customer_email'],
            'customer_phone' => $address['phone'],
            'shipping_address' => $this->shippingAddress($address),
            'note' => $data['note'] ?? null,
            'coupon_code' => $data['coupon_code'] ?? null,
            'payment_method' => $data['payment_method'],
        ]);

        $snapshot = $this->publicPricing($pricing);
        $preview = CheckoutPreview::create([
            'user_id' => $user->id,
            'payload_hash' => $payloadHash,
            'snapshot' => $snapshot,
            'expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
        ]);

        return array_merge($snapshot, [
            'success' => true,
            'preview_id' => $preview->id,
            'expires_at' => $preview->expires_at->toIso8601String(),
            'address' => $address,
        ]);
    }

    public function verifyForOrder(User $user, array $data): array
    {
        $preview = CheckoutPreview::query()
            ->whereKey($data['preview_id'])
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->first();

        if (! $preview || $preview->consumed_at || $preview->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'preview_id' => 'Bản xem trước đã hết hạn hoặc không còn hợp lệ. Vui lòng tính lại tổng thanh toán.',
            ]);
        }

        if (! hash_equals($preview->payload_hash, $this->payloadHash($data))) {
            throw ValidationException::withMessages([
                'preview_id' => 'Thông tin thanh toán đã thay đổi. Vui lòng tính lại tổng thanh toán.',
            ]);
        }

        $pricing = $this->calculate($user, collect($data['items']), $data['coupon_code'] ?? null, true);
        if (! hash_equals($this->pricingHash($preview->snapshot), $this->pricingHash($this->publicPricing($pricing)))) {
            throw ValidationException::withMessages([
                'preview_id' => 'Giá của một số sản phẩm vừa được cập nhật. Vui lòng tính lại tổng thanh toán.',
            ]);
        }

        return ['preview' => $preview, 'pricing' => $pricing];
    }

    private function calculate(User $user, Collection $requestedItems, ?string $couponCode, bool $lock = false): array
    {
        if ($requestedItems->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Giỏ hàng đang trống.']);
        }

        $query = Product::query()->whereIn('id', $requestedItems->pluck('product_id'));
        $products = ($lock ? $query->lockForUpdate() : $query)->get()->keyBy('id');
        $items = [];
        $subtotal = 0;

        foreach ($requestedItems as $requestedItem) {
            $item = is_array($requestedItem) ? $requestedItem : $requestedItem->toArray();
            $product = $products->get($item['product_id']);
            if (! $product || $product->status !== 'published') {
                throw ValidationException::withMessages([
                    'cart' => 'Một sản phẩm trong giỏ không còn tồn tại hoặc đã ngừng bán. Vui lòng kiểm tra lại giỏ hàng.',
                ]);
            }
            if ($item['quantity'] > $product->stock) {
                throw ValidationException::withMessages([
                    'cart' => 'Một sản phẩm trong giỏ hàng hiện không đủ số lượng. Vui lòng kiểm tra lại giỏ hàng.',
                ]);
            }

            $lineTotal = $product->price * $item['quantity'];
            $subtotal += $lineTotal;
            $items[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'quantity' => $item['quantity'],
                'unit_price' => $product->price,
                'line_total' => $lineTotal,
            ];
        }

        $coupon = $couponCode ? $this->coupons->validate($couponCode, $subtotal, $user, $lock) : null;
        $discount = $coupon?->discount($subtotal) ?? 0;

        return [
            'items' => $items,
            'coupon_model' => $coupon,
            'coupon' => $coupon ? ['code' => $coupon->code, 'valid' => true, 'discount' => $discount] : null,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'shipping_fee' => 0,
            'grand_total' => $subtotal - $discount,
            'total' => $subtotal - $discount,
        ];
    }

    private function publicPricing(array $pricing): array
    {
        unset($pricing['coupon_model']);

        return $pricing;
    }

    private function payloadHash(array $data): string
    {
        $items = collect($data['items'])->map(fn ($item) => [
            'product_id' => (int) $item['product_id'],
            'quantity' => (int) $item['quantity'],
        ])->sortBy('product_id')->values()->all();

        return hash('sha256', json_encode([
            'items' => $items,
            'customer_name' => trim((string) $data['customer_name']),
            'customer_email' => strtolower(trim((string) $data['customer_email'])),
            'customer_phone' => trim((string) $data['customer_phone']),
            'shipping_address' => trim((string) $data['shipping_address']),
            'note' => trim((string) ($data['note'] ?? '')),
            'coupon_code' => strtoupper(trim((string) ($data['coupon_code'] ?? ''))),
            'payment_method' => $data['payment_method'],
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    }

    private function pricingHash(array $pricing): string
    {
        return hash('sha256', json_encode([
            'items' => $pricing['items'],
            'coupon' => $pricing['coupon'],
            'subtotal' => $pricing['subtotal'],
            'discount' => $pricing['discount'],
            'shipping_fee' => $pricing['shipping_fee'],
            'grand_total' => $pricing['grand_total'],
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    }

    private function shippingAddress(array $address): string
    {
        return implode(', ', [$address['address'], $address['district'], $address['city']]);
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
