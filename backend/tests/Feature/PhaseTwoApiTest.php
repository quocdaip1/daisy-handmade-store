<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Policy;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PhaseTwoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_supports_filters_and_optional_pagination(): void
    {
        $category = Category::create(['name' => 'Trâm', 'slug' => 'tram']);
        Product::create($this->product($category->id, 'Trâm Sen', 'tram-sen', 500000));
        Product::create($this->product($category->id, 'Kiềng Ngọc', 'kieng-ngoc', 1500000));

        $this->getJson('/api/products?search=Trâm&max_price=600000&page=1&per_page=10')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.slug', 'tram-sen');

        $this->getJson('/api/products')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_customer_can_manage_own_addresses_but_not_another_users_address(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $data = ['name' => 'Nhà', 'phone' => '0901234567', 'city' => 'Đồng Nai', 'district' => 'Biên Hòa', 'address' => 'Phước Tân', 'is_default' => true];
        $id = $this->postJson('/api/addresses', $data)->assertCreated()->json('data.id');
        $this->getJson('/api/addresses')->assertOk()->assertJsonPath('data.0.id', $id);

        $other = User::factory()->create()->addresses()->create($data);
        $this->putJson("/api/addresses/{$other->id}", $data)->assertForbidden();
    }

    public function test_order_is_persisted_with_payment_and_items(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $category = Category::create(['name' => 'Trâm', 'slug' => 'tram']);
        $product = Product::create($this->product($category->id, 'Trâm Sen', 'tram-sen', 500000));

        $this->postJson('/api/orders', ['items' => [['product_id' => $product->id, 'quantity' => 2]], 'customer_name' => 'Daisy', 'customer_email' => 'daisy@example.com', 'customer_phone' => '0901234567', 'shipping_address' => 'Đồng Nai'])->assertOk();

        $this->assertDatabaseHas('orders', ['user_id' => $user->id, 'total' => 1000000]);
        $this->assertDatabaseHas('order_items', ['product_id' => $product->id, 'quantity' => 2]);
        $this->assertDatabaseHas('payments', ['method' => 'cod', 'amount' => 1000000]);
        $this->getJson('/api/orders')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_coupon_shipping_contact_and_policy_public_apis(): void
    {
        Coupon::create(['code' => 'DAISY10', 'type' => 'percent', 'value' => 10, 'minimum_amount' => 800000, 'active' => true]);
        ShippingMethod::create(['name' => 'Tiêu chuẩn', 'code' => 'standard', 'fee' => 30000, 'free_threshold' => 2000000, 'active' => true]);
        Policy::create(['title' => 'Đổi trả', 'slug' => 'doi-tra', 'content' => 'Nội dung', 'published' => true]);

        $this->postJson('/api/coupons/validate', ['code' => 'DAISY10', 'subtotal' => 1000000])->assertOk()->assertJsonPath('data.discount', 100000);
        $this->postJson('/api/shipping/quote', ['subtotal' => 2500000])->assertOk()->assertJsonPath('data.0.fee', 0);
        $this->postJson('/api/contacts', ['name' => 'Khách', 'email' => 'guest@example.com', 'subject' => 'Tư vấn', 'message' => 'Tôi cần tư vấn sản phẩm'])->assertCreated();
        $this->getJson('/api/policies/doi-tra')->assertOk()->assertJsonPath('data.slug', 'doi-tra');
    }

    public function test_admin_routes_reject_customers_and_allow_admins(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/admin/dashboard')->assertForbidden();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/dashboard')->assertOk()->assertJsonStructure(['data' => ['revenue', 'orders', 'customers', 'products']]);
    }

    public function test_customer_cannot_view_another_customers_order(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);
        $category = Category::create(['name' => 'Trâm', 'slug' => 'tram-policy']);
        $product = Product::create($this->product($category->id, 'Trâm Sen', 'tram-policy', 500000));
        $this->postJson('/api/orders', ['items' => [['product_id' => $product->id, 'quantity' => 1]], 'customer_name' => 'Daisy', 'customer_email' => 'daisy@example.com', 'customer_phone' => '0901234567', 'shipping_address' => 'Đồng Nai'])->assertOk();
        $orderId = $owner->orders()->value('id');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/orders/{$orderId}")->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson("/api/orders/{$orderId}")->assertOk();
    }

    private function product(int $categoryId, string $name, string $slug, int $price): array
    {
        return ['category_id' => $categoryId, 'name' => $name, 'slug' => $slug, 'description' => 'Trang sức Daisy', 'short_description' => 'Thủ công', 'price' => $price, 'material' => 'Bạc', 'color' => 'Vàng', 'stock' => 10, 'images' => [], 'featured' => false, 'is_new' => false, 'rating' => 5, 'status' => 'published'];
    }
}
