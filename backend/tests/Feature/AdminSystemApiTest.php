<?php

namespace Tests\Feature;

use App\Models\Coupon;
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
        $this->getJson('/api/admin/access')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/admin/access')->assertForbidden();
        foreach (['dashboard', 'products', 'categories', 'orders', 'customers', 'coupons'] as $endpoint) {
            $this->getJson("/api/admin/{$endpoint}")->assertForbidden();
        }

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/access')->assertOk()->assertJsonPath('data.allowed', true);
        $this->getJson('/api/admin/dashboard')->assertOk()->assertJsonStructure(['data' => [
            'revenue', 'orders', 'orders_by_status', 'customers', 'products',
            'published_products', 'low_stock_products', 'active_coupons', 'best_sellers',
        ]]);

        Sanctum::actingAs(User::factory()->create(['role' => 'staff']));
        $this->getJson('/api/admin/access')->assertOk()->assertJsonPath('data.allowed', true);
    }

    public function test_dashboard_statistics_include_paid_revenue_and_best_sellers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        $paidOrder = Order::create([
            'number' => 'DS-DASHBOARD-PAID', 'user_id' => $customer->id, 'status' => 'completed',
            'payment_method' => 'cod', 'payment_status' => 'paid', 'customer_name' => $customer->name,
            'customer_email' => $customer->email, 'customer_phone' => '0901234567',
            'shipping_address' => 'Hà Nội', 'subtotal' => 300000, 'discount' => 0,
            'shipping_fee' => 0, 'total' => 300000,
        ]);
        $paidOrder->items()->create([
            'product_name' => 'Trâm hoa sen', 'product_sku' => 'DS-DASH-1',
            'quantity' => 2, 'price' => 150000, 'total' => 300000,
        ]);
        $unpaidOrder = Order::create([
            'number' => 'DS-DASHBOARD-UNPAID', 'user_id' => $customer->id, 'status' => 'pending',
            'payment_method' => 'cod', 'payment_status' => 'unpaid', 'customer_name' => $customer->name,
            'customer_email' => $customer->email, 'customer_phone' => '0901234567',
            'shipping_address' => 'Hà Nội', 'subtotal' => 900000, 'discount' => 0,
            'shipping_fee' => 0, 'total' => 900000,
        ]);
        $unpaidOrder->items()->create([
            'product_name' => 'Sản phẩm chưa thanh toán', 'product_sku' => 'DS-DASH-2',
            'quantity' => 9, 'price' => 100000, 'total' => 900000,
        ]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.revenue', 300000)
            ->assertJsonPath('data.orders', 2)
            ->assertJsonPath('data.customers', 1)
            ->assertJsonPath('data.best_sellers.0.name', 'Trâm hoa sen')
            ->assertJsonPath('data.best_sellers.0.quantity_sold', 2)
            ->assertJsonPath('data.best_sellers.0.revenue', 300000)
            ->assertJsonCount(1, 'data.best_sellers');
    }

    public function test_admin_can_crud_categories_and_products_with_validation(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $categoryId = $this->postJson('/api/admin/categories', [
            'name' => 'Trâm cài', 'slug' => 'tram-cai', 'description' => 'Trang sức tóc', 'active' => true,
        ])->assertCreated()->assertJsonPath('data.active', true)->json('data.id');
        $this->getJson('/api/admin/categories')->assertOk()
            ->assertJsonPath('data.0.id', $categoryId)
            ->assertJsonPath('data.0.products_count', 0);
        $this->putJson("/api/admin/categories/{$categoryId}", [
            'name' => 'Trâm cài', 'slug' => 'tram-cai', 'description' => 'Trang sức tóc', 'active' => false,
        ])->assertOk()->assertJsonPath('data.active', false);
        $this->getJson('/api/categories')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/categories/tram-cai')->assertNotFound();

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
            ->assertCreated()->assertJsonPath('data.active', true)->json('data.id');
        $this->deleteJson("/api/admin/categories/{$emptyId}")->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $emptyId]);
        $this->postJson('/api/admin/categories', ['name' => '', 'slug' => 'tram-cai'])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'slug']);
        $this->postJson('/api/admin/products', ['name' => 'Thiếu dữ liệu'])->assertUnprocessable();
    }

    public function test_admin_can_crud_coupons_and_validation_enforces_business_limits(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $couponId = $this->postJson('/api/admin/coupons', [
            'code' => ' daisy20 ', 'type' => 'percent', 'value' => 20,
            'minimum_amount' => 500000, 'usage_limit' => 100, 'per_user_limit' => 1, 'active' => true,
        ])->assertCreated()->assertJsonPath('data.code', 'DAISY20')->json('data.id');

        $this->getJson('/api/admin/coupons')->assertOk()
            ->assertJsonPath('data.0.id', $couponId)
            ->assertJsonPath('data.0.used_count', 0)
            ->assertJsonPath('data.0.usages_count', 0);
        $this->putJson("/api/admin/coupons/{$couponId}", [
            'code' => 'DAISY20', 'type' => 'fixed', 'value' => 100000,
            'minimum_amount' => 600000, 'active' => false,
        ])->assertOk()->assertJsonPath('data.type', 'fixed')->assertJsonPath('data.active', false);
        $this->putJson("/api/admin/coupons/{$couponId}", [
            'code' => 'DAISY20', 'type' => 'fixed', 'value' => 100000,
            'minimum_amount' => 600000, 'active' => true,
        ])->assertOk()->assertJsonPath('data.active', true);
        $this->postJson('/api/admin/coupons', [
            'code' => 'SAI', 'type' => 'percent', 'value' => 101,
        ])->assertUnprocessable()->assertJsonValidationErrors('value');
        $this->deleteJson("/api/admin/coupons/{$couponId}")->assertOk();
        $this->assertDatabaseMissing('coupons', ['id' => $couponId]);

        $usedCouponId = $this->postJson('/api/admin/coupons', [
            'code' => 'USED10', 'type' => 'percent', 'value' => 10, 'active' => true,
        ])->assertCreated()->json('data.id');
        $customer = User::factory()->create();
        $order = Order::create([
            'number' => 'DS-COUPON-1', 'user_id' => $customer->id, 'coupon_id' => $usedCouponId,
            'status' => 'completed', 'payment_method' => 'cod', 'payment_status' => 'paid',
            'customer_name' => $customer->name, 'customer_email' => $customer->email,
            'customer_phone' => '0901234567', 'shipping_address' => 'Hà Nội',
            'subtotal' => 500000, 'discount' => 50000, 'shipping_fee' => 0, 'total' => 450000,
        ]);
        $usedCoupon = Coupon::findOrFail($usedCouponId);
        $usedCoupon->usages()->create(['user_id' => $customer->id, 'order_id' => $order->id]);
        $usedCoupon->update(['used_count' => 1]);

        $this->getJson("/api/admin/coupons/{$usedCouponId}")->assertOk()
            ->assertJsonPath('data.used_count', 1)
            ->assertJsonPath('data.usages_count', 1);
        $this->deleteJson("/api/admin/coupons/{$usedCouponId}")->assertOk();
        $this->assertDatabaseHas('coupons', ['id' => $usedCouponId, 'active' => false]);
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

        $this->getJson('/api/admin/orders?search=ADMIN-1&status=pending')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $order->id);
        $this->getJson('/api/admin/orders?search=khong-ton-tai')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/admin/orders/{$order->id}")->assertOk()->assertJsonPath('data.id', $order->id);
        $this->patchJson("/api/admin/orders/{$order->id}", [
            'status' => 'preparing', 'payment_status' => 'paid', 'tracking_number' => 'TRACK-001',
        ])->assertOk()->assertJsonPath('data.status', 'preparing')->assertJsonPath('data.tracking_number', 'TRACK-001');
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status' => 'paid']);
        $this->getJson('/api/admin/orders?search=TRACK-001&status=preparing')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $order->id);
        $this->patchJson("/api/admin/orders/{$order->id}", ['status' => 'new-status'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');

        $this->getJson("/api/admin/customers/{$customer->id}")->assertOk()->assertJsonPath('data.orders_count', 1);
        $this->putJson("/api/admin/customers/{$customer->id}", [
            'name' => 'Khách mới', 'email' => 'new-customer@example.com',
        ])->assertOk()->assertJsonPath('data.name', 'Khách mới');
    }

    public function test_customer_management_authorization_search_history_and_password_protection(): void
    {
        $customer = User::factory()->create([
            'name' => 'Khách Daisy', 'email' => 'daisy-customer@example.com', 'role' => 'customer',
        ]);
        $order = Order::create([
            'number' => 'DS-CUSTOMER-1', 'user_id' => $customer->id, 'status' => 'completed',
            'payment_method' => 'cod', 'payment_status' => 'paid', 'customer_name' => $customer->name,
            'customer_email' => $customer->email, 'customer_phone' => '0901234567',
            'shipping_address' => 'Đồng Nai', 'subtotal' => 250000, 'discount' => 0,
            'shipping_fee' => 0, 'total' => 250000,
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->getJson('/api/admin/customers')->assertUnauthorized();

        Sanctum::actingAs($customer);
        $this->getJson('/api/admin/customers')->assertForbidden();
        $this->getJson("/api/admin/customers/{$customer->id}")->assertForbidden();

        Sanctum::actingAs($admin);
        $this->getJson('/api/admin/customers?search=daisy-customer@example.com')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $customer->id);
        $this->getJson("/api/admin/customers/{$customer->id}")
            ->assertOk()
            ->assertJsonPath('data.orders_count', 1)
            ->assertJsonPath('data.orders.0.id', $order->id)
            ->assertJsonMissingPath('data.password');
        $this->getJson("/api/admin/customers/{$admin->id}")->assertNotFound();

        $passwordHash = $customer->password;
        $this->putJson("/api/admin/customers/{$customer->id}", [
            'name' => $customer->name,
            'email' => $customer->email,
            'password' => 'new-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertSame($passwordHash, $customer->fresh()->password);
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
