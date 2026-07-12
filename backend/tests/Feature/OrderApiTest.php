<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_requires_authentication(): void
    {
        $this->postJson('/api/orders', [])->assertUnauthorized();
    }

    public function test_valid_order_decrements_stock_and_returns_existing_contract(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $product = $this->createProduct('tram-hoa-sen', 5, 890000);
        CartItem::create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 2]);

        $this->postJson('/api/orders', $this->payload([
            ['product_id' => $product->id, 'quantity' => 2],
        ]))->assertOk()
            ->assertJsonPath('order.total', 1780000)
            ->assertJsonPath('order.items.0.product_id', $product->id);

        $this->assertSame(3, $product->fresh()->stock);
        $this->assertDatabaseHas('orders', ['user_id' => $user->id, 'status' => 'pending', 'payment_status' => 'unpaid']);
        $this->assertDatabaseMissing('cart_items', ['user_id' => $user->id]);
    }

    public function test_cancel_order_restores_inventory_and_coupon_usage(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $product = $this->createProduct('tram-huy-don', 5, 500000);
        $coupon = Coupon::create([
            'code' => 'HUY10', 'type' => 'percent', 'value' => 10,
            'minimum_amount' => 0, 'usage_limit' => 10, 'active' => true,
        ]);

        $this->postJson('/api/orders', array_merge($this->payload([
            ['product_id' => $product->id, 'quantity' => 2],
        ]), ['coupon_code' => 'HUY10']))->assertOk();
        $order = $user->orders()->firstOrFail();
        $this->assertSame(3, $product->fresh()->stock);

        $this->postJson("/api/orders/{$order->id}/cancel")
            ->assertOk()->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(5, $product->fresh()->stock);
        $this->assertSame(0, $coupon->fresh()->used_count);
        $this->assertDatabaseMissing('coupon_usages', ['order_id' => $order->id]);
        $this->postJson("/api/orders/{$order->id}/cancel")->assertForbidden();
    }

    public function test_owner_can_list_and_view_order_but_other_customer_cannot(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $order = Order::create([
            'number' => 'DS-VIEW-001', 'user_id' => $owner->id, 'status' => 'pending',
            'payment_method' => 'cod', 'payment_status' => 'unpaid',
            'customer_name' => 'Daisy', 'customer_email' => 'daisy@example.com',
            'customer_phone' => '0901234567', 'shipping_address' => 'Hà Nội',
            'subtotal' => 100000, 'discount' => 0, 'shipping_fee' => 0, 'total' => 100000,
        ]);

        Sanctum::actingAs($owner);
        $this->getJson('/api/orders?status=pending')->assertOk()->assertJsonPath('data.0.id', $order->id);
        $this->getJson("/api/orders/{$order->id}")->assertOk()->assertJsonPath('data.number', 'DS-VIEW-001');

        Sanctum::actingAs($other);
        $this->getJson("/api/orders/{$order->id}")->assertForbidden();
    }

    public function test_invalid_coupon_does_not_create_order_or_deduct_inventory(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = $this->createProduct('tram-coupon-sai', 5, 500000);

        $this->postJson('/api/orders', array_merge($this->payload([
            ['product_id' => $product->id, 'quantity' => 1],
        ]), ['coupon_code' => 'KHONG-TON-TAI']))
            ->assertUnprocessable()->assertJsonValidationErrors('coupon_code');

        $this->assertSame(5, $product->fresh()->stock);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_insufficient_stock_does_not_decrement_any_product(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $available = $this->createProduct('tram-hoa-mai', 5, 500000);
        $insufficient = $this->createProduct('kieng-hoa-sen', 1, 700000);

        $this->postJson('/api/orders', $this->payload([
            ['product_id' => $available->id, 'quantity' => 2],
            ['product_id' => $insufficient->id, 'quantity' => 2],
        ]))->assertUnprocessable();

        $this->assertSame(5, $available->fresh()->stock);
        $this->assertSame(1, $insufficient->fresh()->stock);
    }

    public function test_duplicate_products_and_unknown_products_are_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $product = $this->createProduct('tram-lien-hoa', 5, 500000);

        $this->postJson('/api/orders', $this->payload([
            ['product_id' => $product->id, 'quantity' => 1],
            ['product_id' => $product->id, 'quantity' => 1],
        ]))->assertUnprocessable();

        $this->postJson('/api/orders', $this->payload([
            ['product_id' => 999999, 'quantity' => 1],
        ]))->assertUnprocessable();
    }

    private function createProduct(string $slug, int $stock, int $price): Product
    {
        $category = Category::firstOrCreate(
            ['slug' => 'tram-cai-toc'],
            ['name' => 'Trâm cài tóc', 'description' => 'Trang sức tóc'],
        );

        return Product::create([
            'category_id' => $category->id,
            'name' => $slug,
            'slug' => $slug,
            'description' => 'Sản phẩm thủ công Daisy',
            'short_description' => 'Trang sức cổ phục Việt',
            'price' => $price,
            'material' => 'Bạc',
            'color' => 'Vàng',
            'stock' => $stock,
            'images' => [],
            'featured' => false,
            'is_new' => false,
            'rating' => 0,
        ]);
    }

    /** @param array<int, array{product_id: int, quantity: int}> $items */
    private function payload(array $items): array
    {
        return [
            'items' => $items,
            'customer_name' => 'Daisy Customer',
            'customer_email' => 'customer@example.com',
            'customer_phone' => '0901234567',
            'shipping_address' => 'Đồng Nai, Việt Nam',
        ];
    }
}
