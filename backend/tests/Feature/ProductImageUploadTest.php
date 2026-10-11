<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_upload_is_publicly_served_without_a_local_file_and_survives_disk_reset(): void
    {
        config(['product_images.storage' => 'database', 'app.url' => 'https://daisy-api.example.test']);
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $category = Category::create(['name' => 'Database', 'slug' => 'database', 'active' => true]);
        $product = Product::create([
            'category_id' => $category->id, 'name' => 'Database image', 'slug' => 'database-image',
            'description' => 'Upload', 'price' => 100, 'material' => 'Silver', 'color' => 'Silver',
            'stock' => 1, 'status' => 'published', 'images' => [],
        ]);
        $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=');
        $url = $this->post("/api/admin/products/{$product->id}/images", [
            'images' => [UploadedFile::fake()->createWithContent('Ảnh mới.PNG', $bytes)],
        ], ['Accept' => 'application/json'])->assertOk()->json('data.0');
        $this->assertStringStartsWith('https://daisy-api.example.test/storage/products/', $url);
        $this->assertSame([$url], $product->fresh()->images);
        $this->assertSame($bytes, base64_decode(ProductImage::firstOrFail()->image_data));
        $path = parse_url($url, PHP_URL_PATH);
        Storage::disk('public')->assertDirectoryEmpty('');
        $image = $this->get($path)->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->assertSame($bytes, $image->getContent());
        Storage::fake('public');
        $this->getJson('/api/products/database-image')->assertOk()->assertJsonPath('data.images.0', $url);
        $this->assertSame($bytes, $this->get($path)->assertOk()->getContent());
        $this->get($path, ['If-None-Match' => $image->headers->get('ETag')])->assertStatus(304);
        $this->get('/storage/products/missing.png')->assertNotFound();
    }

    public function test_upload_stores_image_and_persists_the_same_public_url_in_both_apis(): void
    {
        config(['product_images.storage' => 'public']);
        Storage::fake('public', ['url' => 'https://api.example.test/storage']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $category = Category::create(['name' => 'Images', 'slug' => 'images', 'active' => true]);
        $product = Product::create([
            'category_id' => $category->id, 'name' => 'Image test', 'slug' => 'image-test',
            'description' => 'Upload test', 'price' => 100, 'material' => 'Silver',
            'color' => 'Silver', 'stock' => 1, 'status' => 'published',
            'images' => ['/products/jewelry-1.svg'],
        ]);
        $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=');
        $file = UploadedFile::fake()->createWithContent('Ảnh HOA & special.PNG', $bytes);
        $response = $this->post("/api/admin/products/{$product->id}/images", ['images' => [$file]], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonCount(2, 'data');
        $url = $response->json('data.1');
        $this->assertStringStartsWith('https://api.example.test/storage/products/', $url);
        $path = substr($url, strlen('https://api.example.test/storage/'));
        Storage::disk('public')->assertExists($path);
        $this->assertSame($bytes, Storage::disk('public')->get($path));
        $this->assertSame($response->json('data'), $product->fresh()->images);
        $this->getJson("/api/admin/products/{$product->id}")->assertOk()->assertJsonPath('data.images.1', $url);
        $this->getJson('/api/products/image-test')->assertOk()
            ->assertJsonPath('data.images.0', '/products/jewelry-1.svg')
            ->assertJsonPath('data.images.1', $url);
    }

    public function test_shared_frontend_receives_relative_urls_and_legacy_loopback_urls_are_recovered(): void
    {
        config(['product_images.storage' => 'public']);
        Storage::fake('public', ['url' => '/storage']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $category = Category::create(['name' => 'Shared', 'slug' => 'shared', 'active' => true]);
        $product = Product::create([
            'category_id' => $category->id, 'name' => 'Shared image', 'slug' => 'shared-image',
            'description' => 'Shared upload', 'price' => 100, 'material' => 'Silver',
            'color' => 'Silver', 'stock' => 1, 'status' => 'published',
            'images' => ['http://localhost:8000/storage/products/old.png', 'http://127.0.0.1/storage/products/older.png', 'https://cdn.example.test/photo.png', '/products/jewelry-1.svg'],
        ]);
        $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=');
        $response = $this->post("/api/admin/products/{$product->id}/images", [
            'images' => [UploadedFile::fake()->createWithContent('new.png', $bytes)],
        ], ['Accept' => 'application/json'])->assertOk()
            ->assertJsonPath('data.0', '/storage/products/old.png')
            ->assertJsonPath('data.1', '/storage/products/older.png')
            ->assertJsonPath('data.2', 'https://cdn.example.test/photo.png')
            ->assertJsonPath('data.3', '/products/jewelry-1.svg');
        $url = $response->json('data.4');
        $this->assertStringStartsWith('/storage/products/', $url);
        $this->assertSame($url, $product->fresh()->images[4]);
        Storage::disk('public')->assertExists(substr($url, strlen('/storage/')));
        foreach (["/api/admin/products/{$product->id}", '/api/products/shared-image'] as $endpoint) {
            $this->getJson($endpoint)->assertOk()
                ->assertJsonPath('data.images.0', '/storage/products/old.png')
                ->assertJsonPath('data.images.4', $url);
        }
    }
}
