<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ProductVariantSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_additive_schema_preserves_shared_inventory_defaults(): void
    {
        $this->assertTrue(Schema::hasColumns('products', ['inventory_mode', 'cover_image']));
        $this->assertTrue(Schema::hasColumns('product_variants', ['product_id', 'stock', 'images', 'active']));
        $this->assertTrue(Schema::hasColumns('order_items', ['variant_id', 'color_name', 'inventory_source']));
        $this->assertTrue(Schema::hasColumn('cart_items', 'variant_id'));
        $indexes = collect(Schema::getIndexes('cart_items'))->pluck('name');
        $this->assertContains('cart_items_shared_unique', $indexes);
        $this->assertContains('cart_items_variant_unique', $indexes);
    }

    public function test_upgrade_preserves_legacy_stock_images_and_order_inventory_source(): void
    {
        $migration = require database_path('migrations/2026_10_12_000001_add_product_color_inventory.php');
        $migration->down();
        $category = Category::create(['name' => 'Legacy', 'slug' => 'legacy']);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Legacy', 'slug' => 'legacy', 'description' => 'Legacy', 'price' => 100, 'material' => 'Silver', 'color' => 'Red, Blue', 'stock' => 50, 'images' => ['/old.png']]);
        $user = User::factory()->create();
        $order = Order::create(['number' => 'LEGACY', 'user_id' => $user->id, 'customer_name' => 'Legacy', 'customer_email' => 'legacy@example.test', 'customer_phone' => '0901234567', 'shipping_address' => 'Legacy', 'subtotal' => 100, 'total' => 100]);
        $item = $order->items()->create(['product_id' => $product->id, 'product_name' => 'Legacy', 'quantity' => 1, 'price' => 100, 'total' => 100]);
        $migration->up();
        $this->assertSame(50, $product->fresh()->stock);
        $this->assertSame('Red, Blue', $product->fresh()->color);
        $this->assertSame(['/old.png'], $product->fresh()->images);
        $this->assertSame('shared', $product->fresh()->inventory_mode);
        $this->assertSame('shared', $item->fresh()->inventory_source);
        $this->assertNull($item->fresh()->variant_id);
        $this->assertDatabaseCount('product_variants', 0);
    }
}
