<?php

namespace Tests\Feature;

use App\Models\CartItem;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CartApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_add_success_uses_backend_price_and_calculates_subtotal(): void
    {
        $user = User::factory()->create();
        $product = $this->product(stock: 5, price: 275000);
        Sanctum::actingAs($user);

        $this->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'price' => 1,
        ])->assertOk()
            ->assertJsonPath('data.items.0.unit_price', 275000)
            ->assertJsonPath('data.items.0.line_total', 550000)
            ->assertJsonPath('data.subtotal', 550000)
            ->assertJsonPath('data.item_count', 2);

        $this->assertDatabaseHas('cart_items', ['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 2]);
    }

    public function test_add_rejects_out_of_stock_and_does_not_create_item(): void
    {
        $user = User::factory()->create();
        $product = $this->product(stock: 1);
        Sanctum::actingAs($user);

        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2])
            ->assertUnprocessable()->assertJsonValidationErrors('quantity');
        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_update_quantity_revalidates_stock(): void
    {
        $user = User::factory()->create();
        $product = $this->product(stock: 4, price: 100000);
        $item = CartItem::create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 1]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/cart/items/{$item->id}", ['quantity' => 3])
            ->assertOk()->assertJsonPath('data.items.0.quantity', 3)->assertJsonPath('data.subtotal', 300000);
        $this->patchJson("/api/cart/items/{$item->id}", ['quantity' => 5])
            ->assertUnprocessable()->assertJsonValidationErrors('quantity');
        $this->assertSame(3, $item->fresh()->quantity);
    }

    public function test_remove_item_only_removes_item_owned_by_current_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $product = $this->product();
        $item = CartItem::create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 1]);
        $otherItem = CartItem::create(['user_id' => $other->id, 'product_id' => $product->id, 'quantity' => 1]);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/cart/items/{$otherItem->id}")->assertNotFound();
        $this->deleteJson("/api/cart/items/{$item->id}")->assertOk()->assertJsonPath('data.subtotal', 0);
        $this->assertDatabaseHas('cart_items', ['id' => $otherItem->id]);
    }

    public function test_clear_cart_removes_all_current_user_items(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $product = $this->product();
        CartItem::create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 1]);
        CartItem::create(['user_id' => $other->id, 'product_id' => $product->id, 'quantity' => 1]);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/cart')->assertOk()->assertExactJson([
            'data' => ['items' => [], 'item_count' => 0, 'subtotal' => 0],
        ]);
        $this->assertDatabaseMissing('cart_items', ['user_id' => $user->id]);
        $this->assertDatabaseHas('cart_items', ['user_id' => $other->id]);
    }

    public function test_cart_requires_authentication(): void
    {
        $this->getJson('/api/cart')->assertUnauthorized();
    }

    private function product(int $stock = 10, int $price = 250000): Product
    {
        $category = Category::firstOrCreate(
            ['slug' => 'tram-cai'],
            ['name' => 'Trâm cài', 'description' => 'Trang sức tóc'],
        );

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Trâm Daisy',
            'slug' => 'tram-'.uniqid(),
            'description' => 'Trang sức cổ phục Việt Nam',
            'price' => $price,
            'material' => 'Đồng',
            'color' => 'Vàng',
            'stock' => $stock,
            'images' => [],
            'status' => 'published',
        ]);
    }
}
