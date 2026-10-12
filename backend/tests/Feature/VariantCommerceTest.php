<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VariantCommerceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_upload_color_setup_customer_purchase_and_cancel_end_to_end(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = User::factory()->create();
        Sanctum::actingAs($admin);
        $category = Category::create(['name' => 'Flow', 'slug' => 'flow']);
        $data = ['category_id' => $category->id, 'name' => 'Flow', 'slug' => 'flow', 'description' => 'Flow', 'price' => 100, 'material' => 'Silver', 'color' => 'Legacy', 'stock' => 7, 'status' => 'published', 'images' => ['/blue.png']];
        $id = $this->postJson('/api/admin/products', $data)->assertCreated()->json('data.id');
        $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=');
        $redImage = $this->post("/api/admin/products/$id/images", ['images' => [UploadedFile::fake()->createWithContent('red.png', $bytes)]], ['Accept' => 'application/json'])->assertOk()->assertJsonCount(2, 'data')->json('data.1');
        $this->get(parse_url($redImage, PHP_URL_PATH))->assertOk();
        $data = array_merge($data, ['images' => [$redImage, '/blue.png'], 'cover_image' => '/blue.png', 'inventory_mode' => 'variant', 'variants' => [['color_name' => 'Red', 'stock' => 3, 'images' => [$redImage]], ['color_name' => 'Blue', 'stock' => 4, 'images' => ['/blue.png']]]]);
        $this->putJson("/api/admin/products/$id", $data)->assertOk()->assertJsonPath('data.stock', 7);
        $reopened = $this->getJson("/api/admin/products/$id")->assertOk()->assertJsonPath('data.cover_image', '/blue.png')->assertJsonPath('data.images.0', $redImage)->json('data.variants');
        Sanctum::actingAs($customer);
        $items = array_map(fn ($v) => ['product_id' => $id, 'variant_id' => $v['id'], 'quantity' => 1], $reopened);
        foreach ($items as $item) {
            $this->postJson('/api/cart/items', $item)->assertOk();
        }
        $this->postJson('/api/orders', $this->orderPayloadFromPreview($items))->assertOk()->assertJsonPath('order.items.0.color_name', 'Red');
        $this->getJson('/api/products/flow')->assertOk()->assertJsonPath('data.stock', 5);
        Sanctum::actingAs($admin);
        $data['inventory_mode'] = 'shared';
        $data['confirm_stock_adjustment'] = true;
        $data['variants'] = $reopened;
        $this->putJson("/api/admin/products/$id", $data)->assertUnprocessable()->assertJsonValidationErrors('inventory_mode');
        Sanctum::actingAs($customer);
        $this->postJson('/api/orders/'.Order::firstOrFail()->id.'/cancel')->assertOk();
        $this->getJson('/api/products/flow')->assertOk()->assertJsonPath('data.stock', 7)->assertJsonPath('data.variants.0.stock', 3)->assertJsonPath('data.variants.1.stock', 4);
    }

    public function test_two_colors_order_snapshot_and_repeated_cancel_restore_correct_pools(): void
    {
        $product = $this->product();
        [$red, $blue] = $product->variants->all();
        Sanctum::actingAs(User::factory()->create());
        foreach ([$red, $blue] as $variant) {
            $this->postJson('/api/cart/items', ['product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 1])->assertOk();
        }
        $this->getJson('/api/cart')->assertJsonCount(2, 'data.items');
        $items = [['product_id' => $product->id, 'variant_id' => $red->id, 'quantity' => 2], ['product_id' => $product->id, 'variant_id' => $blue->id, 'quantity' => 1]];
        $this->postJson('/api/orders', $this->orderPayloadFromPreview($items))->assertOk();
        $order = Order::firstOrFail();
        $this->assertSame(1, $red->fresh()->stock);
        $this->assertSame(3, $blue->fresh()->stock);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->id, 'variant_id' => $red->id, 'color_name' => 'Red', 'inventory_source' => 'variant']);
        $red->update(['color_name' => 'Renamed', 'active' => false]);
        $this->getJson("/api/orders/{$order->id}")->assertOk()->assertJsonPath('data.items.0.color_name', 'Red');
        $this->postJson("/api/orders/{$order->id}/cancel")->assertOk();
        $this->postJson("/api/orders/{$order->id}/cancel")->assertForbidden();
        $this->assertSame(3, $red->fresh()->stock);
        $this->assertSame(4, $blue->fresh()->stock);
        $this->assertSame(0, $product->fresh()->stock);
    }

    public function test_missing_wrong_inactive_and_zero_stock_colors_are_rejected(): void
    {
        $product = $this->product();
        $other = $this->product('other');
        Sanctum::actingAs(User::factory()->create());
        foreach ([null, $other->variants->first()->id] as $id) {
            $this->postJson('/api/checkout/preview', $this->checkoutPreviewPayload([['product_id' => $product->id, 'variant_id' => $id, 'quantity' => 1]]))->assertUnprocessable();
        }
        $variant = $product->variants->first();
        $variant->update(['stock' => 0]);
        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 1])->assertUnprocessable();
        $variant->update(['stock' => 2, 'active' => false]);
        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 1])->assertUnprocessable();
    }

    public function test_competing_previews_recheck_inventory_before_second_order(): void
    {
        $product = $this->product();
        $variant = $product->variants->first();
        $items = [['product_id' => $product->id, 'variant_id' => $variant->id, 'quantity' => 3]];
        $first = User::factory()->create();
        $second = User::factory()->create();
        Sanctum::actingAs($first);
        $payloadA = $this->orderPayloadFromPreview($items);
        Sanctum::actingAs($second);
        $payloadB = $this->orderPayloadFromPreview($items);
        Sanctum::actingAs($first);
        $this->postJson('/api/orders', $payloadA)->assertOk();
        Sanctum::actingAs($second);
        $this->postJson('/api/orders', $payloadB)->assertUnprocessable();
        $this->assertSame(0, $variant->fresh()->stock);
        $this->assertDatabaseCount('orders', 1);
    }

    public function test_color_changes_invalidate_preview(): void
    {
        $product = $this->product();
        Sanctum::actingAs(User::factory()->create());
        $items = [['product_id' => $product->id, 'variant_id' => $product->variants->first()->id, 'quantity' => 1]];
        $payload = $this->orderPayloadFromPreview($items);
        $payload['items'][0]['variant_id'] = $product->variants->last()->id;
        $this->postJson('/api/orders', $payload)->assertUnprocessable()->assertJsonValidationErrors('preview_id');
        $this->assertDatabaseCount('orders', 0);
        $this->assertSame(7, $product->fresh()->availableStock());
    }

    public function test_shared_colors_share_one_pool_and_duplicate_lines_are_rejected(): void
    {
        $product = $this->product();
        $product->update(['inventory_mode' => 'shared', 'stock' => 3]);
        Sanctum::actingAs(User::factory()->create());
        $items = $product->variants->map(fn ($v) => ['product_id' => $product->id, 'variant_id' => $v->id, 'quantity' => 2])->all();
        $this->postJson('/api/checkout/preview', $this->checkoutPreviewPayload($items))->assertUnprocessable();
        $this->postJson('/api/checkout/preview', $this->checkoutPreviewPayload([$items[0], $items[0]]))->assertUnprocessable();
        $items = [['product_id' => $product->id, 'quantity' => 1]];
        $this->postJson('/api/orders', $this->orderPayloadFromPreview($items))->assertOk();
        $order = Order::firstOrFail();
        $this->assertDatabaseHas('order_items', ['order_id' => $order->id, 'inventory_source' => 'shared', 'variant_id' => null]);
        $this->postJson("/api/orders/{$order->id}/cancel")->assertOk();
        $this->assertSame(3, $product->fresh()->stock);
    }

    private function product(string $slug = 'variant'): Product
    {
        $category = Category::firstOrCreate(['slug' => 'colors'], ['name' => 'Colors']);
        $product = Product::create(['category_id' => $category->id, 'name' => $slug, 'slug' => $slug, 'description' => 'Colors', 'price' => 100, 'material' => 'Silver', 'color' => 'Legacy', 'stock' => 0, 'status' => 'published', 'inventory_mode' => 'variant', 'images' => ['/red.png', '/blue.png']]);
        $product->variants()->create(['color_name' => 'Red', 'stock' => 3, 'images' => ['/red.png']]);
        $product->variants()->create(['color_name' => 'Blue', 'stock' => 4, 'images' => ['/blue.png']]);

        return $product->fresh('variants');
    }
}
