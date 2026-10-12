<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductVariantAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_color_stock_requires_complete_values_and_explicit_adjustment(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $category = Category::create(['name' => 'Colors', 'slug' => 'colors']);
        $data = ['category_id' => $category->id, 'name' => 'Colors', 'slug' => 'colors', 'description' => 'Colors', 'price' => 100, 'material' => 'Silver', 'color' => 'Legacy colors', 'stock' => 10, 'status' => 'published', 'images' => ['/a.png', '/b.png']];
        $id = $this->postJson('/api/admin/products', $data)->assertCreated()->json('data.id');
        $variants = [['color_name' => 'Red', 'stock' => null, 'images' => ['/a.png']], ['color_name' => 'Blue', 'stock' => 0, 'images' => ['/b.png']]];
        $this->putJson("/api/admin/products/$id", array_merge($data, ['variants' => $variants]))->assertOk()->assertJsonPath('data.variants.0.stock', null)->assertJsonPath('data.variants.1.stock', 0);
        $this->putJson("/api/admin/products/$id", array_merge($data, ['inventory_mode' => 'variant', 'variants' => $variants]))->assertUnprocessable()->assertJsonValidationErrors('variants');
        $rows = Product::findOrFail($id)->variants->map(fn ($v) => ['id' => $v->id, 'color_name' => $v->color_name, 'stock' => $v->color_name === 'Red' ? 3 : 0, 'images' => $v->images])->all();
        $payload = array_merge($data, ['inventory_mode' => 'variant', 'variants' => $rows]);
        $this->putJson("/api/admin/products/$id", $payload)->assertUnprocessable()->assertJsonValidationErrors('confirm_stock_adjustment');
        $this->putJson("/api/admin/products/$id", array_merge($payload, ['confirm_stock_adjustment' => true]))->assertOk()->assertJsonPath('data.stock', 3);
        $this->assertSame(0, Product::findOrFail($id)->stock);
        $this->getJson('/api/products/colors')->assertOk()->assertJsonPath('data.stock', 3)->assertJsonPath('data.variants.0.images.0', '/a.png');
        $rows[1]['active'] = false;
        $this->putJson("/api/admin/products/$id", array_merge($payload, ['variants' => $rows]))->assertOk();
        $this->assertDatabaseHas('product_variants', ['id' => $rows[1]['id'], 'active' => false]);
        $other = Product::create(array_merge($data, ['name' => 'Other', 'slug' => 'other']));
        $foreign = $other->variants()->create(['color_name' => 'Foreign', 'stock' => 99]);
        $rows[0]['id'] = $foreign->id;
        $this->putJson("/api/admin/products/$id", array_merge($payload, ['variants' => $rows]))->assertUnprocessable()->assertJsonValidationErrors('variants');
        $this->assertSame(3, Product::findOrFail($id)->availableStock());
        $this->assertSame(99, $foreign->fresh()->stock);
    }
}
