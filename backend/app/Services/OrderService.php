<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly CouponService $coupons,
        private readonly PaymentService $payments,
    ) {}

    public function create(User $user, array $data): Order
    {
        return DB::transaction(function () use ($user, $data): Order {
            $products = Product::query()
                ->whereIn('id', collect($data['items'])->pluck('product_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');
            $subtotal = 0;

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                if (! $product || $product->status !== 'published' || $product->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Sản phẩm {$product?->name} không đủ tồn kho hoặc không còn bán.",
                    ]);
                }
                $subtotal += $product->price * $item['quantity'];
            }

            $coupon = ! empty($data['coupon_code'])
                ? $this->coupons->validate($data['coupon_code'], $subtotal, $user, true)
                : null;
            $discount = $coupon?->discount($subtotal) ?? 0;
            $shipping = ! empty($data['shipping_method_id'])
                ? ShippingMethod::query()->whereKey($data['shipping_method_id'])->where('active', true)->first()
                : null;
            $shippingFee = $shipping?->quote($subtotal - $discount) ?? 0;
            $paymentMethod = $data['payment_method'] ?? 'cod';
            $paymentStatus = $paymentMethod === 'bank_transfer' ? 'pending_verification' : 'unpaid';

            $order = Order::create([
                'number' => 'DS'.now()->format('YmdHis').str_pad((string) random_int(0, 999), 3, '0', STR_PAD_LEFT),
                'user_id' => $user->id,
                'coupon_id' => $coupon?->id,
                'shipping_method_id' => $shipping?->id,
                'status' => 'pending',
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'],
                'shipping_address' => $data['shipping_address'],
                'note' => $data['note'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_fee' => $shippingFee,
                'total' => $subtotal - $discount + $shippingFee,
            ]);

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                $product->decrement('stock', $item['quantity']);
                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'total' => $product->price * $item['quantity'],
                ]);
            }

            $this->payments->createForOrder($order);
            if ($coupon) {
                $this->coupons->track($coupon, $user, $order);
            }
            $user->cartItems()->delete();

            return $order->load(['items', 'payment']);
        });
    }

    public function cancel(Order $order): Order
    {
        return DB::transaction(function () use ($order): Order {
            $order = Order::query()->with('items')->lockForUpdate()->findOrFail($order->id);
            if (! in_array($order->status, ['pending', 'confirmed'], true)) {
                throw ValidationException::withMessages(['status' => 'Đơn hàng không thể hủy ở trạng thái hiện tại.']);
            }

            $productIds = $order->items->pluck('product_id')->filter();
            $products = Product::query()->whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');
            foreach ($order->items as $item) {
                $products->get($item->product_id)?->increment('stock', $item->quantity);
            }

            if ($order->coupon_id) {
                $coupon = $order->coupon()->lockForUpdate()->first();
                if ($coupon) {
                    $this->coupons->release($coupon, $order);
                }
            }

            $order->update(['status' => 'cancelled']);

            return $order->fresh('items');
        });
    }
}
