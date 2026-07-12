<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminSystemApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_management_endpoints_and_customer_is_forbidden(): void
    {
        Sanctum::actingAs(User::factory()->create());
        foreach (['dashboard', 'products', 'categories', 'orders', 'customers', 'coupons'] as $endpoint) {
            $this->getJson("/api/admin/{$endpoint}")->assertForbidden();
        }

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/dashboard')->assertOk()->assertJsonStructure(['data' => [
            'revenue', 'orders', 'orders_by_status', 'customers', 'products',
            'published_products', 'low_stock_products', 'active_coupons',
        ]]);
    }

    public function test_admin_can_crud_categories_and_products_with_validation(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $categoryId = $this->postJson('/api/admin/categories', [
            'name' => 'Trâm cài', 'slug' => 'tram-cai', 'description' => 'Trang sức tóc',
        ])->assertCreated()->json('data.id');

        $product = $this->productPayload($categoryId);
        $productId = $this->postJson('/api/admin/products', $product)
            ->assertCreated()->assertJsonPath('data.status', 'published')->json('data.id');
        $this->getJson('/api/admin/products')->assertOk()->assertJsonPath('data.0.id', $productId);

        $product['name'] = 'Trâm hoa sen cập nhật';
        $this->putJson("/api/admin/products/{$productId}", $product)
            ->assertOk()->assertJsonPath('data.name', 'Trâm hoa sen cập nhật');
        $this->deleteJson("/api/admin/products/{$productId}")->assertOk();
        $this->assertDatabaseHas('products', ['id' => $productId, 'status' => 'inactive']);

        $this->deleteJson("/api/admin/categories/{$categoryId}")
            ->assertUnprocessable()->assertJsonValidationErrors('category');
        $emptyId = $this->postJson('/api/admin/categories', ['name' => 'Danh mục trống', 'slug' => 'danh-muc-trong'])
            ->assertCreated()->json('data.id');
        $this->deleteJson("/api/admin/categories/{$emptyId}")->assertOk();
        $this->postJson('/api/admin/products', ['name' => 'Thiếu dữ liệu'])->assertUnprocessable();
    }

    public function test_admin_can_crud_coupons_and_validation_enforces_business_limits(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $couponId = $this->postJson('/api/admin/coupons', [
            'code' => ' daisy20 ', 'type' => 'percent', 'value' => 20,
            'minimum_amount' => 500000, 'usage_limit' => 100, 'per_user_limit' => 1, 'active' => true,
        ])->assertCreated()->assertJsonPath('data.code', 'DAISY20')->json('data.id');

        $this->getJson('/api/admin/coupons')->assertOk()->assertJsonPath('data.0.id', $couponId);
        $this->putJson("/api/admin/coupons/{$couponId}", [
            'code' => 'DAISY20', 'type' => 'fixed', 'value' => 100000,
            'minimum_amount' => 600000, 'active' => false,
        ])->assertOk()->assertJsonPath('data.type', 'fixed');
        $this->postJson('/api/admin/coupons', [
            'code' => 'SAI', 'type' => 'percent', 'value' => 101,
        ])->assertUnprocessable()->assertJsonValidationErrors('value');
        $this->deleteJson("/api/admin/coupons/{$couponId}")->assertOk();
        $this->assertDatabaseMissing('coupons', ['id' => $couponId]);
    }

    public function test_admin_can_manage_orders_and_customer_profiles(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['name' => 'Khách cũ', 'role' => 'customer']);
        $order = Order::create([
            'number' => 'DS-ADMIN-1', 'user_id' => $customer->id, 'status' => 'pending',
            'payment_method' => 'cod', 'payment_status' => 'unpaid', 'customer_name' => 'Khách',
            'customer_email' => $customer->email, 'customer_phone' => '0901234567',
            'shipping_address' => 'Hà Nội', 'subtotal' => 100000, 'discount' => 0,
            'shipping_fee' => 0, 'total' => 100000,
        ]);
        $order->payment()->create(['method' => 'cod', 'status' => 'unpaid', 'amount' => 100000]);
        Sanctum::actingAs($admin);

        $this->getJson("/api/admin/orders/{$order->id}")->assertOk()->assertJsonPath('data.id', $order->id);
        $this->patchJson("/api/admin/orders/{$order->id}", [
            'status' => 'preparing', 'payment_status' => 'paid', 'tracking_number' => 'TRACK-001',
        ])->assertOk()->assertJsonPath('data.status', 'preparing');
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status' => 'paid']);

        $this->getJson("/api/admin/customers/{$customer->id}")->assertOk()->assertJsonPath('data.orders_count', 1);
        $this->putJson("/api/admin/customers/{$customer->id}", [
            'name' => 'Khách mới', 'email' => 'new-customer@example.com',
        ])->assertOk()->assertJsonPath('data.name', 'Khách mới');
    }

    private function productPayload(int $categoryId): array
    {
        return [
            'category_id' => $categoryId, 'name' => 'Trâm hoa sen', 'slug' => 'tram-hoa-sen',
            'sku' => 'DS-001', 'description' => 'Trang sức cổ phục Việt Nam',
            'short_description' => 'Thủ công', 'price' => 500000, 'original_price' => 600000,
            'material' => 'Đồng', 'color' => 'Vàng', 'stock' => 5, 'images' => [],
            'featured' => true, 'is_new' => true, 'status' => 'published', 'rating' => 5,
        ];
    }
}
