<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Services\ProductGalleryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductGalleryTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_and_cover_persist_and_removing_cover_restores_fallback(): void
    {
        $product = $this->product();
        $service = app(ProductGalleryService::class);
        $product->update($service->metadata(['images' => ['/b.png', '/a.png'], 'cover_image' => '/a.png'], $product));
        $this->getJson('/api/products/gallery')->assertOk()->assertJsonPath('data.images.0', '/b.png')->assertJsonPath('data.cover_image', '/a.png');
        $product = $product->fresh();
        $product->update($service->metadata(['images' => ['/b.png']], $product));
        $this->getJson('/api/products/gallery')->assertOk()->assertJsonPath('data.cover_image', null)->assertJsonPath('data.images.0', '/b.png');
    }

    public function test_upload_enforces_total_limit_without_losing_existing_images(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $product = $this->product();
        $images = array_map(fn ($i) => "/{$i}.png", range(1, 8));
        $product->update(['images' => $images]);
        $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=');
        $this->post("/api/admin/products/{$product->id}/images", ['images' => [UploadedFile::fake()->createWithContent('new.png', $bytes)]], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('images');
        $this->assertSame($images, $product->fresh()->images);
    }

    private function product(): Product
    {
        $category = Category::create(['name' => 'Gallery', 'slug' => 'gallery']);

        return Product::create(['category_id' => $category->id, 'name' => 'Gallery', 'slug' => 'gallery', 'description' => 'Gallery', 'price' => 100, 'material' => 'Silver', 'color' => 'Silver', 'stock' => 2, 'status' => 'published', 'images' => ['/a.png', '/b.png']]);
    }
}
