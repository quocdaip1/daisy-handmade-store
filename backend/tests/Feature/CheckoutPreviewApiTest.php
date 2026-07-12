<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CheckoutPreviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_preview_calculates_all_totals_from_backend_without_creating_order(): void
    {
        $user = User::factory()->create();
        $product = $this->product(price: 250000);
        CartItem::create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 2]);
        $shipping = $this->shipping();
        Coupon::create(['code' => 'GIAM100', 'type' => 'fixed', 'value' => 100000, 'minimum_amount' => 400000, 'active' => true]);
        Sanctum::actingAs($user);

        $this->postJson('/api/checkout/preview', array_merge($this->payload($shipping->id), [
            'coupon_code' => ' giam100 ',
            'subtotal' => 1,
            'discount' => 1,
            'shipping_fee' => 1,
            'grand_total' => 1,
        ]))->assertOk()
            ->assertJsonPath('data.subtotal', 500000)
            ->assertJsonPath('data.discount', 100000)
            ->assertJsonPath('data.shipping_fee', 30000)
            ->assertJsonPath('data.grand_total', 430000)
            ->assertJsonPath('data.items.0.unit_price', 250000);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('coupon_usages', 0);
    }

    public function test_checkout_preview_rejects_invalid_or_unowned_address(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $product = $this->product();
        CartItem::create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 1]);
        $address = $other->addresses()->create([
            'name' => 'Người khác', 'phone' => '0900000000', 'city' => 'Hà Nội',
            'district' => 'Ba Đình', 'address' => 'Số 1',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/checkout/preview', [
            'address_id' => $address->id,
            'shipping_method_id' => $this->shipping()->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('address_id');
    }

    public function test_checkout_preview_rejects_invalid_coupon(): void
    {
        $user = User::factory()->create();
        $product = $this->product();
        CartItem::create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 1]);
        Sanctum::actingAs($user);

        $this->postJson('/api/checkout/preview', array_merge($this->payload($this->shipping()->id), [
            'coupon_code' => 'KHONGTONTAI',
        ]))->assertUnprocessable()->assertJsonValidationErrors('coupon_code');
    }

    public function test_checkout_preview_rejects_empty_cart(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/checkout/preview', $this->payload($this->shipping()->id))
            ->assertUnprocessable()->assertJsonValidationErrors('cart');
    }

    public function test_checkout_preview_accepts_local_cart_identifiers_and_still_uses_backend_price(): void
    {
        $user = User::factory()->create();
        $product = $this->product(price: 320000);
        Sanctum::actingAs($user);

        $this->postJson('/api/checkout/preview', array_merge($this->payload($this->shipping()->id), [
            'items' => [['product_id' => $product->id, 'quantity' => 2, 'price' => 1]],
            'subtotal' => 1,
        ]))->assertOk()
            ->assertJsonPath('data.items.0.unit_price', 320000)
            ->assertJsonPath('data.subtotal', 640000)
            ->assertJsonPath('data.grand_total', 670000);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('cart_items', 0);
    }

    private function payload(int $shippingMethodId): array
    {
        return [
            'address' => [
                'name' => 'Khách Daisy',
                'phone' => '0901234567',
                'city' => 'Hà Nội',
                'district' => 'Hoàn Kiếm',
                'address' => '12 Hàng Gai',
            ],
            'shipping_method_id' => $shippingMethodId,
        ];
    }

    private function shipping(): ShippingMethod
    {
        return ShippingMethod::create([
            'name' => 'Giao hàng tiêu chuẩn',
            'code' => 'standard-'.uniqid(),
            'fee' => 30000,
            'free_threshold' => 1000000,
            'active' => true,
        ]);
    }

    private function product(int $price = 250000): Product
    {
        $category = Category::firstOrCreate(['slug' => 'tram'], ['name' => 'Trâm', 'description' => 'Trang sức tóc']);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Trâm Daisy',
            'slug' => 'tram-'.uniqid(),
            'description' => 'Trang sức cổ phục',
            'price' => $price,
            'material' => 'Đồng',
            'color' => 'Vàng',
            'stock' => 10,
            'images' => [],
            'status' => 'published',
        ]);
    }
}
