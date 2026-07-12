<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CouponApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_percentage_and_fixed_coupons_calculate_discount(): void
    {
        $this->coupon(['code' => 'PERCENT10', 'type' => 'percent', 'value' => 10]);
        $this->coupon(['code' => 'FIXED50', 'type' => 'fixed', 'value' => 50000]);

        $this->postJson('/api/coupons/validate', ['code' => ' percent10 ', 'subtotal' => 1000000])
            ->assertOk()->assertExactJson(['data' => ['code' => 'PERCENT10', 'discount' => 100000]]);
        $this->postJson('/api/coupons/validate', ['code' => 'FIXED50', 'subtotal' => 30000])
            ->assertOk()->assertJsonPath('data.discount', 30000);
    }

    public function test_expired_and_not_started_coupons_are_rejected(): void
    {
        $this->coupon(['code' => 'EXPIRED', 'expires_at' => now()->subSecond()]);
        $this->coupon(['code' => 'FUTURE', 'starts_at' => now()->addMinute()]);

        $this->postJson('/api/coupons/validate', ['code' => 'EXPIRED', 'subtotal' => 1000000])
            ->assertUnprocessable()->assertExactJson(['message' => 'Mã giảm giá không hợp lệ.']);
        $this->postJson('/api/coupons/validate', ['code' => 'FUTURE', 'subtotal' => 1000000])
            ->assertUnprocessable();
    }

    public function test_minimum_order_failure_is_rejected(): void
    {
        $this->coupon(['minimum_amount' => 500000]);

        $this->postJson('/api/coupons/validate', ['code' => 'DAISY10', 'subtotal' => 499999])
            ->assertUnprocessable();
    }

    public function test_global_usage_limit_exceeded_is_rejected(): void
    {
        $this->coupon(['usage_limit' => 2, 'used_count' => 2]);

        $this->postJson('/api/coupons/validate', ['code' => 'DAISY10', 'subtotal' => 1000000])
            ->assertUnprocessable();
    }

    public function test_order_tracks_usage_and_enforces_per_user_limit(): void
    {
        $user = User::factory()->create();
        $product = $this->product();
        $coupon = $this->coupon(['per_user_limit' => 1, 'usage_limit' => 10]);
        Sanctum::actingAs($user);

        $payload = [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'customer_name' => 'Khách Daisy',
            'customer_email' => 'daisy@example.com',
            'customer_phone' => '0900000000',
            'shipping_address' => 'Hà Nội',
            'coupon_code' => 'daisy10',
        ];

        $this->postJson('/api/orders', $payload)->assertOk()->assertJsonPath('order.total', 900000);
        $this->assertDatabaseHas('orders', ['coupon_id' => $coupon->id, 'discount' => 100000]);
        $this->assertDatabaseHas('coupon_usages', ['coupon_id' => $coupon->id, 'user_id' => $user->id]);
        $this->assertSame(1, $coupon->fresh()->used_count);
        $this->postJson('/api/orders', $payload)->assertUnprocessable()->assertJsonValidationErrors('coupon_code');
    }

    private function coupon(array $attributes = []): Coupon
    {
        return Coupon::create(array_merge([
            'code' => 'DAISY10',
            'type' => 'percent',
            'value' => 10,
            'minimum_amount' => 0,
            'active' => true,
        ], $attributes));
    }

    private function product(): Product
    {
        $category = Category::create(['name' => 'Trâm', 'slug' => 'tram', 'description' => 'Trang sức tóc']);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Trâm Daisy',
            'slug' => 'tram-daisy',
            'description' => 'Trang sức cổ phục',
            'price' => 1000000,
            'material' => 'Đồng',
            'color' => 'Vàng',
            'stock' => 5,
            'images' => [],
            'status' => 'published',
        ]);
    }
}
